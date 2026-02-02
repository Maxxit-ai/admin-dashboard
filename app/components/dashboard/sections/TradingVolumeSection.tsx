"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Wallet, Activity, Copy, Check, Zap } from 'lucide-react';

interface WalletVolumeData {
    wallet: string;
    isTestnet: boolean;
    totalVolume: number;
    totalPnL: number;
    totalProfitTrades: number;
    totalLossTrades: number;
}

interface DailyVolumeDataPoint {
    date: string;
    mainnetVolume: number;
    testnetVolume: number;
    cumulativeMainnetVolume: number;
    cumulativeTestnetVolume: number;
}

interface TradingVolumeResponse {
    mainnetVolume: number;
    testnetVolume: number;
    totalVolume: number;
    uniqueSourcesAccessed: number;
    totalWallets: number;
    activeTradingMainnetWallets: number;
    activeTradingTestnetWallets: number;
    totalActiveTradingWallets: number;
    mainnetTrades: number;
    testnetTrades: number;
    totalTrades: number;
    walletData: WalletVolumeData[];
    dailyVolume: DailyVolumeDataPoint[];
}

export function TradingVolumeSection() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<TradingVolumeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'mainnet' | 'testnet'>('all');
    const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

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
            setData(result);
        } catch (err: any) {
            console.error('Error fetching trading volume:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatVolume = (volume: number) => {
        if (volume >= 1e9) {
            return `$${(volume / 1e9).toFixed(2)}B`;
        }
        if (volume >= 1e6) {
            return `$${(volume / 1e6).toFixed(2)}M`;
        }
        if (volume >= 1e3) {
            return `$${(volume / 1e3).toFixed(2)}K`;
        }
        return `$${volume.toFixed(2)}`;
    };

    const formatPnL = (pnl: number) => {
        const prefix = pnl >= 0 ? '+' : '';
        if (Math.abs(pnl) >= 1e9) {
            return `${prefix}$${(pnl / 1e9).toFixed(2)}B`;
        }
        if (Math.abs(pnl) >= 1e6) {
            return `${prefix}$${(pnl / 1e6).toFixed(2)}M`;
        }
        if (Math.abs(pnl) >= 1e3) {
            return `${prefix}$${(pnl / 1e3).toFixed(2)}K`;
        }
        return `${prefix}$${pnl.toFixed(2)}`;
    };

    const truncateWallet = (wallet: string) => {
        return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    };

    const copyToClipboard = async (wallet: string) => {
        try {
            await navigator.clipboard.writeText(wallet);
            setCopiedWallet(wallet);
            setTimeout(() => setCopiedWallet(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const filteredWallets = data?.walletData.filter((w) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'mainnet') return !w.isTestnet;
        return w.isTestnet;
    }) || [];

    const formatDate = (date: any) => {
        if (!date) return "";
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

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
                        <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
                        <p className="data-label text-xs font-mono uppercase text-[var(--text-muted)]">TOTAL VOLUME</p>
                    </div>
                    <p className="text-3xl font-display">
                        {loading ? '...' : formatVolume(data?.totalVolume || 0)}
                    </p>
                    <div className="mt-2 text-xs text-[var(--text-muted)] font-mono">
                        <span className="text-green-400">Mainnet: {formatVolume(data?.mainnetVolume || 0)}</span>
                        <span className="mx-2">|</span>
                        <span className="text-yellow-400">Testnet: {formatVolume(data?.testnetVolume || 0)}</span>
                    </div>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-[var(--accent)]" />
                        <p className="data-label text-xs font-mono uppercase text-[var(--text-muted)]">SOURCES IN USE</p>
                    </div>
                    <p className="text-3xl font-display">
                        {loading ? '...' : (data?.uniqueSourcesAccessed || 0).toLocaleString()}
                    </p>
                    <div className="mt-2 text-xs text-[var(--text-muted)] font-mono">
                        Unique sources in use
                    </div>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-[var(--accent)]" />
                        <p className="data-label text-xs font-mono uppercase text-[var(--text-muted)]">TOTAL TRADES</p>
                    </div>
                    <p className="text-3xl font-display">
                        {loading ? '...' : (data?.totalTrades || 0).toLocaleString()}
                    </p>
                    <div className="mt-2 text-xs text-[var(--text-muted)] font-mono">
                        <span className="text-green-400">Mainnet: {(data?.mainnetTrades || 0).toLocaleString()}</span>
                        <span className="mx-2">|</span>
                        <span className="text-yellow-400">Testnet: {(data?.testnetTrades || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-5 w-5 text-green-400" />
                        <p className="data-label text-xs font-mono uppercase text-[var(--text-muted)]">ACTIVE TRADING WALLETS (MAINNET)</p>
                    </div>
                    <p className="text-3xl font-display text-green-400">
                        {loading ? '...' : data?.activeTradingMainnetWallets || 0}
                    </p>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-5 w-5 text-yellow-400" />
                        <p className="data-label text-xs font-mono uppercase text-[var(--text-muted)]">ACTIVE TRADING WALLETS (TESTNET)</p>
                    </div>
                    <p className="text-3xl font-display text-yellow-400">
                        {loading ? '...' : data?.activeTradingTestnetWallets || 0}
                    </p>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-5 w-5 text-[var(--accent)]" />
                        <p className="data-label text-xs font-mono uppercase text-[var(--text-muted)]">TOTAL WALLETS</p>
                    </div>
                    <p className="text-3xl font-display">
                        {loading ? '...' : data?.totalWallets || 0}
                    </p>
                    <div className="mt-2 text-xs text-[var(--text-muted)] font-mono">
                        <span className="text-[var(--accent)]">{data?.totalActiveTradingWallets || 0} active/trading</span>
                    </div>
                </div>
            </div> */}

            {/* Time-series Charts */}
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                <h2 className="text-xl font-display mb-8 flex items-center gap-2 uppercase">
                    <Activity className="h-5 w-5 text-[var(--accent)]" />
                    Trading Volume Trends
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-40">
                        <div className="animate-pulse font-mono text-[var(--text-muted)]">LOADING VOLUME DATA...</div>
                    </div>
                ) : !data?.dailyVolume || data.dailyVolume.length === 0 ? (
                    <div className="flex items-center justify-center py-40 font-mono text-[var(--text-muted)]">
                        NO TIME-SERIES DATA AVAILABLE
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section>
                            <h3 className="text-xs font-mono font-bold mb-6 text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-3 w-3 text-green-400" /> Mainnet Cumulative Volume
                            </h3>
                            <div className="h-[350px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data.dailyVolume}
                                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
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
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeMainnetVolume"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#10b981' }}
                                            name="MAINNET"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-mono font-bold mb-6 text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-3 w-3 text-yellow-400" /> Testnet Cumulative Volume
                            </h3>
                            <div className="h-[350px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data.dailyVolume}
                                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
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
                                        <Line
                                            type="monotone"
                                            dataKey="cumulativeTestnetVolume"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#f59e0b' }}
                                            name="TESTNET"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-display flex items-center gap-2 uppercase">
                        <Wallet className="h-5 w-5 text-[var(--accent)]" />
                        WALLET BREAKDOWN
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 text-xs font-bold font-mono border ${
                                activeTab === 'all'
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]'
                                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]'
                            }`}
                        >
                            ALL
                        </button>
                        <button
                            onClick={() => setActiveTab('mainnet')}
                            className={`px-4 py-2 text-xs font-bold font-mono border ${
                                activeTab === 'mainnet'
                                    ? 'border-green-400 bg-green-400/20 text-green-400'
                                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-green-400'
                            }`}
                        >
                            MAINNET
                        </button>
                        <button
                            onClick={() => setActiveTab('testnet')}
                            className={`px-4 py-2 text-xs font-bold font-mono border ${
                                activeTab === 'testnet'
                                    ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-yellow-400'
                            }`}
                        >
                            TESTNET
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-pulse font-mono text-[var(--text-muted)]">LOADING DATA...</div>
                    </div>
                ) : filteredWallets.length === 0 ? (
                    <div className="flex items-center justify-center py-20 font-mono text-[var(--text-muted)]">
                        NO DATA AVAILABLE
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm font-mono">
                            <thead>
                                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                                    <th className="text-left py-3 px-4">WALLET</th>
                                    <th className="text-left py-3 px-4">NETWORK</th>
                                    <th className="text-right py-3 px-4">VOLUME</th>
                                    <th className="text-right py-3 px-4">PNL</th>
                                    <th className="text-right py-3 px-4">WIN/LOSS</th>
                                    <th className="text-right py-3 px-4">WIN RATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWallets.map((wallet) => {
                                    const totalTrades = wallet.totalProfitTrades + wallet.totalLossTrades;
                                    const winRate = totalTrades > 0
                                        ? ((wallet.totalProfitTrades / totalTrades) * 100).toFixed(1)
                                        : '0.0';
                                    
                                    return (
                                        <tr
                                            key={`${wallet.wallet}-${wallet.isTestnet}`}
                                            className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-elevated)]"
                                        >
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => copyToClipboard(wallet.wallet)}
                                                    className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors group"
                                                    title="Click to copy"
                                                >
                                                    {truncateWallet(wallet.wallet)}
                                                    {copiedWallet === wallet.wallet ? (
                                                        <Check className="h-3 w-3 text-green-400" />
                                                    ) : (
                                                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-2 py-1 text-xs font-bold ${
                                                        wallet.isTestnet
                                                            ? 'bg-yellow-400/20 text-yellow-400'
                                                            : 'bg-green-400/20 text-green-400'
                                                    }`}
                                                >
                                                    {wallet.isTestnet ? 'TESTNET' : 'MAINNET'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {formatVolume(wallet.totalVolume)}
                                            </td>
                                            <td
                                                className={`py-3 px-4 text-right ${
                                                    wallet.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}
                                            >
                                                {formatPnL(wallet.totalPnL)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-green-400">{wallet.totalProfitTrades}</span>
                                                <span className="text-[var(--text-muted)]">/</span>
                                                <span className="text-red-400">{wallet.totalLossTrades}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span
                                                    className={
                                                        parseFloat(winRate) >= 50
                                                            ? 'text-green-400'
                                                            : 'text-red-400'
                                                    }
                                                >
                                                    {winRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div> */}
        </div>
    );
}
