import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";

// Singleton Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Ostium Subgraph endpoints
const SUBGRAPH_ENDPOINTS = {
    mainnet: 'https://api.subgraph.ormilabs.com/api/public/67a599d5-c8d2-4cc4-9c4d-2975a97bc5d8/subgraphs/ost-prod/live/gn',
    testnet: 'https://api.subgraph.ormilabs.com/api/public/67a599d5-c8d2-4cc4-9c4d-2975a97bc5d8/subgraphs/ost-sep/live/gn',
};

interface TradingVolumeDataPoint {
    date: string;
    mainnetVolume: number;
    testnetVolume: number;
    mainnetTrades: number;
    testnetTrades: number;
    cumulativeMainnetVolume: number;
    cumulativeTestnetVolume: number;
    cumulativeMainnetTrades: number;
    cumulativeTestnetTrades: number;
}

interface TradingVolumeResponse {
    data: TradingVolumeDataPoint[];
    totals: {
        mainnetVolume: number;
        testnetVolume: number;
        mainnetTrades: number;
        testnetTrades: number;
    };
}

interface SubgraphTrade {
    id: string;
    tradeID: string;
    tradeNotional: string;
    notional: string;
    timestamp: string;
    isOpen: boolean;
}

// Query trades from subgraph by trade IDs
async function querySubgraphForTrades(endpoint: string, tradeIds: string[]): Promise<Map<string, SubgraphTrade>> {
    const tradeMap = new Map<string, SubgraphTrade>();

    if (tradeIds.length === 0) return tradeMap;

    // Batch trade IDs in chunks of 100 to avoid query limits
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < tradeIds.length; i += chunkSize) {
        chunks.push(tradeIds.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
        try {
            const query = `
                query GetTradesByIds($tradeIds: [String!]) {
                    trades(where: { tradeID_in: $tradeIds }) {
                        id
                        tradeID
                        tradeNotional
                        notional
                        timestamp
                        isOpen
                    }
                }
            `;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: { tradeIds: chunk },
                }),
            });

            if (!response.ok) {
                console.error(`[Subgraph] HTTP error: ${response.status}`);
                continue;
            }

            const result = await response.json();

            if (result.errors) {
                console.error('[Subgraph] GraphQL errors:', result.errors);
                continue;
            }

            if (result.data?.trades) {
                for (const trade of result.data.trades) {
                    tradeMap.set(trade.tradeID, trade);
                }
            }
        } catch (error: any) {
            console.error('[Subgraph] Query error:', error.message);
        }
    }

    return tradeMap;
}

// Convert notional from subgraph to USD
// Based on examples from user doc:
// - collateral "194294" = $19.43 (6 decimals)
// - notional "4857350" = $4,857.35 (6 decimals) - this is the position size
// We should use 'notional' (position size) as the volume, not 'tradeNotional'
function parseNotional(notional: string, tradeNotional?: string): number {
    // Prefer 'notional' as it represents position size in 6 decimals
    // Fall back to tradeNotional if notional is not available
    const value = Number(notional);
    if (!isNaN(value) && value > 0) {
        return value / 1e6; // 6 decimals like collateral
    }
    // Fallback to tradeNotional if notional is 0 or not available
    const fallbackValue = Number(tradeNotional || '0');
    if (!isNaN(fallbackValue) && fallbackValue > 0) {
        return fallbackValue / 1e12; // tradeNotional appears to be in higher precision
    }
    return 0;
}

