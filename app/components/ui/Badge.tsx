interface StatusBadgeProps {
    status: string | null;
    size?: "sm" | "md";
}

const statusColors: Record<string, string> = {
    PUBLIC: "bg-accent/20 text-accent border-accent/30",
    PRIVATE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    ACTIVE: "bg-accent/20 text-accent border-accent/30",
    PAUSED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    OPEN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
    const colorClass = statusColors[status || "DRAFT"] || statusColors.DRAFT;
    const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

    return (
        <span className={`${sizeClass} border ${colorClass}`}>
            {status || "DRAFT"}
        </span>
    );
}

interface WalletTypeBadgeProps {
    type: "profit_receiver" | "safe_wallet" | "agent_address";
}

const walletTypeColors: Record<string, string> = {
    profit_receiver: "border-accent text-accent",
    safe_wallet: "border-blue-500 text-blue-400",
    agent_address: "border-purple-500 text-purple-400",
};

export function WalletTypeBadge({ type }: WalletTypeBadgeProps) {
    return (
        <span className={`text-xs px-2 py-1 border ${walletTypeColors[type]}`}>
            {type.replace("_", " ").toUpperCase()}
        </span>
    );
}

interface VenueBadgeProps {
    venue: string;
}

export function VenueBadge({ venue }: VenueBadgeProps) {
    return (
        <span className="text-xs px-2 py-1 border border-[var(--border)] font-mono">
            {venue}
        </span>
    );
}
