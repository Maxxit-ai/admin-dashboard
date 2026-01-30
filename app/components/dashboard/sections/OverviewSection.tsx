"use client";

import { StatCard, SmallStatCard } from "@/app/components/ui/StatCard";
import { MiniChart } from "@/app/components/ui/MiniChart";
import type { DashboardStats } from "@/lib/api";

interface OverviewSectionProps {
    stats: DashboardStats | undefined;
    isLoading: boolean;
    lastUpdated?: string;
}

function formatPnl(pnl: number): string {
    const formatted = Math.abs(pnl).toFixed(2);
    return pnl >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

export function OverviewSection({
    stats,
    isLoading,
    lastUpdated,
}: OverviewSectionProps) {
    return (
        <div className="space-y-6">
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="TOTAL AGENTS"
                    value={stats?.overview.totalAgents ?? 0}
                    subValue={
                        stats
                            ? `${stats.overview.publicAgents} public, ${stats.overview.privateAgents} private`
                            : undefined
                    }
                    icon="🤖"
                    isLoading={isLoading}
                />
                <StatCard
                    label="ACTIVE DEPLOYMENTS"
                    value={stats?.overview.activeDeployments ?? 0}
                    subValue={
                        stats
                            ? `${stats.overview.totalDeployments} total, ${stats.overview.pausedDeployments} paused`
                            : undefined
                    }
                    trend="up"
                    icon="🚀"
                    isLoading={isLoading}
                />
                <StatCard
                    label="OPEN POSITIONS"
                    value={stats?.overview.openPositions ?? 0}
                    subValue={
                        stats ? `${stats.overview.totalPositions} total positions` : undefined
                    }
                    icon="📊"
                    isLoading={isLoading}
                />
                <StatCard
                    label="TOTAL PNL"
                    value={stats ? formatPnl(stats.overview.totalPnl) : "$0.00"}
                    trend={
                        stats
                            ? stats.overview.totalPnl >= 0
                                ? "up"
                                : "down"
                            : "neutral"
                    }
                    icon="💰"
                    isLoading={isLoading}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <SmallStatCard
                    label="SIGNALS"
                    value={stats?.overview.totalSignals ?? 0}
                    isLoading={isLoading}
                    accent
                />
                <SmallStatCard
                    label="TELEGRAM USERS"
                    value={stats?.overview.totalTelegramUsers ?? 0}
                    isLoading={isLoading}
                />
                <SmallStatCard
                    label="CT ACCOUNTS"
                    value={stats?.overview.totalCtAccounts ?? 0}
                    isLoading={isLoading}
                />
                <SmallStatCard
                    label="RESEARCH INST."
                    value={stats?.overview.totalResearchInstitutes ?? 0}
                    isLoading={isLoading}
                />
                <SmallStatCard
                    label="BILLING EVENTS"
                    value={stats?.overview.totalBillingEvents ?? 0}
                    isLoading={isLoading}
                />
                <SmallStatCard
                    label="CLOSED TRADES"
                    value={stats?.overview.closedPositions ?? 0}
                    isLoading={isLoading}
                />
            </div>

            {/* Daily Activity Chart */}
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="data-label">SIGNALS (LAST 30 DAYS)</p>
                    <p className="text-xs text-[var(--text-muted)]">
                        {stats?.dailyStats.reduce((sum, d) => sum + d.signals, 0) ?? 0} total
                    </p>
                </div>
                {isLoading ? (
                    <div className="h-24 bg-[var(--border)] rounded animate-pulse" />
                ) : (
                    <MiniChart
                        data={stats?.dailyStats.map((d) => d.signals) ?? []}
                        height={100}
                    />
                )}
                {stats && stats.dailyStats.length > 0 && (
                    <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
                        <span>{stats.dailyStats[0]?.date}</span>
                        <span>{stats.dailyStats[stats.dailyStats.length - 1]?.date}</span>
                    </div>
                )}
            </div>

            {/* Footer with Metrics */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-[var(--text-muted)] font-mono">
                    {stats?.meta?.duration && (
                        <span>Data indexed in <span className="text-accent">{stats.meta.duration}</span></span>
                    )}
                </div>
                {lastUpdated && (
                    <div className="text-right text-xs text-[var(--text-muted)]">
                        Last updated: <span className="font-mono text-accent">{lastUpdated}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
