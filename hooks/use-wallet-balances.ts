"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWalletBalances, queryKeys, type WalletData } from "@/lib/api";

/**
 * Hook for fetching wallet balances with React Query
 * - Lazy loading (disabled by default)
 * - Call refetch() to manually trigger
 * - Useful for tabs that don't need data immediately
 */
export function useWalletBalances(enabled: boolean = false) {
    return useQuery<WalletData>({
        queryKey: queryKeys.walletBalances,
        queryFn: fetchWalletBalances,
        // Only fetch when explicitly enabled (e.g., when wallets tab is active)
        enabled,
        // Wallet data doesn't auto-refresh - too expensive
        refetchInterval: false,
        // Keep stale data longer since it's costly to fetch
        staleTime: 5 * 60 * 1000,
    });
}
