/*
  WHY THIS FILE EXISTS:
  Each genre section on the Home page is a paginated row of TitleCards navigated
  by arrow buttons. Clicking → slides the current page out left and brings the
  next page in from the right. Clicking ← does the reverse. The right arrow
  loops back to page 0 (continuing in the same forward direction). The left
  arrow is invisible on page 0.

  STATE USED:
  - TanStack Query: server state for the movie list (loading/error handled here)
  - useState — page, prevPage, direction, isAnimating: all local to this row.
    No other component cares which page a row is on.
  - useRef (viewportRef): attached to the cards container so useCardsPerPage
    can measure the available width with a ResizeObserver.

  CARD SIZING:
  Cards have fixed pixel widths set in TitleCard.tsx (w-36/w-44/lg:w-48).
  The grid uses `auto` columns so each column is exactly card-width — no
  stretching. Trailing space at the end of a row is intentional when the last
  page has fewer cards than a full page. useCardsPerPage calculates how many
  complete fixed-size cards fit in the container at the current breakpoint.
  On resize, page resets to 0 to avoid landing on an out-of-range page.

  ANIMATION MECHANISM:
  Two divs are rendered inside an overflow:hidden container:
    1. "Outgoing" (prevPage): absolutely positioned, plays the exit animation.
    2. "Incoming" (page): takes up natural height, plays the entrance animation.
  After SLIDE_DURATION ms, prevPage is cleared and animation classes drop off.

  IMPORTANT — WHY viewportRef IS ALWAYS RENDERED:
  The ref must be attached to a DOM element from the very first render so the
  ResizeObserver in useCardsPerPage attaches on mount. If the container div were
  inside a conditional (e.g. `{titles && ...}`), the ref would be null when the
  effect runs, the observer would never attach, and cardsPerPage would never
  update from its initial value. Loading and error states therefore render
  INSIDE the always-present container div.

  WHY EACH ROW HAS ITS OWN QUERY:
  Independent queries mean independent caching — navigating back only re-fetches
  expired rows, not the entire page.
*/

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TitleCard } from './TitleCard'
import { Spinner } from '../ui/Spinner'
import { ErrorMessage } from '../ui/ErrorMessage'
import { useCardsPerPage, GAP_PX } from '../../hooks/useCardsPerPage'
import type { Movie, MovieListResponse } from '../../types/movie'
import type { TVShow, TVListResponse } from '../../types/tv'

const SLIDE_DURATION = 450 // ms — must match the CSS animation duration

interface MovieRowProps {
  label: string
  queryKey: string[]
  queryFn: () => Promise<MovieListResponse | TVListResponse>
}

export function MovieRow({ label, queryKey, queryFn }: MovieRowProps) {
  // viewportRef is always rendered (see note above) so the ResizeObserver
  // attaches on mount, before TanStack Query has finished fetching.
  const viewportRef = useRef<HTMLDivElement>(null)
  const cardsPerPage = useCardsPerPage(viewportRef)

  const [page, setPage]               = useState(0)
  const [prevPage, setPrevPage]       = useState<number | null>(null)
  const [direction, setDirection]     = useState<'right' | 'left'>('right')
  const [isAnimating, setIsAnimating] = useState(false)

  const { data, isLoading, isError, error } = useQuery({ queryKey, queryFn })
  const titles = data?.results as (Movie | TVShow)[] | undefined

  const totalPages = titles ? Math.ceil(titles.length / cardsPerPage) : 0

  // Reset to page 0 when cardsPerPage changes (e.g. window resize)
  useEffect(() => {
    setPage(0)
    setPrevPage(null)
    setIsAnimating(false)
  }, [cardsPerPage])

  const getPageSlice = useCallback(
    (p: number): (Movie | TVShow)[] => {
      if (!titles) return []
      return titles.slice(p * cardsPerPage, (p + 1) * cardsPerPage)
    },
    [titles, cardsPerPage]
  )

  const navigate = (dir: 'right' | 'left') => {
    if (isAnimating || !titles) return

    const nextPage =
      dir === 'right'
        ? (page + 1) % totalPages
        : Math.max(0, page - 1)

    if (dir === 'left' && page === 0) return

    setDirection(dir)
    setPrevPage(page)
    setPage(nextPage)
    setIsAnimating(true)

    setTimeout(() => {
      setPrevPage(null)
      setIsAnimating(false)
    }, SLIDE_DURATION)
  }

  const outClass = direction === 'right' ? 'row-slide-out-left'  : 'row-slide-out-right'
  const inClass  = direction === 'right' ? 'row-slide-in-right'  : 'row-slide-in-left'

  const rowId = `row-${queryKey.join('-')}`
  // GAP_PX imported from useCardsPerPage — single source of truth for card spacing.
  const gridStyle = {
    gridTemplateColumns: `repeat(${cardsPerPage}, auto)`,
    gap: `${GAP_PX}px`,
    justifyContent: 'start',
  }

  return (
    <section className="mb-8" aria-labelledby={rowId}>
      {/* Row header + page indicator */}
      <div className="flex items-center justify-between px-10 xl:px-16 mb-2">
        <h2 id={rowId} className="text-sm sm:text-base font-semibold text-white">
          {label}
        </h2>
        {totalPages > 1 && (
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: totalPages }).map((_, i) => (
              <span
                key={i}
                className={`block h-0.5 w-3 transition-colors duration-300 ${
                  i === page ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Outer wrapper — always rendered so arrow buttons have a positioned parent */}
      <div className="relative">
        {/* Left arrow — invisible at page 0 */}
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => navigate('left')}
          className={`absolute left-0 top-0 bottom-0 z-20 w-10 xl:w-16 flex items-center justify-center
            bg-black/50 hover:bg-black/80 transition-colors
            ${page === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
          </svg>
        </button>

        {/*
          Cards viewport — ALWAYS rendered.
          min-h matches card heights at each breakpoint so arrows have
          a consistent hit target during loading.
        */}
        <div
          ref={viewportRef}
          className="overflow-hidden mx-10 xl:mx-16 relative min-h-[216px] sm:min-h-[264px] lg:min-h-[288px]"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="sm" label={`Loading ${label}`} />
            </div>
          )}

          {isError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ErrorMessage error={error as Error} />
            </div>
          )}

          {titles && titles.length > 0 && (
            <>
              {/* Outgoing — absolute overlay, plays exit animation */}
              {prevPage !== null && (
                <div
                  className={`absolute inset-0 grid ${outClass}`}
                  style={gridStyle}
                  aria-hidden="true"
                >
                  {getPageSlice(prevPage).map((title) => (
                    <TitleCard key={title.id} title={title} />
                  ))}
                </div>
              )}

              {/* Incoming — natural flow (sets container height), plays entrance animation */}
              <div
                className={`grid ${isAnimating ? inClass : ''}`}
                style={gridStyle}
              >
                {getPageSlice(page).map((title) => (
                  <TitleCard key={title.id} title={title} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          aria-label="Next page"
          onClick={() => navigate('right')}
          className="absolute right-0 top-0 bottom-0 z-20 w-10 xl:w-16 flex items-center justify-center bg-black/50 hover:bg-black/80 transition-colors"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
          </svg>
        </button>
      </div>
    </section>
  )
}
