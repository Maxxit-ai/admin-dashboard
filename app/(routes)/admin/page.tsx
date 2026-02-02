"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { DashboardLayout } from "@/app/components/dashboard/DashboardLayout";
import { OverviewSection } from "@/app/components/dashboard/sections/OverviewSection";
import { AgentsSection } from "@/app/components/dashboard/sections/AgentsSection";
import { WalletsSection } from "@/app/components/dashboard/sections/WalletsSection";
import { TradingVolumeSection } from "@/app/components/dashboard/sections/TradingVolumeSection";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type TabType = "overview" | "agents" | "wallets" | "activity";

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get active tab from URL or default to overview
  const activeTab = (searchParams.get("tab") as TabType) || "overview";
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const { data: stats, isLoading, refetch, dataUpdatedAt } = useDashboardStats();

  // Helper to change tabs and update URL
  const handleTabChange = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    // Reset view parameter when changing main tabs to avoid logic leaks
    params.delete("view");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Update last updated time when data changes
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt).toLocaleString());
    }
  }, [dataUpdatedAt]);

  // Set page title
  useEffect(() => {
    document.title = "Admin Dashboard - Maxxit";
  }, []);

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={(tab) => handleTabChange(tab)}>
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {(["overview", "agents", "wallets", "activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-sm font-mono uppercase transition-all ${activeTab === tab
                ? "bg-accent text-[var(--bg-deep)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 bg-accent text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewSection
          stats={stats}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
        />
      )}

      {activeTab === "agents" && (
        <AgentsSection agents={stats?.agents} isLoading={isLoading} />
      )}

      {activeTab === "wallets" && (
        <WalletsSection isActive={activeTab === "wallets"} />
      )}

      {activeTab === "activity" && (
        <TradingVolumeSection />
      )}
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-deep)] flex items-center justify-center">
        <div className="text-accent font-mono animate-pulse uppercase tracking-widest text-sm">
          Initializing System...
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
