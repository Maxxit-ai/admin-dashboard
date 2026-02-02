import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const MAINNET_SUBGRAPH_URL = 'https://api.subgraph.ormilabs.com/api/public/67a599d5-c8d2-4cc4-9c4d-2975a97bc5d8/subgraphs/ost-prod/live/gn';
const TESTNET_SUBGRAPH_URL = 'https://api.subgraph.ormilabs.com/api/public/67a599d5-c8d2-4cc4-9c4d-2975a97bc5d8/subgraphs/ost-sep/live/gn';

interface SubgraphUser {
    id: string;
    totalVolume: string;
    totalPnL: string;
    totalProfitTrades: string;
    totalLossTrades: string;
}

interface SubgraphResponse {
    data: {
        users: SubgraphUser[];
    };
}

interface SubgraphTrade {
    notional: string;
    timestamp: string;
    isOpen: boolean;
}

interface TradesResponse {
    data: {
        trades: SubgraphTrade[];
    };
}

interface DailyVolumeDataPoint {
    date: string;
    mainnetVolume: number;
    testnetVolume: number;
    cumulativeMainnetVolume: number;
    cumulativeTestnetVolume: number;
}

interface WalletVolumeData {
    wallet: string;
    isTestnet: boolean;
    totalVolume: number;
    totalPnL: number;
    totalProfitTrades: number;
    totalLossTrades: number;
}

interface TradingVolumeResponse {
    mainnetVolume: number;
    testnetVolume: number;
    totalVolume: number;
    mainnetPnL: number;
    testnetPnL: number;
    totalPnL: number;
    mainnetWallets: number;
    testnetWallets: number;
    totalWallets: number;
    mainnetTrades: number;
    testnetTrades: number;
    totalTrades: number;
    walletData: WalletVolumeData[];
    dailyVolume: DailyVolumeDataPoint[];
}

async function fetchUserVolume(wallet: string, subgraphUrl: string): Promise<SubgraphUser | null> {
    const query = `
        query MyQuery {
            users(
                orderBy: totalPnL
                orderDirection: desc
                where: {id: "${wallet.toLowerCase()}"}
            ) {
                id
                totalVolume
                totalPnL
                totalProfitTrades
                totalLossTrades
            }
        }
    `;

    try {
        const response = await fetch(subgraphUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            console.error(`Subgraph request failed for wallet ${wallet}`);
            return null;
        }

        const result: SubgraphResponse = await response.json();
        return result.data?.users?.[0] || null;
    } catch (error) {
        console.error(`Error fetching volume for wallet ${wallet}:`, error);
        return null;
    }
}

function parseVolume(volumeStr: string): number {
    const raw = BigInt(volumeStr);
    return Number(raw) / 1e6;
}

function parsePnL(pnlStr: string): number {
    const raw = BigInt(pnlStr);
    return Number(raw) / 1e6;
}

async function fetchUserTrades(wallet: string, subgraphUrl: string): Promise<SubgraphTrade[]> {
    const query = `
        query MyQuery {
            trades(where: {trader: "${wallet.toLowerCase()}"}, first: 1000) {
                notional
                timestamp
                isOpen
            }
        }
    `;

    try {
        const response = await fetch(subgraphUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            console.error(`Subgraph request failed for wallet trades ${wallet}`);
            return [];
        }

        const result: TradesResponse = await response.json();
        return result.data?.trades || [];
    } catch (error) {
        console.error(`Error fetching trades for wallet ${wallet}:`, error);
        return [];
    }
}

function calculateTradeVolume(trade: SubgraphTrade): number {
    const notional = Number(trade.notional) / 1e6;
    return trade.isOpen ? notional : notional * 2;
}

function timestampToDateKey(timestamp: string): string {
    const date = new Date(parseInt(timestamp, 10) * 1000);
    return date.toISOString().split('T')[0];
}

