"use client";

import { useState, useEffect } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { DashboardLayout } from "@/app/components/dashboard/DashboardLayout";
import { OverviewSection } from "@/app/components/dashboard/sections/OverviewSection";
import { AgentsSection } from "@/app/components/dashboard/sections/AgentsSection";
import { WalletsSection } from "@/app/components/dashboard/sections/WalletsSection";
import { ActivitySection } from "@/app/components/dashboard/sections/ActivitySection";

type TabType = "overview" | "agents" | "wallets" | "activity";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const { data: stats, isLoading, refetch, dataUpdatedAt } = useDashboardStats();

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
    <DashboardLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabType)}>
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {(["overview", "agents", "wallets", "activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
        <ActivitySection
          activities={stats?.recentActivity}
          isLoading={isLoading}
        />
      )}
    </DashboardLayout>
  );
}
