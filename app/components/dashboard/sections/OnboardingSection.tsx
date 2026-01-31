"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Calendar, Zap, Shield } from 'lucide-react';

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

export function OnboardingSection() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<OnboardedUsersDataPoint[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOnboardedUsersData();
    }, []);

    const fetchOnboardedUsersData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/onboarded-users');
            if (!response.ok) {
                throw new Error('Failed to fetch onboarded users data');
            }

            const result: OnboardedUsersResponse = await response.json();
            setData(result.data);
            setTotalUsers(result.totalUsers);
        } catch (err: any) {
            console.error('Error fetching onboarded users:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: any) => {
        if (!date) return "";
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStats = () => {
        if (data.length === 0) return { firstDate: 'N/A', lastDate: 'N/A', avgPerDay: 0 };

        const firstDate = data[0].date;
        const lastDate = data[data.length - 1].date;
        const daysDiff = Math.max(
            1,
            Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24))
        );
        const avgPerDay = (totalUsers / daysDiff).toFixed(2);

        return {
            firstDate: formatDate(firstDate),
            lastDate: formatDate(lastDate),
            avgPerDay: parseFloat(avgPerDay),
        };
    };

    const stats = getStats();

    return (
        <div className="space-y-8">

            {error && (
                <div className="mb-6 p-4 border border-red-500 bg-red-500/10 text-red-400">
                    <p className="font-bold mb-1 font-mono text-xs">ERROR</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-[var(--accent)]" />
                        <p className="font-mono text-xs text-[var(--text-muted)]">TOTAL USERS</p>
                    </div>
                    <p className="text-3xl font-display">{loading ? '...' : totalUsers.toLocaleString()}</p>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
                        <p className="font-mono text-xs text-[var(--text-muted)]">AVG PER DAY</p>
                    </div>
                    <p className="text-3xl font-display">{loading ? '...' : stats.avgPerDay}</p>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-[var(--accent)]" />
                        <p className="font-mono text-xs text-[var(--text-muted)]">DATE RANGE</p>
                    </div>
                    <p className="text-sm font-display pt-2">
                        {loading ? '...' : `${stats.firstDate} - ${stats.lastDate}`}
                    </p>
                </div>
            </div>

            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                <h2 className="text-xl font-display mb-8 flex items-center gap-2 uppercase">
                    <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
                    Growth Trends
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-40">
                        <div className="animate-pulse font-mono text-[var(--text-muted)]">LOADING ANALYTICS...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center py-40 font-mono text-[var(--text-muted)]">
                        NO DATA AVAILABLE
                    </div>
                ) : (
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-xs font-mono font-bold mb-6 text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-3 w-3 text-accent" /> Cumulative Onboarding
                            </h3>
                            <div className="h-[400px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDate}
                                            stroke="var(--text-muted)"
                                            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' } as any}
                                        />
                                        <YAxis
                                            stroke="var(--text-muted)"
                                            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' } as any}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--bg-deep)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 0,
                                                fontFamily: 'monospace',
                                                fontSize: '12px'
                                            }}
                                            labelStyle={{ color: 'var(--text-primary)', marginBottom: '8px' }}
                                            itemStyle={{ padding: '2px 0' }}
                                            labelFormatter={formatDate}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                color: 'var(--text-primary)',
                                                fontFamily: 'monospace',
                                                fontSize: '10px',
                                                paddingTop: '30px'
                                            } as any}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeTotal"
                                            stroke="var(--accent)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: 'var(--accent)' }}
                                            name="TOTAL"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeHyperliquid"
                                            stroke="#8b5cf6"
                                            strokeWidth={1.5}
                                            strokeDasharray="5 5"
                                            dot={false}
                                            name="HYPERLIQUID"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeOstium"
                                            stroke="#3b82f6"
                                            strokeWidth={1.5}
                                            strokeDasharray="5 5"
                                            dot={false}
                                            name="OSTIUM"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-mono font-bold mb-6 text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-3 w-3 text-[#10b981]" /> Daily Velocity
                            </h3>
                            <div className="h-[400px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDate}
                                            stroke="var(--text-muted)"
                                            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' } as any}
                                        />
                                        <YAxis
                                            stroke="var(--text-muted)"
                                            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' } as any}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--bg-deep)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 0,
                                                fontFamily: 'monospace',
                                                fontSize: '12px'
                                            }}
                                            labelStyle={{ color: 'var(--text-primary)', marginBottom: '8px' }}
                                            itemStyle={{ padding: '2px 0' }}
                                            labelFormatter={formatDate}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                color: 'var(--text-primary)',
                                                fontFamily: 'monospace',
                                                fontSize: '10px',
                                                paddingTop: '30px'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#10b981' }}
                                            name="TOTAL NEW"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="hyperliquid"
                                            stroke="#8b5cf6"
                                            strokeWidth={1.5}
                                            strokeDasharray="3 3"
                                            dot={false}
                                            name="HYPERLIQUID NEW"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="ostium"
                                            stroke="#3b82f6"
                                            strokeWidth={1.5}
                                            strokeDasharray="3 3"
                                            dot={false}
                                            name="OSTIUM NEW"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
