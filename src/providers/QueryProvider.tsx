/*
  WHY THIS FILE EXISTS:
  TanStack Query requires a QueryClient instance and a QueryClientProvider
  wrapper. Isolating this in its own file keeps main.tsx clean and makes the
  QueryClient configuration easy to find and adjust.

  The QueryClient is configured here with sensible defaults for a TMDB app:
  - staleTime of 5 minutes: TMDB data doesn't change second-to-second.
    Keeping cached data fresh for 5 minutes prevents unnecessary API calls
    when the user navigates back to a page they've already visited.
  - retry: 1: Failed requests retry once. TMDB is generally reliable;
    more retries just delay showing the user an error message.
  - refetchOnWindowFocus: false: The default (true) would re-fetch all
    active queries every time the user switches tabs. That's too aggressive
    for a mostly-static catalogue app.

  USAGE: Wrap your app root with <QueryProvider> in main.tsx.
*/

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
