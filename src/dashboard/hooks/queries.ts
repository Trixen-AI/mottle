// Cached, deduplicated reads. Every page that needs the same data shares one request.
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { Cluster } from '../config'
import { fetchActivity, fetchBalances } from '../lib/chain'

export function useBalances(cluster: Cluster, address: string | null) {
  return useQuery({
    queryKey: ['balances', cluster, address],
    queryFn: () => fetchBalances(cluster, address!),
    enabled: !!address,
    refetchInterval: 30_000,
  })
}

// Recent history used for analysis (exposure, pre-send checks, overview)
export const RECENT_LIMIT = 100
export function useRecentActivity(cluster: Cluster, address: string | null) {
  return useQuery({
    queryKey: ['activity', cluster, address, RECENT_LIMIT],
    queryFn: () => fetchActivity(cluster, address!, { limit: RECENT_LIMIT }),
    enabled: !!address,
    staleTime: 60_000,
  })
}

// Paged history for the Activity page
export function useActivityPages(cluster: Cluster, address: string | null) {
  return useInfiniteQuery({
    queryKey: ['activity-pages', cluster, address],
    queryFn: ({ pageParam }) => fetchActivity(cluster, address!, { limit: 25, before: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextBefore,
    enabled: !!address,
  })
}

export function useSolPrice() {
  return useQuery({
    queryKey: ['sol-price'],
    queryFn: async () => {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      if (!res.ok) throw new Error('price unavailable')
      const body = (await res.json()) as { solana?: { usd?: number } }
      return body.solana?.usd ?? null
    },
    staleTime: 120_000,
    retry: 0,
  })
}
