"use client";

import { useState, useMemo } from "react";
import { StatusBadge, VenueBadge } from "@/app/components/ui/Badge";
import type { AgentWithStats } from "@/lib/api";

interface AgentsSectionProps {
    agents: AgentWithStats[] | undefined;
    isLoading: boolean;
}

function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatPnl(pnl: number): string {
    const formatted = Math.abs(pnl).toFixed(2);
    return pnl >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

function formatEth(balance: string | null): string {
    if (!balance) return "—";
    const num = parseFloat(balance);
    if (num < 0.0001) return "< 0.0001";
    return num.toFixed(4);
}

type SortKey = "subscribers" | "pnl" | "positions" | "name";

export function AgentsSection({ agents, isLoading }: AgentsSectionProps) {
    const [sortBy, setSortBy] = useState<SortKey>("subscribers");

    const sortedAgents = useMemo(() => {
        if (!agents) return [];

        return [...agents].sort((a, b) => {
            switch (sortBy) {
                case "subscribers":
                    return b.subscriberCount - a.subscriberCount;
                case "pnl":
                    return b.totalPnl - a.totalPnl;
                case "positions":
                    return b.totalPositions - a.totalPositions;
                case "name":
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    }, [agents, sortBy]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="h-8 w-24 bg-[var(--border)] rounded animate-pulse"
                        />
                    ))}
                </div>
                <div className="border border-[var(--border)] overflow-hidden">
                    <div className="bg-[var(--bg-elevated)] p-4">
                        <div className="h-4 w-32 bg-[var(--border)] rounded animate-pulse" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="p-4 border-t border-[var(--border)] animate-pulse"
                        >
                            <div className="flex gap-4">
                                <div className="h-4 w-32 bg-[var(--border)] rounded" />
                                <div className="h-4 w-20 bg-[var(--border)] rounded" />
                                <div className="h-4 w-16 bg-[var(--border)] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Sort Controls */}
            <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-[var(--text-muted)]">Sort by:</span>
                {(["subscribers", "pnl", "positions", "name"] as const).map((sort) => (
                    <button
                        key={sort}
                        onClick={() => setSortBy(sort)}
                        className={`px-3 py-1.5 text-xs uppercase transition-colors ${sortBy === sort
                                ? "bg-accent text-[var(--bg-deep)]"
                                : "border border-[var(--border)] hover:border-accent hover:text-accent"
                            }`}
                    >
                        {sort}
                    </button>
                ))}
            </div>

            {/* Agents Table */}
            <div className="border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-4 py-3 text-left font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Agent
                                </th>
                                <th className="px-4 py-3 text-left font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Venue
                                </th>
                                <th className="px-4 py-3 text-left font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-center font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Subscribers
                                </th>
                                <th className="px-4 py-3 text-center font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Positions
                                </th>
                                <th className="px-4 py-3 text-center font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Signals
                                </th>
                                <th className="px-4 py-3 text-right font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Total PnL
                                </th>
                                <th className="px-4 py-3 text-right font-mono text-xs text-[var(--text-muted)] uppercase">
                                    30D APR
                                </th>
                                <th className="px-4 py-3 text-right font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Wallet (ETH)
                                </th>
                                <th className="px-4 py-3 text-left font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Profit Wallet
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {sortedAgents.map((agent, idx) => (
                                <tr
                                    key={agent.id}
                                    className="hover:bg-[var(--bg-surface)] transition-colors"
                                >
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-[var(--text-muted)] font-mono">
                                                #{String(idx + 1).padStart(2, "0")}
                                            </span>
                                            <div>
                                                <p className="font-bold">{agent.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {formatAddress(agent.creatorWallet)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <VenueBadge venue={agent.venue} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={agent.status} />
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="font-display text-xl">
                                            {agent.subscriberCount}
                                        </span>
                                        {agent.activeSubscribers > 0 && (
                                            <span className="text-xs text-accent ml-1">
                                                ({agent.activeSubscribers} active)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="font-display text-xl">
                                            {agent.totalPositions}
                                        </span>
                                        {agent.openPositions > 0 && (
                                            <span className="text-xs text-accent ml-1">
                                                ({agent.openPositions} open)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center font-mono">
                                        {agent.totalSignals}
                                    </td>
                                    <td
                                        className={`px-4 py-4 text-right font-mono ${agent.totalPnl >= 0
                                                ? "text-accent"
                                                : "text-[var(--danger)]"
                                            }`}
                                    >
                                        {formatPnl(agent.totalPnl)}
                                    </td>
                                    <td
                                        className={`px-4 py-4 text-right font-mono ${agent.apr30d && agent.apr30d > 0 ? "text-accent" : ""
                                            }`}
                                    >
                                        {agent.apr30d != null
                                            ? `${agent.apr30d > 0 ? "+" : ""}${agent.apr30d.toFixed(1)}%`
                                            : "—"}
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono">
                                        {formatEth(agent.walletBalance)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <a
                                            href={`https://arbiscan.io/address/${agent.profitReceiverAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-accent hover:underline"
                                        >
                                            {formatAddress(agent.profitReceiverAddress)}
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {sortedAgents.length === 0 && (
                <div className="border border-[var(--border)] p-12 text-center">
                    <p className="text-[var(--text-muted)]">No agents found</p>
                </div>
            )}
        </div>
    );
}
