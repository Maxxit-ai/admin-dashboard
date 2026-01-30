"use client";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { SmallStatCard } from "@/app/components/ui/StatCard";
import { WalletTypeBadge } from "@/app/components/ui/Badge";

interface WalletsSectionProps {
    isActive: boolean;
}

function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletsSection({ isActive }: WalletsSectionProps) {
    const { data: walletData, isLoading, isFetching, refetch, dataUpdatedAt } = useWalletBalances(isActive);

    if (!isActive) return null;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="border border-[var(--border)] p-4 animate-pulse"
                        >
                            <div className="h-3 w-20 bg-[var(--border)] rounded mb-2" />
                            <div className="h-8 w-16 bg-[var(--border)] rounded" />
                        </div>
                    ))}
                </div>
                <div className="border border-[var(--border)] p-12 text-center">
                    <p className="text-[var(--text-muted)]">Loading wallet balances...</p>
                </div>
            </div>
        );
    }

    if (!walletData) {
        return (
            <div className="border border-[var(--border)] p-12 text-center">
                <p className="text-[var(--text-muted)]">Failed to load wallet data</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 border border-[var(--border)] hover:border-accent hover:text-accent transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Wallet Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SmallStatCard
                    label="TOTAL WALLETS"
                    value={walletData.totals?.walletCount || 0}
                    accent
                />
                <SmallStatCard
                    label="TOTAL ETH"
                    value={(walletData.totals?.totalEth || 0).toFixed(4)}
                />
                {Object.entries(walletData.totals?.totalByToken || {}).map(
                    ([symbol, amount]) => (
                        <SmallStatCard
                            key={symbol}
                            label={`TOTAL ${symbol}`}
                            value={amount.toFixed(2)}
                        />
                    )
                )}
            </div>

            {/* Wallet Table */}
            <div className="border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-4 py-3 text-left font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Address
                                </th>
                                <th className="px-4 py-3 text-left font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Agent/User
                                </th>
                                <th className="px-4 py-3 text-right font-mono text-xs text-[var(--text-muted)] uppercase">
                                    ETH Balance
                                </th>
                                <th className="px-4 py-3 text-right font-mono text-xs text-[var(--text-muted)] uppercase">
                                    Tokens
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {walletData.wallets.map((wallet, idx) => (
                                <tr
                                    key={`${wallet.address}-${idx}`}
                                    className="hover:bg-[var(--bg-surface)] transition-colors"
                                >
                                    <td className="px-4 py-4">
                                        <WalletTypeBadge type={wallet.type} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <a
                                            href={`https://arbiscan.io/address/${wallet.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-accent hover:underline"
                                        >
                                            {formatAddress(wallet.address)}
                                        </a>
                                    </td>
                                    <td className="px-4 py-4">
                                        {wallet.agentName ? (
                                            <div>
                                                <p className="font-bold">{wallet.agentName}</p>
                                                {wallet.userWallet && (
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        User: {formatAddress(wallet.userWallet)}
                                                    </p>
                                                )}
                                            </div>
                                        ) : wallet.userWallet ? (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {formatAddress(wallet.userWallet)}
                                            </p>
                                        ) : (
                                            <span className="text-[var(--text-muted)]">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span
                                            className={`font-mono ${parseFloat(wallet.ethBalance) > 0.01 ? "text-accent" : ""
                                                }`}
                                        >
                                            {parseFloat(wallet.ethBalance).toFixed(4)} ETH
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {Object.entries(wallet.tokenBalances).length > 0 ? (
                                                Object.entries(wallet.tokenBalances).map(
                                                    ([symbol, balance]) => (
                                                        <span
                                                            key={symbol}
                                                            className="text-xs px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)]"
                                                        >
                                                            {parseFloat(balance).toFixed(2)} {symbol}
                                                        </span>
                                                    )
                                                )
                                            ) : (
                                                <span className="text-[var(--text-muted)]">—</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {walletData.wallets.length === 0 && (
                <div className="border border-[var(--border)] p-12 text-center">
                    <p className="text-[var(--text-muted)]">No wallets found</p>
                </div>
            )}

            {/* Footer with Refresh */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-[var(--text-muted)] font-mono">
                    {walletData.meta?.duration && (
                        <span>Fetched in <span className="text-accent">{walletData.meta.duration}</span></span>
                    )}
                    {dataUpdatedAt && (
                        <span className="ml-4">Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</span>
                    )}
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="px-4 py-2 text-sm border border-[var(--border)] hover:border-accent hover:text-accent transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isFetching ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            <span>Loading...</span>
                        </>
                    ) : (
                        <>
                            <span>🔄</span>
                            <span>Refresh</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