export async function GET() {
    try {
        // Fetch all positions with their ostium_trade_id and deployment info
        const positions = await prisma.positions.findMany({
            where: {
                ostium_trade_id: { not: null },
            },
            select: {
                id: true,
                ostium_trade_id: true,
                opened_at: true,
                deployment_id: true,
                venue: true,
                agent_deployments: {
                    select: {
                        is_testnet: true,
                    },
                },
            },
            orderBy: {
                opened_at: 'asc',
            },
        });

        // Separate positions by network
        const mainnetPositions: typeof positions = [];
        const testnetPositions: typeof positions = [];

        for (const position of positions) {
            if (position.agent_deployments?.is_testnet) {
                testnetPositions.push(position);
            } else {
                mainnetPositions.push(position);
            }
        }

        // Get trade IDs for subgraph queries
        const mainnetTradeIds = mainnetPositions
            .map(p => p.ostium_trade_id)
            .filter((id): id is string => id !== null);
        const testnetTradeIds = testnetPositions
            .map(p => p.ostium_trade_id)
            .filter((id): id is string => id !== null);

        console.log(`[Trading Volume] Fetching ${mainnetTradeIds.length} mainnet trades, ${testnetTradeIds.length} testnet trades from subgraph`);

        // Query both subgraphs in parallel
        const [mainnetTrades, testnetTrades] = await Promise.all([
            querySubgraphForTrades(SUBGRAPH_ENDPOINTS.mainnet, mainnetTradeIds),
            querySubgraphForTrades(SUBGRAPH_ENDPOINTS.testnet, testnetTradeIds),
        ]);

        console.log(`[Trading Volume] Retrieved ${mainnetTrades.size} mainnet trades, ${testnetTrades.size} testnet trades from subgraph`);

        // Debug: Log sample trade data to verify values
        if (mainnetTrades.size > 0) {
            const sampleTrades = Array.from(mainnetTrades.values()).slice(0, 3);
            console.log('[Trading Volume] Sample mainnet trades from subgraph:');
            for (const trade of sampleTrades) {
                const parsedVolume = parseNotional(trade.notional || '0', trade.tradeNotional);
                console.log(`  - Trade ${trade.tradeID}: notional=${trade.notional}, tradeNotional=${trade.tradeNotional}, parsed=$${parsedVolume.toFixed(2)}`);
            }
        }
        if (testnetTrades.size > 0) {
            const sampleTrades = Array.from(testnetTrades.values()).slice(0, 3);
            console.log('[Trading Volume] Sample testnet trades from subgraph:');
            for (const trade of sampleTrades) {
                const parsedVolume = parseNotional(trade.notional || '0', trade.tradeNotional);
                console.log(`  - Trade ${trade.tradeID}: notional=${trade.notional}, tradeNotional=${trade.tradeNotional}, parsed=$${parsedVolume.toFixed(2)}`);
            }
        }

        // Aggregate by date
        const dateMap = new Map<string, {
            mainnetVolume: number;
            testnetVolume: number;
            mainnetTrades: number;
            testnetTrades: number;
        }>();

        // Process mainnet positions
        for (const position of mainnetPositions) {
            if (!position.opened_at || !position.ostium_trade_id) continue;

            const dateKey = position.opened_at.toISOString().split('T')[0];
            const current = dateMap.get(dateKey) || {
                mainnetVolume: 0,
                testnetVolume: 0,
                mainnetTrades: 0,
                testnetTrades: 0
            };

            const subgraphTrade = mainnetTrades.get(position.ostium_trade_id);
            if (subgraphTrade) {
                current.mainnetVolume += parseNotional(subgraphTrade.notional || '0', subgraphTrade.tradeNotional);
            }
            current.mainnetTrades += 1;

            dateMap.set(dateKey, current);
        }

        // Process testnet positions
        for (const position of testnetPositions) {
            if (!position.opened_at || !position.ostium_trade_id) continue;

            const dateKey = position.opened_at.toISOString().split('T')[0];
            const current = dateMap.get(dateKey) || {
                mainnetVolume: 0,
                testnetVolume: 0,
                mainnetTrades: 0,
                testnetTrades: 0
            };

            const subgraphTrade = testnetTrades.get(position.ostium_trade_id);
            if (subgraphTrade) {
                current.testnetVolume += parseNotional(subgraphTrade.notional || '0', subgraphTrade.tradeNotional);
            }
            current.testnetTrades += 1;

            dateMap.set(dateKey, current);
        }

        // Build cumulative data points
        let cumulativeMainnetVolume = 0;
        let cumulativeTestnetVolume = 0;
        let cumulativeMainnetTrades = 0;
        let cumulativeTestnetTrades = 0;
        const dataPoints: TradingVolumeDataPoint[] = [];

        const sortedDates = Array.from(dateMap.keys()).sort();

        sortedDates.forEach((date) => {
            const counts = dateMap.get(date)!;
            cumulativeMainnetVolume += counts.mainnetVolume;
            cumulativeTestnetVolume += counts.testnetVolume;
            cumulativeMainnetTrades += counts.mainnetTrades;
            cumulativeTestnetTrades += counts.testnetTrades;

            dataPoints.push({
                date,
                mainnetVolume: Math.round(counts.mainnetVolume * 100) / 100,
                testnetVolume: Math.round(counts.testnetVolume * 100) / 100,
                mainnetTrades: counts.mainnetTrades,
                testnetTrades: counts.testnetTrades,
                cumulativeMainnetVolume: Math.round(cumulativeMainnetVolume * 100) / 100,
                cumulativeTestnetVolume: Math.round(cumulativeTestnetVolume * 100) / 100,
                cumulativeMainnetTrades,
                cumulativeTestnetTrades,
            });
        });

        const response: TradingVolumeResponse = {
            data: dataPoints,
            totals: {
                mainnetVolume: Math.round(cumulativeMainnetVolume * 100) / 100,
                testnetVolume: Math.round(cumulativeTestnetVolume * 100) / 100,
                mainnetTrades: cumulativeMainnetTrades,
                testnetTrades: cumulativeTestnetTrades,
            },
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
