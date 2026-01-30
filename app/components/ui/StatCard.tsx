import { ReactNode } from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: "up" | "down" | "neutral";
    icon?: string;
    isLoading?: boolean;
    className?: string;
}

export function StatCard({
    label,
    value,
    subValue,
    trend,
    icon,
    isLoading = false,
    className = "",
}: StatCardProps) {
    if (isLoading) {
        return (
            <div
                className={`border border-[var(--border)] bg-[var(--bg-surface)] p-6 animate-pulse ${className}`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="h-3 w-24 bg-[var(--border)] rounded" />
                    {icon && <div className="h-8 w-8 bg-[var(--border)] rounded" />}
                </div>
                <div className="h-10 w-32 bg-[var(--border)] rounded mb-2" />
                {subValue !== undefined && (
                    <div className="h-4 w-40 bg-[var(--border)] rounded" />
                )}
            </div>
        );
    }

    return (
        <div
            className={`border border-[var(--border)] bg-[var(--bg-surface)] p-6 hover:border-accent/50 transition-all duration-300 group ${className}`}
        >
            <div className="flex items-start justify-between mb-4">
                <p className="data-label">{label}</p>
                {icon && (
                    <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                        {icon}
                    </span>
                )}
            </div>
            <p
                className={`font-display text-4xl transition-colors ${trend === "up"
                        ? "text-accent"
                        : trend === "down"
                            ? "text-[var(--danger)]"
                            : "text-[var(--text-primary)]"
                    }`}
            >
                {value}
            </p>
            {subValue && (
                <p className="text-sm text-[var(--text-muted)] mt-2">{subValue}</p>
            )}
        </div>
    );
}

interface SmallStatCardProps {
    label: string;
    value: string | number;
    isLoading?: boolean;
    accent?: boolean;
}

export function SmallStatCard({
    label,
    value,
    isLoading = false,
    accent = false,
}: SmallStatCardProps) {
    if (isLoading) {
        return (
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-4 animate-pulse">
                <div className="h-3 w-20 bg-[var(--border)] rounded mb-2" />
                <div className="h-8 w-16 bg-[var(--border)] rounded" />
            </div>
        );
    }

    return (
        <div
            className={`border bg-[var(--bg-surface)] p-4 hover:border-accent/50 transition-colors ${accent ? "border-accent" : "border-[var(--border)]"
                }`}
        >
            <p className="data-label mb-2">{label}</p>
            <p className={`font-display text-2xl ${accent ? "text-accent" : ""}`}>
                {value}
            </p>
        </div>
    );
}
