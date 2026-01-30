import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { batchGetBalances, TokenConfig } from "@/lib/multicall";

// Singleton Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// RPC endpoints
const ARBITRUM_RPC = process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";

// Common token configurations on Arbitrum
const TOKENS: TokenConfig[] = [
  { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
  { symbol: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
  { symbol: "WETH", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
  { symbol: "ARB", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 },
];

interface WalletBalance {
  address: string;
  type: "profit_receiver" | "safe_wallet" | "agent_address";
  agentId?: string;
  agentName?: string;
  deploymentId?: string;
  userWallet?: string;
  ethBalance: string;
  tokenBalances: Record<string, string>;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC);
    const walletBalances: WalletBalance[] = [];

    // Fetch all data from database in parallel
    const [agents, deployments, userAgentAddresses] = await Promise.all([
      prisma.agents.findMany({
        select: {
          id: true,
          name: true,
          profit_receiver_address: true,
        },
      }),
      prisma.agent_deployments.findMany({
        select: {
          id: true,
          agent_id: true,
          user_wallet: true,
          safe_wallet: true,
        },
        where: {
          safe_wallet: { not: '' },
        },
      }),
      prisma.user_agent_addresses.findMany({
        select: {
          user_wallet: true,
          hyperliquid_agent_address: true,
          ostium_agent_address: true,
        },
      }),
    ]);

    // Collect unique addresses to fetch
    const addressesToFetch = new Set<string>();
    const addressMetadata = new Map<
      string,
      {
        type: "profit_receiver" | "safe_wallet" | "agent_address";
        agentId?: string;
        agentName?: string;
        deploymentId?: string;
        userWallet?: string;
        originalAddress: string;
      }[]
    >();

    // Helper to add address with metadata
    const addAddress = (
      address: string,
      meta: {
        type: "profit_receiver" | "safe_wallet" | "agent_address";
        agentId?: string;
        agentName?: string;
        deploymentId?: string;
        userWallet?: string;
      }
    ) => {
      const lowerAddr = address.toLowerCase();
      addressesToFetch.add(lowerAddr);
      const existing = addressMetadata.get(lowerAddr) || [];
      existing.push({ ...meta, originalAddress: address });
      addressMetadata.set(lowerAddr, existing);
    };

    // Add profit receiver addresses
    agents.forEach((agent: any) => {
      if (agent.profit_receiver_address) {
        addAddress(agent.profit_receiver_address, {
          type: "profit_receiver",
          agentId: agent.id,
          agentName: agent.name,
        });
      }
    });

    // Add safe wallet addresses
    deployments.forEach((deployment: any) => {
      if (deployment.safe_wallet) {
        const agent = agents.find((a: any) => a.id === deployment.agent_id);
        addAddress(deployment.safe_wallet, {
          type: "safe_wallet",
          agentId: deployment.agent_id,
          agentName: agent?.name,
          deploymentId: deployment.id,
          userWallet: deployment.user_wallet,
        });
      }
    });

    // Add agent addresses (Hyperliquid/Ostium)
    userAgentAddresses.forEach((ua: any) => {
      if (ua.hyperliquid_agent_address) {
        addAddress(ua.hyperliquid_agent_address, {
          type: "agent_address",
          userWallet: ua.user_wallet,
        });
      }
      if (ua.ostium_agent_address) {
        addAddress(ua.ostium_agent_address, {
          type: "agent_address",
          userWallet: ua.user_wallet,
        });
      }
    });

    const addressArray = Array.from(addressesToFetch);
    console.log(`[Wallet Balances] Fetching ${addressArray.length} unique addresses using Multicall3...`);

    // Use Multicall3 to batch fetch all balances in 1-2 RPC calls
    const balanceMap = await batchGetBalances(provider, addressArray, TOKENS);

    // Map results back to wallet info
    for (const [lowerAddr, metas] of addressMetadata.entries()) {
      const balanceResult = balanceMap.get(lowerAddr);
      if (!balanceResult) continue;

      for (const meta of metas) {
        walletBalances.push({
          address: meta.originalAddress,
          type: meta.type,
          agentId: meta.agentId,
          agentName: meta.agentName,
          deploymentId: meta.deploymentId,
          userWallet: meta.userWallet,
          ethBalance: balanceResult.ethBalance,
          tokenBalances: balanceResult.tokenBalances,
        });
      }
    }

    // Calculate totals
    const totals = {
      totalEth: walletBalances.reduce((sum, w) => sum + parseFloat(w.ethBalance || "0"), 0),
      totalByToken: {} as Record<string, number>,
      walletCount: walletBalances.length,
    };

    walletBalances.forEach((w) => {
      Object.entries(w.tokenBalances).forEach(([symbol, balance]) => {
        totals.totalByToken[symbol] = (totals.totalByToken[symbol] || 0) + parseFloat(balance);
      });
    });

    const duration = Date.now() - startTime;
    console.log(`[Wallet Balances] Completed in ${duration}ms (${addressArray.length} addresses)`);

    return NextResponse.json(
      {
        wallets: walletBalances,
        totals,
        meta: {
          fetchedAt: new Date().toISOString(),
          duration: `${duration}ms`,
          addressCount: addressArray.length,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      }
    );
  } catch (error: any) {
    console.error("[Admin Wallet Balances] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wallet balances" },
      { status: 500 }
    );
  }
}
