import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";

// Singleton Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

interface OnboardedUsersDataPoint {
    date: string;
    total: number;
    hyperliquid: number;
    ostium: number;
    cumulativeTotal: number;
    cumulativeHyperliquid: number;
    cumulativeOstium: number;
}

interface OnboardedUsersResponse {
    data: OnboardedUsersDataPoint[];
    totalUsers: number;
}

export async function GET() {
    try {
        const userAddresses = await prisma.user_agent_addresses.findMany({
            select: {
                created_at: true,
                hyperliquid_agent_address: true,
                ostium_agent_address: true,
            } as any,
            orderBy: {
                created_at: 'asc',
            } as any,
        });

        const dateMap = new Map<string, { total: number; hyperliquid: number; ostium: number }>();

        userAddresses.forEach((user: any) => {
            const dateKey = user.created_at.toISOString().split('T')[0];
            const current = dateMap.get(dateKey) || { total: 0, hyperliquid: 0, ostium: 0 };

            dateMap.set(dateKey, {
                total: current.total + 1,
                hyperliquid: current.hyperliquid + (user.hyperliquid_agent_address ? 1 : 0),
                ostium: current.ostium + (user.ostium_agent_address ? 1 : 0),
            });
        });

        let cumulativeTotal = 0;
        let cumulativeHyperliquid = 0;
        let cumulativeOstium = 0;
        const dataPoints: OnboardedUsersDataPoint[] = [];

        const sortedDates = Array.from(dateMap.keys()).sort();

        sortedDates.forEach((date) => {
            const counts = dateMap.get(date)!;
            cumulativeTotal += counts.total;
            cumulativeHyperliquid += counts.hyperliquid;
            cumulativeOstium += counts.ostium;

            dataPoints.push({
                date,
                total: counts.total,
                hyperliquid: counts.hyperliquid,
                ostium: counts.ostium,
                cumulativeTotal,
                cumulativeHyperliquid,
                cumulativeOstium,
            });
        });

        return NextResponse.json({
            data: dataPoints,
            totalUsers: userAddresses.length,
        });
    } catch (error: any) {
        console.error('[Onboarded Users API] Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch onboarded users data' },
            { status: 500 }
        );
    }
}
