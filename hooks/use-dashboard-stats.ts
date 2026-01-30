"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, queryKeys, type DashboardStats } from "@/lib/api";

/**
 * Hook for fetching dashboard stats with React Query
 * - Automatic caching (30s stale time)
 * - Background refetch
 * - Loading/error states
 */
export function useDashboardStats() {
    return useQuery<DashboardStats>({
        queryKey: queryKeys.dashboardStats,
        queryFn: fetchDashboardStats,
        // Dashboard stats are refreshed every 60 seconds in the background
        refetchInterval: 60 * 1000,
    });
}
