"use client";

import type { RecentActivity } from "@/lib/api";

interface ActivitySectionProps {
    activities: RecentActivity[] | undefined;
    isLoading: boolean;
}

export function ActivitySection({ activities, isLoading }: ActivitySectionProps) {
    if (isLoading) {
        return (
            <div className="border border-[var(--border)] bg-[var(--bg-surface)]">
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="h-4 w-32 bg-[var(--border)] rounded animate-pulse" />
                </div>
                <div className="divide-y divide-[var(--border)]">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="p-4 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-[var(--border)] rounded-full" />
                                <div className="flex-1">
                                    <div className="h-4 w-24 bg-[var(--border)] rounded mb-2" />
                                    <div className="h-3 w-48 bg-[var(--border)] rounded" />
                                </div>
                                <div className="h-3 w-32 bg-[var(--border)] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="p-4 border-b border-[var(--border)]">
                <p className="data-label">RECENT ACTIVITY LOG</p>
            </div>
            <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto custom-scrollbar">
                {activities && activities.length > 0 ? (
                    activities.map((activity, idx) => (
                        <div
                            key={idx}
                            className="px-4 py-3 hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                                <div>
                                    <p className="font-mono text-sm">{activity.type}</p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {activity.description}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-[var(--text-muted)] font-mono whitespace-nowrap ml-4">
                                {new Date(activity.timestamp).toLocaleString()}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                        No recent activity
                    </div>
                )}
            </div>
        </div>
    );
}
