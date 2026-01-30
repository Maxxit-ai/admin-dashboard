import { QueryClient } from "@tanstack/react-query";

// Singleton query client with optimized defaults for admin dashboard
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Data is fresh for 30 seconds - no refetch within this window
                staleTime: 30 * 1000,
                // Cache unused data for 5 minutes
                gcTime: 5 * 60 * 1000,
                // Don't refetch on window focus - admin dashboards are intentionally refreshed
                refetchOnWindowFocus: false,
                // Retry failed requests up to 2 times
                retry: 2,
                // Retry delay with exponential backoff
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}
