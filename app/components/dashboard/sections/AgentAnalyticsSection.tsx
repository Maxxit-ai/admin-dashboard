"use client";

import { useEffect, useState } from "react";
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { fetchAgentAnalytics, type AgentAnalyticsData } from "@/lib/api";
import { StatCard } from "@/app/components/ui/StatCard";
import { Users, TrendingUp, BarChart3, Radio } from "lucide-react";

export function AgentAnalyticsSection() {
    const [data, setData] = useState<AgentAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const analytics = await fetchAgentAnalytics();
                setData(analytics);
            } catch (error) {
                console.error("Failed to load agent analytics:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--bg-deep)] border border-[var(--border)] p-3 shadow-xl">
                    <p className="text-[10px] font-mono text-[var(--text-muted)] mb-2 uppercase">
                        {label}
                    </p>
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                            <span className="text-[10px] font-mono uppercase" style={{ color: p.color || p.fill }}>
                                {p.name}:
                            </span>
                            <span className="text-sm font-bold font-mono">
                                {p.name.includes("PNL") ? `$${p.value}` : p.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-80 bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="TOTAL SUBSCRIBERS"
                    value={data.topStats.totalSubscribers}
                    subValue={`${data.topStats.activeSubscribers} active deployments`}
                    icon={<Users className="h-4 w-4" />}
                    tooltip="Total number of agent deployments created all-time."
                />
                <StatCard
                    label="30D NET PNL"
                    value={`$${data.topStats.netPnL30d}`}
                    trend={Number(data.topStats.netPnL30d) >= 0 ? "up" : "down"}
                    icon={<TrendingUp className="h-4 w-4" />}
                    tooltip="Sum of profit and loss from all trades closed in the last 30 days."
                />
                <StatCard
                    label="30D SIGNALS"
                    value={data.topStats.totalSignals30d}
                    icon={<Radio className="h-4 w-4" />}
                    tooltip="Total number of trading signals generated in the last 30 days."
                />
                <StatCard
                    label="ACTIVE RATE"
                    value={`${((data.topStats.activeSubscribers / data.topStats.totalSubscribers) * 100).toFixed(1)}%`}
                    icon={<BarChart3 className="h-4 w-4" />}
                    tooltip="Percentage of total deployments that are currently in ACTIVE status."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deployment Growth Chart */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6">
                    <div className="mb-6">
                        <p className="data-label mb-1 uppercase tracking-wider">Subscriber Growth</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Cumulative Agent Deployments (30 Days)</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.daily}>
                                <defs>
                                    <linearGradient id="colorDeploy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-muted)"
                                    fontSize={10}
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="var(--text-muted)"
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    name="Subscribers"
                                    type="monotone"
                                    dataKey="deployments"
                                    stroke="var(--accent)"
                                    fillOpacity={1}
                                    fill="url(#colorDeploy)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* PnL Performance Chart */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6">
                    <div className="mb-6">
                        <p className="data-label mb-1 uppercase tracking-wider">PnL Performance</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Cumulative Profit/Loss Trend (30 Days)</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.daily}>
                                <defs>
                                    <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-muted)"
                                    fontSize={10}
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="var(--text-muted)"
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    name="Cumulative PNL"
                                    type="monotone"
                                    dataKey="cumulativePnL"
                                    stroke="var(--accent)"
                                    fillOpacity={1}
                                    fill="url(#colorPnL)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Signal Venue Activity Chart */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 lg:col-span-2">
                    <div className="mb-6">
                        <p className="data-label mb-1 uppercase tracking-wider">Signal Volume by Venue</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Daily signals per exchange</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-muted)"
                                    fontSize={10}
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="var(--text-muted)"
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{
                                        paddingTop: '20px',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '10px',
                                        textTransform: 'uppercase'
                                    }}
                                />
                                <Bar name="Ostium" dataKey="signalsByVenue.OSTIUM" fill="var(--accent)" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