export async function GET() {
    try {
        const deployments = await prisma.agent_deployments.findMany({
            select: {
                user_wallet: true,
                is_testnet: true,
            },
            distinct: ['user_wallet', 'is_testnet'],
        });

        const mainnetWallets = new Set<string>();
        const testnetWallets = new Set<string>();

        deployments.forEach((d) => {
            if (d.is_testnet) {
                testnetWallets.add(d.user_wallet.toLowerCase());
            } else {
                mainnetWallets.add(d.user_wallet.toLowerCase());
            }
        });

        const walletData: WalletVolumeData[] = [];

        const mainnetPromises = Array.from(mainnetWallets).map(async (wallet) => {
            const userData = await fetchUserVolume(wallet, MAINNET_SUBGRAPH_URL);
            if (userData) {
                return {
                    wallet,
                    isTestnet: false,
                    totalVolume: parseVolume(userData.totalVolume),
                    totalPnL: parsePnL(userData.totalPnL),
                    totalProfitTrades: parseInt(userData.totalProfitTrades, 10),
                    totalLossTrades: parseInt(userData.totalLossTrades, 10),
                };
            }
            return null;
        });

        const testnetPromises = Array.from(testnetWallets).map(async (wallet) => {
            const userData = await fetchUserVolume(wallet, TESTNET_SUBGRAPH_URL);
            if (userData) {
                return {
                    wallet,
                    isTestnet: true,
                    totalVolume: parseVolume(userData.totalVolume),
                    totalPnL: parsePnL(userData.totalPnL),
                    totalProfitTrades: parseInt(userData.totalProfitTrades, 10),
                    totalLossTrades: parseInt(userData.totalLossTrades, 10),
                };
            }
            return null;
        });

        const results = await Promise.all([...mainnetPromises, ...testnetPromises]);

        results.forEach((result) => {
            if (result) {
                walletData.push(result);
            }
        });

        let mainnetVolume = 0;
        let testnetVolume = 0;
        let mainnetPnL = 0;
        let testnetPnL = 0;
        let mainnetTrades = 0;
        let testnetTrades = 0;

        walletData.forEach((data) => {
            const trades = data.totalProfitTrades + data.totalLossTrades;
            if (data.isTestnet) {
                testnetVolume += data.totalVolume;
                testnetPnL += data.totalPnL;
                testnetTrades += trades;
            } else {
                mainnetVolume += data.totalVolume;
                mainnetPnL += data.totalPnL;
                mainnetTrades += trades;
            }
        });

        // Fetch trades for time-series data
        const dailyVolumeMap = new Map<string, { mainnetVolume: number; testnetVolume: number }>();

        const mainnetTradePromises = Array.from(mainnetWallets).map(async (wallet) => {
            const trades = await fetchUserTrades(wallet, MAINNET_SUBGRAPH_URL);
            return { trades, isTestnet: false };
        });

        const testnetTradePromises = Array.from(testnetWallets).map(async (wallet) => {
            const trades = await fetchUserTrades(wallet, TESTNET_SUBGRAPH_URL);
            return { trades, isTestnet: true };
        });

        const tradeResults = await Promise.all([...mainnetTradePromises, ...testnetTradePromises]);

        tradeResults.forEach(({ trades, isTestnet }) => {
            trades.forEach((trade) => {
                const dateKey = timestampToDateKey(trade.timestamp);
                const volume = calculateTradeVolume(trade);

                const current = dailyVolumeMap.get(dateKey) || { mainnetVolume: 0, testnetVolume: 0 };
                if (isTestnet) {
                    current.testnetVolume += volume;
                } else {
                    current.mainnetVolume += volume;
                }
                dailyVolumeMap.set(dateKey, current);
            });
        });

        // Build sorted daily volume array with cumulative values
        const sortedDates = Array.from(dailyVolumeMap.keys()).sort();
        let cumulativeMainnet = 0;
        let cumulativeTestnet = 0;

        const dailyVolume: DailyVolumeDataPoint[] = sortedDates.map((date) => {
            const dayData = dailyVolumeMap.get(date)!;
            cumulativeMainnet += dayData.mainnetVolume;
            cumulativeTestnet += dayData.testnetVolume;

            return {
                date,
                mainnetVolume: Math.round(dayData.mainnetVolume * 100) / 100,
                testnetVolume: Math.round(dayData.testnetVolume * 100) / 100,
                cumulativeMainnetVolume: Math.round(cumulativeMainnet * 100) / 100,
                cumulativeTestnetVolume: Math.round(cumulativeTestnet * 100) / 100,
            };
        });

        const response: TradingVolumeResponse = {
            mainnetVolume,
            testnetVolume,
            totalVolume: mainnetVolume + testnetVolume,
            mainnetPnL,
            testnetPnL,
            totalPnL: mainnetPnL + testnetPnL,
            mainnetWallets: mainnetWallets.size,
            testnetWallets: testnetWallets.size,
            totalWallets: mainnetWallets.size + testnetWallets.size,
            mainnetTrades,
            testnetTrades,
            totalTrades: mainnetTrades + testnetTrades,
            walletData: walletData.sort((a, b) => b.totalVolume - a.totalVolume),
            dailyVolume,
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('[Trading Volume API] Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch trading volume data' },
            { status: 500 }
        );
    }
}
