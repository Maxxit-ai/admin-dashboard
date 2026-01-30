import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { batchGetEthBalances } from "@/lib/multicall";

// Singleton Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// RPC endpoint for Arbitrum
const ARBITRUM_RPC = process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";

interface AgentWithStats {
  id: string;
  name: string;
  venue: string;
  creatorWallet: string;
  profitReceiverAddress: string;
  status: string | null;
  apr30d: number | null;
  apr90d: number | null;
  sharpe30d: number | null;
  subscriberCount: number;
  activeSubscribers: number;
  totalPositions: number;
  openPositions: number;
  totalSignals: number;
  totalPnl: number;
  walletBalance: string | null;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC);

    // 1. Fetch all counts and sums in parallel
    const [
      overviewCounts,
      pnlAggregate,
      agentsData,
      auditLogs,
    ] = await Promise.all([
      // Overview counts
      Promise.all([
        prisma.agents.count().catch(() => 0),
        prisma.agents.count({ where: { status: "PUBLIC" } }).catch(() => 0),
        prisma.agents.count({ where: { status: "PRIVATE" } }).catch(() => 0),
        prisma.agents.count({ where: { status: "DRAFT" } }).catch(() => 0),
        prisma.agent_deployments.count().catch(() => 0),
        prisma.agent_deployments.count({ where: { status: "ACTIVE" } }).catch(() => 0),
        prisma.agent_deployments.count({ where: { status: "PAUSED" } }).catch(() => 0),
        prisma.positions.count().catch(() => 0),
        prisma.positions.count({ where: { status: "OPEN" } }).catch(() => 0),
        prisma.positions.count({ where: { closed_at: { not: null } } }).catch(() => 0),
        prisma.signals.count().catch(() => 0),
        prisma.billing_events.count().catch(() => 0),
        prisma.telegram_users.count().catch(() => 0),
        prisma.ct_accounts.count().catch(() => 0),
        prisma.research_institutes.count().catch(() => 0),
      ]),
      // PnL Aggregate
      prisma.positions.aggregate({
        _sum: { pnl: true },
        where: { pnl: { not: null } },
      }).catch(() => ({ _sum: { pnl: 0 } })),
      // Agents with nested status for processing
      prisma.agents.findMany({
        select: {
          id: true,
          name: true,
          venue: true,
          creator_wallet: true,
          profit_receiver_address: true,
          status: true,
          apr_30d: true,
          apr_90d: true,
          sharpe_30d: true,
          agent_deployments: {
            select: {
              id: true,
              status: true,
              positions: {
                select: {
                  status: true,
                  pnl: true,
                }
              }
            }
          },
          _count: {
            select: {
              signals: true,
            }
          }
        },
        orderBy: { apr_30d: "desc" },
      }).catch(() => []),
      // Audit logs
      prisma.audit_logs.findMany({
        orderBy: { occurred_at: "desc" },
        take: 20,
      }).catch(() => []),
    ]);

    const [
      totalAgents, publicAgents, privateAgents, draftAgents,
      totalDeployments, activeDeployments, pausedDeployments,
      totalPositions, openPositions, closedPositions,
      totalSignals, totalBillingEvents, totalTelegramUsers,
      totalCtAccounts, totalResearchInstitutes
    ] = overviewCounts;

    const totalPnl = pnlAggregate._sum.pnl ? Number(pnlAggregate._sum.pnl) : 0;

    // 2. Batch fetch agent balances using Multicall3
    const profitReceiverAddresses = agentsData
      .map(a => a.profit_receiver_address)
      .filter((addr): addr is string => !!addr);

    console.log(`[Dashboard Stats] Batch fetching ${profitReceiverAddresses.length} agent balances...`);
    const balanceMap = await batchGetEthBalances(provider, profitReceiverAddresses);

    // 3. Process agent stats locally
    const agentsWithStats: AgentWithStats[] = agentsData.map((agent: any) => {
      let agentTotalPositions = 0;
      let agentOpenPositions = 0;
      let agentTotalPnl = 0;

      agent.agent_deployments.forEach((d: any) => {
        agentTotalPositions += d.positions.length;
        d.positions.forEach((p: any) => {
          if (p.status === "OPEN") agentOpenPositions++;
          if (p.pnl) agentTotalPnl += Number(p.pnl);
        });
      });

      const walletBalance = agent.profit_receiver_address
        ? balanceMap.get(agent.profit_receiver_address.toLowerCase()) || "0"
        : "0";

      return {
        id: agent.id,
        name: agent.name,
        venue: agent.venue,
        creatorWallet: agent.creator_wallet,
        profitReceiverAddress: agent.profit_receiver_address,
        status: agent.status,
        apr30d: agent.apr_30d,
        apr90d: agent.apr_90d,
        sharpe30d: agent.sharpe_30d,
        subscriberCount: agent.agent_deployments.length,
        activeSubscribers: agent.agent_deployments.filter((d: any) => d.status === "ACTIVE").length,
        totalPositions: agentTotalPositions,
        openPositions: agentOpenPositions,
        totalSignals: agent._count.signals,
        totalPnl: agentTotalPnl,
        walletBalance,
      };
    });

    // 4. Venue breakdown (optimized with counts)
    const venues = ["HYPERLIQUID", "OSTIUM", "GMX", "SPOT", "MULTI"];
    const venueBreakdown = await Promise.all(venues.map(async (venue) => {
      const [vAgentCount, vDeploymentCount, vPositionCount] = await Promise.all([
        prisma.agents.count({ where: { venue: venue as any } }).catch(() => 0),
        prisma.agent_deployments.count({ where: { agents: { venue: venue as any } } }).catch(() => 0),
        prisma.positions.count({ where: { venue: venue as any } }).catch(() => 0),
      ]);
      return { venue, agentCount: vAgentCount, deploymentCount: vDeploymentCount, positionCount: vPositionCount };
    }));

    // 5. Daily stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Use raw query or optimized group by for daily stats if needed, 
    // but stay with simple prisma for now as it's usually fast for 30 days
    const [dailySignals, dailyPositions] = await Promise.all([
      prisma.signals.findMany({
        where: { created_at: { gte: thirtyDaysAgo } },
        select: { created_at: true },
      }).catch(() => []),
      prisma.positions.findMany({
        where: { opened_at: { gte: thirtyDaysAgo } },
        select: { opened_at: true },
      }).catch(() => []),
    ]);

    const dailyStatsMap = new Map<string, { signals: number; positions: number; pnl: number }>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyStatsMap.set(date.toISOString().split("T")[0], { signals: 0, positions: 0, pnl: 0 });
    }

    dailySignals.forEach((s: any) => {
      const d = s.created_at.toISOString().split("T")[0];
      if (dailyStatsMap.has(d)) dailyStatsMap.get(d)!.signals++;
    });
    dailyPositions.forEach((p: any) => {
      const d = p.opened_at.toISOString().split("T")[0];
      if (dailyStatsMap.has(d)) dailyStatsMap.get(d)!.positions++;
    });

    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const duration = Date.now() - startTime;
    console.log(`[Dashboard Stats] Completed in ${duration}ms`);

    return NextResponse.json({
      overview: {
        totalAgents, publicAgents, privateAgents, draftAgents,
        totalDeployments, activeDeployments, pausedDeployments,
        totalPositions, openPositions, closedPositions,
        totalSignals, totalPnl,
        totalBillingEvents, totalTelegramUsers, totalCtAccounts, totalResearchInstitutes
      },
      agents: agentsWithStats,
      recentActivity: auditLogs.map((log: any) => ({
        type: log.event_name,
        description: `${log.event_name} on ${log.subject_type || "system"}`,
        timestamp: log.occurred_at.toISOString(),
        metadata: log.payload,
      })),
      venueBreakdown,
      dailyStats,
      meta: {
        duration: `${duration}ms`,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("[Dashboard Stats] Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
