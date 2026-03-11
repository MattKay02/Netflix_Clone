/*
  WHY THIS FILE EXISTS:
  Each genre section on the Home page is a horizontal scrollable row of
  TitleCards with a label. MovieRow is that row. It owns its own query via
  TanStack Query — each row independently fetches and caches its genre data.

  STATE USED:
  - TanStack Query: server state for movie list — loading/error handled here
  - No local state needed: scroll position is handled natively by CSS overflow-x

  WHY EACH ROW HAS ITS OWN QUERY (not fetching all genres at once):
  Independent queries mean independent caching. If the "Action" row is already
  cached and you navigate back to Home, only the uncached rows re-fetch.
  A single "fetch all genres" call would bust the entire cache if any one
  genre changed.
*/

import { useQuery } from '@tanstack/react-query'
import { TitleCard } from './TitleCard'
import { Spinner } from '../ui/Spinner'
import { ErrorMessage } from '../ui/ErrorMessage'
import type { Movie, MovieListResponse } from '../../types/movie'
import type { TVShow, TVListResponse } from '../../types/tv'

interface MovieRowProps {
  /** Display label shown above the row (e.g. "Action", "Trending Now") */
  label: string
  /**
   * TanStack Query key for this row's data.
   * Must be unique per row — used for caching and deduplication.
   */
  queryKey: string[]
  /** The async function that fetches the row's titles */
  queryFn: () => Promise<MovieListResponse | TVListResponse>
}

export function MovieRow({ label, queryKey, queryFn }: MovieRowProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn,
  })

  const titles = data?.results as (Movie | TVShow)[] | undefined

  return (
    <section className="mb-8" aria-labelledby={`row-${queryKey.join('-')}`}>
      <h2
        id={`row-${queryKey.join('-')}`}
        className="text-sm sm:text-base font-semibold text-white mb-2 px-4 sm:px-12"
      >
        {label}
      </h2>

      {isLoading && (
        <div className="px-4 sm:px-12">
          <Spinner size="sm" label={`Loading ${label}`} />
        </div>
      )}

      {isError && (
        <div className="px-4 sm:px-12">
          <ErrorMessage error={error as Error} />
        </div>
      )}

      {titles && titles.length > 0 && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto px-4 sm:px-12 pb-2 scroll-smooth">
            {titles.map((title) => (
              <TitleCard key={title.id} title={title} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
