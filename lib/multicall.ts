/**
 * Multicall3 Utility for batching blockchain calls
 * Uses the standard Multicall3 contract deployed on all major chains
 * 
 * This dramatically reduces RPC calls from N to 1, improving performance
 * from minutes to seconds for bulk balance queries.
 */

import { ethers } from "ethers";

// Multicall3 is deployed at the same address on all chains
export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// Multicall3 ABI (only the functions we need)
const MULTICALL3_ABI = [
    "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[])",
    "function getEthBalance(address addr) view returns (uint256 balance)",
];

// ERC20 balanceOf function signature
const BALANCE_OF_SELECTOR = "0x70a08231"; // balanceOf(address)

export interface Call3 {
    target: string;
    allowFailure: boolean;
    callData: string;
}

export interface MulticallResult {
    success: boolean;
    returnData: string;
}

/**
 * Encode a balanceOf call for an ERC20 token
 */
export function encodeBalanceOf(walletAddress: string): string {
    // balanceOf(address) - pad address to 32 bytes
    const paddedAddress = walletAddress.slice(2).padStart(64, "0");
    return BALANCE_OF_SELECTOR + paddedAddress;
}

/**
 * Encode an ETH balance call using Multicall3's getEthBalance
 */
export function encodeGetEthBalance(walletAddress: string): string {
    const iface = new ethers.Interface(MULTICALL3_ABI);
    return iface.encodeFunctionData("getEthBalance", [walletAddress]);
}

/**
 * Decode a uint256 balance from return data
 */
export function decodeBalance(returnData: string): bigint {
    if (!returnData || returnData === "0x" || returnData.length < 66) {
        return BigInt(0);
    }
    try {
        return BigInt(returnData);
    } catch {
        return BigInt(0);
    }
}

export interface TokenConfig {
    symbol: string;
    address: string;
    decimals: number;
}

export interface WalletBalanceResult {
    address: string;
    ethBalance: string;
    tokenBalances: Record<string, string>;
}

/**
 * Batch fetch ETH and token balances for multiple wallets using Multicall3
 * 
 * @param provider - Ethers provider
 * @param walletAddresses - Array of wallet addresses to query
 * @param tokens - Array of token configurations
 * @returns Map of wallet address to balance results
 */
export async function batchGetBalances(
    provider: ethers.JsonRpcProvider,
    walletAddresses: string[],
    tokens: TokenConfig[]
): Promise<Map<string, WalletBalanceResult>> {
    const results = new Map<string, WalletBalanceResult>();

    if (walletAddresses.length === 0) {
        return results;
    }

    const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

    // Build all calls
    const calls: Call3[] = [];
    const callMeta: { wallet: string; type: "eth" | "token"; symbol?: string; decimals?: number }[] = [];

    for (const wallet of walletAddresses) {
        // ETH balance call (using Multicall3's getEthBalance)
        calls.push({
            target: MULTICALL3_ADDRESS,
            allowFailure: true,
            callData: encodeGetEthBalance(wallet),
        });
        callMeta.push({ wallet, type: "eth" });

        // Token balance calls
        for (const token of tokens) {
            calls.push({
                target: token.address,
                allowFailure: true,
                callData: encodeBalanceOf(wallet),
            });
            callMeta.push({ wallet, type: "token", symbol: token.symbol, decimals: token.decimals });
        }
    }

    // Execute multicall in chunks to avoid gas limits
    // Each call returns ~32 bytes, safe to do 500+ calls per batch
    const CHUNK_SIZE = 500;
    const allResults: MulticallResult[] = [];

    for (let i = 0; i < calls.length; i += CHUNK_SIZE) {
        const chunk = calls.slice(i, i + CHUNK_SIZE);
        try {
            const chunkResults = await multicall.aggregate3(chunk);
            allResults.push(...chunkResults);
        } catch (error) {
            console.error(`Multicall chunk ${i / CHUNK_SIZE} failed:`, error);
            // Push failed results for this chunk
            for (let j = 0; j < chunk.length; j++) {
                allResults.push({ success: false, returnData: "0x" });
            }
        }
    }

    // Initialize results map
    for (const wallet of walletAddresses) {
        results.set(wallet.toLowerCase(), {
            address: wallet,
            ethBalance: "0",
            tokenBalances: {},
        });
    }

    // Process results
    for (let i = 0; i < allResults.length && i < callMeta.length; i++) {
        const result = allResults[i];
        const meta = callMeta[i];
        const walletResult = results.get(meta.wallet.toLowerCase());

        if (!walletResult || !result.success) continue;

        const balance = decodeBalance(result.returnData);

        if (meta.type === "eth") {
            walletResult.ethBalance = ethers.formatEther(balance);
        } else if (meta.type === "token" && meta.symbol && meta.decimals !== undefined) {
            const formatted = ethers.formatUnits(balance, meta.decimals);
            if (parseFloat(formatted) > 0) {
                walletResult.tokenBalances[meta.symbol] = formatted;
            }
        }
    }

    return results;
}

/**
 * Simple batch ETH balance fetch (no tokens)
 */
export async function batchGetEthBalances(
    provider: ethers.JsonRpcProvider,
    walletAddresses: string[]
): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    if (walletAddresses.length === 0) {
        return results;
    }

    const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

    const calls: Call3[] = walletAddresses.map((wallet) => ({
        target: MULTICALL3_ADDRESS,
        allowFailure: true,
        callData: encodeGetEthBalance(wallet),
    }));

    try {
        const callResults = await multicall.aggregate3(calls);

        for (let i = 0; i < callResults.length; i++) {
            const result = callResults[i];
            const wallet = walletAddresses[i];

            if (result.success) {
                const balance = decodeBalance(result.returnData);
                results.set(wallet.toLowerCase(), ethers.formatEther(balance));
            } else {
                results.set(wallet.toLowerCase(), "0");
            }
        }
    } catch (error) {
        console.error("Multicall ETH balance fetch failed:", error);
        // Return zeros for all
        for (const wallet of walletAddresses) {
            results.set(wallet.toLowerCase(), "0");
        }
    }

    return results;
}
