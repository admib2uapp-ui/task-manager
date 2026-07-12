import { QueryClient, type DefaultOptions } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Never retry auth / client errors.
      if (error instanceof ApiError && error.status < 500) return false;
      return failureCount < 2;
    },
  },
  mutations: {
    retry: false,
  },
};

/**
 * Factory so the server and each browser tab get an isolated cache.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions });
}
