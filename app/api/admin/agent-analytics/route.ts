import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        // 1. Fetch data in parallel
        const [deployments, closedPositions, signals, topStats] = await Promise.all([
            // Deployment growth
            prisma.agent_deployments.findMany({
                where: { sub_started_at: { gte: thirtyDaysAgo } },
                select: { sub_started_at: true },
                orderBy: { sub_started_at: "asc" },
            }).catch(() => []),

            // PnL performance (using closed positions)
            prisma.positions.findMany({
                where: {
                    closed_at: { gte: thirtyDaysAgo },
                    pnl: { not: null }
                },
                select: { closed_at: true, pnl: true },
                orderBy: { closed_at: "asc" },
            }).catch(() => []),

            // Signal activity
            prisma.signals.findMany({
                where: { created_at: { gte: thirtyDaysAgo } },
                select: { created_at: true, venue: true },
                orderBy: { created_at: "asc" },
            }).catch(() => []),

            // Top level stats
            Promise.all([
                prisma.agent_deployments.count(),
                prisma.agent_deployments.count({ where: { status: "ACTIVE" } }),
                prisma.signals.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
                prisma.positions.aggregate({
                    _sum: { pnl: true },
                    where: { closed_at: { gte: thirtyDaysAgo } }
                })
            ]).catch(() => [0, 0, 0, { _sum: { pnl: 0 } }])
        ]);

        // 2. Process daily data
        const dailyMap = new Map<string, any>();

        // Initialize 30 days
        for (let i = 0; i <= 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (30 - i));
            const dateStr = d.toISOString().split("T")[0];
            dailyMap.set(dateStr, {
                date: dateStr,
                deployments: 0,
                cumulativePnL: 0,
                signals: 0,
                signalsByVenue: {} as Record<string, number>,
            });
        }

        // Group deployments
        deployments.forEach((dep) => {
            const dateStr = dep.sub_started_at.toISOString().split("T")[0];
            if (dailyMap.has(dateStr)) {
                dailyMap.get(dateStr).deployments += 1;
            }
        });

        // Group PnL
        closedPositions.forEach((pos) => {
            const dateStr = pos.closed_at!.toISOString().split("T")[0];
            if (dailyMap.has(dateStr)) {
                dailyMap.get(dateStr).cumulativePnL += Number(pos.pnl || 0);
            }
        });

        // Group Signals
        signals.forEach((sig) => {
            const dateStr = sig.created_at.toISOString().split("T")[0];
            if (dailyMap.has(dateStr)) {
                const entry = dailyMap.get(dateStr);
                entry.signals += 1;
                entry.signalsByVenue[sig.venue] = (entry.signalsByVenue[sig.venue] || 0) + 1;
            }
        });

        // 3. Calculate cumulative values
        const dailyArray = Array.from(dailyMap.values());

        // Starting deployment count (total count before 30 days ago)
        let rollingDeployments = await prisma.agent_deployments.count({
            where: { sub_started_at: { lt: thirtyDaysAgo } }
        }).catch(() => 0);

        let rollingPnL = 0;

        dailyArray.forEach((day) => {
            rollingDeployments += day.deployments;
            rollingPnL += day.cumulativePnL;
            day.deployments = rollingDeployments;
            day.cumulativePnL = Number(rollingPnL.toFixed(2));
        });

        const pnlAgg = topStats[3] as { _sum: { pnl: number | null } };

        return NextResponse.json({
            daily: dailyArray,
            topStats: {
                totalSubscribers: topStats[0],
                activeSubscribers: topStats[1],
                totalSignals30d: topStats[2],
                netPnL30d: Number(pnlAgg._sum.pnl || 0).toFixed(2),
            },
        });
    } catch (error) {
        console.error("Agent analytics error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
