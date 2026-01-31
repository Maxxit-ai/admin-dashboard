// API client for admin dashboard
const API_BASE = "/api/admin";

// Types
export interface AgentWithStats {
    id: string;
    name: string;
    venue: string;
    creatorWallet: string;
    profitReceiverAddress: string;
    status: string | null;
    apr30d: number | null;
    apr90d: number | null;
    sharpe30d: number | null;
    subscriberCount: number;
    activeSubscribers: number;
    totalPositions: number;
    openPositions: number;
    totalSignals: number;
    totalPnl: number;
    walletBalance: string | null;
}

export interface VenueBreakdown {
    venue: string;
    agentCount: number;
    deploymentCount: number;
    positionCount: number;
}

export interface DailyStats {
    date: string;
    signals: number;
    positions: number;
    pnl: number;
}

export interface RecentActivity {
    type: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

export interface DashboardOverview {
    totalAgents: number;
    publicAgents: number;
    privateAgents: number;
    draftAgents: number;
    totalDeployments: number;
    activeDeployments: number;
    pausedDeployments: number;
    totalPositions: number;
    openPositions: number;
    closedPositions: number;
    totalSignals: number;
    totalPnl: number;
    totalBillingEvents: number;
    totalTelegramUsers: number;
    totalCtAccounts: number;
    totalResearchInstitutes: number;
}

export interface DashboardStats {
    overview: DashboardOverview;
    agents: AgentWithStats[];
    recentActivity: RecentActivity[];
    venueBreakdown: VenueBreakdown[];
    dailyStats: DailyStats[];
    meta?: {
        duration: string;
        fetchedAt: string;
    };
}

export interface WalletBalance {
    address: string;
    type: "profit_receiver" | "safe_wallet" | "agent_address";
    agentId?: string;
    agentName?: string;
    deploymentId?: string;
    userWallet?: string;
    ethBalance: string;
    tokenBalances: Record<string, string>;
}

export interface WalletData {
    wallets: WalletBalance[];
    totals: {
        totalEth: number;
        totalByToken: Record<string, number>;
        walletCount: number;
    };
    meta?: {
        fetchedAt: string;
        duration: string;
        addressCount: number;
    };
}

export interface AgentAnalyticsPoint {
    date: string;
    deployments: number;
    cumulativePnL: number;
    signals: number;
    signalsByVenue: Record<string, number>;
}

export interface AgentAnalyticsData {
    daily: AgentAnalyticsPoint[];
    topStats: {
        totalSubscribers: number;
        activeSubscribers: number;
        totalSignals30d: number;
        netPnL30d: number;
    };
}

// API functions
export async function fetchDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard-stats`);
    if (!res.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${res.statusText}`);
    }
    return res.json();
}

export async function fetchAgentAnalytics(): Promise<AgentAnalyticsData> {
    const res = await fetch(`${API_BASE}/agent-analytics`);
    if (!res.ok) {
        throw new Error(`Failed to fetch agent analytics: ${res.statusText}`);
    }
    return res.json();
}

export async function fetchWalletBalances(): Promise<WalletData> {
    const res = await fetch(`${API_BASE}/wallet-balances`);
    if (!res.ok) {
        throw new Error(`Failed to fetch wallet balances: ${res.statusText}`);
    }
    return res.json();
}

// Query keys for cache management
export const queryKeys = {
    dashboardStats: ["admin", "dashboard-stats"] as const,
    walletBalances: ["admin", "wallet-balances"] as const,
};
