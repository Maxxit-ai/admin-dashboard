"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Zap, Activity } from 'lucide-react';
import { StatCard } from '@/app/components/ui/StatCard';

interface TradingVolumeDataPoint {
    date: string;
    mainnetVolume: number;
    testnetVolume: number;
    mainnetTrades: number;
    testnetTrades: number;
    cumulativeMainnetVolume: number;
    cumulativeTestnetVolume: number;
    cumulativeMainnetTrades: number;
    cumulativeTestnetTrades: number;
}

interface TradingVolumeResponse {
    data: TradingVolumeDataPoint[];
    totals: {
        mainnetVolume: number;
        testnetVolume: number;
        mainnetTrades: number;
        testnetTrades: number;
    };
}

export function TradingVolumeSection() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<TradingVolumeDataPoint[]>([]);
    const [totals, setTotals] = useState({ mainnetVolume: 0, testnetVolume: 0, mainnetTrades: 0, testnetTrades: 0 });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTradingVolumeData();
    }, []);

    const fetchTradingVolumeData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/trading-volume');
            if (!response.ok) {
                throw new Error('Failed to fetch trading volume data');
            }

            const result: TradingVolumeResponse = await response.json();
            setData(result.data);
            setTotals(result.totals);
        } catch (err: any) {
            console.error('Error fetching trading volume:', err);
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

    const formatVolume = (volume: number) => {
        if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
        if (volume >= 1000) return `$${(volume / 1000).toFixed(2)}K`;
        return `$${volume.toFixed(2)}`;
    };

    const getStats = () => {
        if (data.length === 0) return { firstDate: 'N/A', lastDate: 'N/A' };

        const firstDate = data[0].date;
        const lastDate = data[data.length - 1].date;

        return {
            firstDate: formatDate(firstDate),
            lastDate: formatDate(lastDate),
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="MAINNET VOLUME"
                    value={loading ? '...' : formatVolume(totals.mainnetVolume)}
                    icon="💰"
                    tooltip="Total trading volume on mainnet (Ostium Production)"
                />

                <StatCard
                    label="TESTNET VOLUME"
                    value={loading ? '...' : formatVolume(totals.testnetVolume)}
                    icon="🧪"
                    tooltip="Total trading volume on testnet (Ostium Sepolia)"
                />

                <StatCard
                    label="MAINNET TRADES"
                    value={loading ? '...' : totals.mainnetTrades.toLocaleString()}
                    icon="📊"
                />

                <StatCard
                    label="TESTNET TRADES"
                    value={loading ? '...' : totals.testnetTrades.toLocaleString()}
                    icon="🔬"
                />
            </div>

            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                <h2 className="text-xl font-display mb-8 flex items-center gap-2 uppercase">
                    <Activity className="h-5 w-5 text-[var(--accent)]" />
                    Trading Volume Trends
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-40">
                        <div className="animate-pulse font-mono text-[var(--text-muted)]">LOADING VOLUME DATA...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex items-center justify-center py-40 font-mono text-[var(--text-muted)]">
                        NO TRADING DATA AVAILABLE
                    </div>
                ) : (
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-xs font-mono font-bold mb-6 text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-3 w-3 text-accent" /> Cumulative Trading Volume
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
                                            tickFormatter={(value) => formatVolume(value)}
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
                                            formatter={(value) => formatVolume(Number(value ?? 0))}
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
                                            dataKey="cumulativeMainnetVolume"
                                            stroke="var(--accent)"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: 'var(--accent)' }}
                                            name="MAINNET"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeTestnetVolume"
                                            stroke="#f59e0b"
                                            strokeWidth={1.5}
                                            strokeDasharray="5 5"
                                            dot={false}
                                            name="TESTNET"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-mono font-bold mb-6 text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-[#10b981]" /> Daily Trading Volume
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
                                            tickFormatter={(value) => formatVolume(value)}
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
                                            formatter={(value) => formatVolume(Number(value ?? 0))}
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
                                            dataKey="mainnetVolume"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#10b981' }}
                                            name="MAINNET DAILY"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="testnetVolume"
                                            stroke="#f59e0b"
                                            strokeWidth={1.5}
                                            strokeDasharray="3 3"
                                            dot={false}
                                            name="TESTNET DAILY"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-mono font-bold mb-6 text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-3 w-3 text-[#3b82f6]" /> Trade Count Over Time
                            </h3>
                            <div className="h-[300px] w-full mt-4">
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
                                            dataKey="cumulativeMainnetTrades"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#3b82f6' }}
                                            name="MAINNET TRADES"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeTestnetTrades"
                                            stroke="#a855f7"
                                            strokeWidth={1.5}
                                            strokeDasharray="5 5"
                                            dot={false}
                                            name="TESTNET TRADES"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="text-xs text-[var(--text-muted)] font-mono">
                    Data range: {stats.firstDate} — {stats.lastDate}
                </div>
            )}
        </div>
    );
}
