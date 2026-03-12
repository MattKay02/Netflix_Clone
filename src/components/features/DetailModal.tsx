/*
  WHY THIS FILE EXISTS:
  The DetailModal is the full-screen detail overlay triggered by:
    - "More Info" on the HeroBanner
    - The expand chevron on a TitleCard hover popup
    - Clicking a similar title card inside another DetailModal

  It uses ModalContext so any component in the tree can open it for any title
  without prop drilling. The modal renders into document.body via a portal so
  it appears above every element regardless of stacking contexts.

  STATE USED:
  - useModal (Context): activeTitle, closeModal — which title to show and how
    to dismiss. Context because multiple distant components trigger it.
  - useState (local): isClosing — drives the exit animation before the modal is
    removed from the DOM. Component-scoped; nothing external cares.
  - TanStack Query: detail, credits, similar — server state fetched as soon as
    activeTitle is set. Cached 5 min so reopening the same title is instant.

  SIMILAR SHOWS:
  The "More Like This" row fetches /movie/{id}/similar or /tv/{id}/similar.
  Results are shown in a horizontally-scrollable row of poster cards (overflow-x
  with scrollbar hidden). Clicking a card calls openModal for the new title —
  the same modal re-renders with fresh data for the selected title.
*/

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { tmdbImage } from '../../utils/tmdbImage'
import { useModal } from '../../contexts/ModalContext'
import { getMovieDetail, getMovieCredits, getSimilarMovies } from '../../api/movies'
import { getTVDetail, getTVCredits, getSimilarTV } from '../../api/tv'
import { Spinner } from '../ui/Spinner'
import type { Movie } from '../../types/movie'
import type { TVShow } from '../../types/tv'

function isMovie(t: Movie | TVShow): t is Movie {
  return 'title' in t
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ─── Similar poster card ──────────────────────────────────────────────────────
// Clicking a similar card re-opens the same modal for the new title.
// No hover popup is shown here — keeping the nested interaction simple.

function SimilarCard({ title }: { title: Movie | TVShow }) {
  const { openModal } = useModal()
  const displayName = isMovie(title) ? title.title : title.name
  const posterPath  = tmdbImage(title.poster_path, 'w342')
  const year = (isMovie(title)
    ? title.release_date
    : title.first_air_date
  )?.slice(0, 4)

  return (
    <button
      type="button"
      onClick={() => openModal(title)}
      aria-label={`View details for ${displayName}`}
      className="w-[130px] shrink-0 cursor-pointer text-left group
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red"
    >
      <div
        className="w-full aspect-[2/3] bg-gray-800 bg-cover bg-center rounded
                   overflow-hidden transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundImage: posterPath ? `url(${posterPath})` : undefined }}
        aria-hidden="true"
      />
      <p className="text-white text-xs font-medium mt-2 line-clamp-1 leading-tight">
        {displayName}
      </p>
      {year && (
        <p className="text-white/40 text-[10px] mt-0.5">{year}</p>
      )}
    </button>
  )
}

// ─── Modal content ────────────────────────────────────────────────────────────

interface ModalContentProps {
  title: Movie | TVShow
  onRequestClose: () => void
}

function ModalContent({ title, onRequestClose }: ModalContentProps) {
  const [isClosing, setIsClosing] = useState(false)

  const titleIsMovie = isMovie(title)
  const titleId      = title.id
  const displayName  = titleIsMovie ? title.title : title.name
  const backdropUrl  = tmdbImage(title.backdrop_path, 'original')
  const year         = (titleIsMovie
    ? (title as Movie).release_date
    : (title as TVShow).first_air_date
  )?.slice(0, 4)

  // ── 6 queries: detail + credits + similar, 3 enabled at a time ───────────
  const { data: movieDetail } = useQuery({
    queryKey:  ['movies', 'detail',  String(titleId)],
    queryFn:   () => getMovieDetail(titleId),
    enabled:   titleIsMovie,
    staleTime: 5 * 60 * 1000,
  })
  const { data: tvDetail } = useQuery({
    queryKey:  ['tv', 'detail', String(titleId)],
    queryFn:   () => getTVDetail(titleId),
    enabled:   !titleIsMovie,
    staleTime: 5 * 60 * 1000,
  })
  const { data: movieCredits } = useQuery({
    queryKey:  ['movies', 'credits', String(titleId)],
    queryFn:   () => getMovieCredits(titleId),
    enabled:   titleIsMovie,
    staleTime: 5 * 60 * 1000,
  })
  const { data: tvCredits } = useQuery({
    queryKey:  ['tv', 'credits', String(titleId)],
    queryFn:   () => getTVCredits(titleId),
    enabled:   !titleIsMovie,
    staleTime: 5 * 60 * 1000,
  })
  const { data: similarMovies, isLoading: similarMoviesLoading } = useQuery({
    queryKey:  ['movies', 'similar', String(titleId)],
    queryFn:   () => getSimilarMovies(titleId),
    enabled:   titleIsMovie,
    staleTime: 5 * 60 * 1000,
  })
  const { data: similarTV, isLoading: similarTVLoading } = useQuery({
    queryKey:  ['tv', 'similar', String(titleId)],
    queryFn:   () => getSimilarTV(titleId),
    enabled:   !titleIsMovie,
    staleTime: 5 * 60 * 1000,
  })

  const credits        = titleIsMovie ? movieCredits  : tvCredits
  const similarData    = titleIsMovie ? similarMovies : similarTV
  const similarLoading = titleIsMovie ? similarMoviesLoading : similarTVLoading

  // ── Derived display values ────────────────────────────────────────────────
  const cast      = credits?.cast.slice(0, 6).map(c => c.name) ?? []
  const directors = credits?.crew.filter(c => c.job === 'Director').map(c => c.name) ?? []
  const genres    = movieDetail?.genres ?? tvDetail?.genres ?? []

  const runtimeDisplay: string | null = (() => {
    if (movieDetail?.runtime) return formatRuntime(movieDetail.runtime)
    if (tvDetail) {
      const s   = tvDetail.number_of_seasons
      const ep  = tvDetail.number_of_episodes
      const epT = tvDetail.episode_run_time?.[0]
      return [
        `${s} Season${s !== 1 ? 's' : ''}`,
        ep ? `${ep} Episodes` : null,
        epT ? `${epT} min/ep` : null,
      ].filter(Boolean).join(' · ')
    }
    return null
  })()

  const tagline    = movieDetail?.tagline || tvDetail?.tagline || null
  const language   = title.original_language?.toUpperCase()
  const matchScore = Math.round(title.vote_average * 10)

  // ── Similar row scroll ────────────────────────────────────────────────────
  const similarRowRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft,  setCanScrollLeft]  = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateScrollState() {
    const el = similarRowRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  function scrollSimilar(dir: 'left' | 'right') {
    const el = similarRowRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' })
  }

  useEffect(() => {
    // After data renders, check if the row is wide enough to scroll right
    setTimeout(updateScrollState, 0)
  }, [similarData])

  // ── Close helpers ─────────────────────────────────────────────────────────
  function handleClose() {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(onRequestClose, 250)
  }

  // Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  // handleClose is stable within this render — exhaustive-deps not needed here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClosing])

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* Dimmed page backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/75 transition-opacity duration-300
          ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Centering wrapper — flexbox avoids transform conflicts with scale animation */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-[900px] max-h-[88vh] overflow-y-auto scrollbar-hide
            bg-[#181818] rounded-lg shadow-[0_8px_60px_rgba(0,0,0,0.85)]
            ${isClosing ? 'modal-scale-out' : 'modal-scale-in'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Backdrop image ─────────────────────────────────────────── */}
          <div
            className="relative w-full aspect-video bg-gray-900 bg-cover bg-center"
            style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined }}
          >
            {/* Subtle left-side vignette */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#181818]/40 via-transparent to-transparent"
              aria-hidden="true"
            />
            {/* Bottom fade — crucial for title/button readability */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/30 to-transparent"
              aria-hidden="true"
            />

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full
                         bg-[#181818]/80 border border-white/20
                         flex items-center justify-center
                         hover:bg-[#181818] transition-colors"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>

            {/* Title + actions overlaid on gradient */}
            <div className="absolute bottom-8 left-6 sm:left-10 right-14 z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white
                             leading-tight mb-5 drop-shadow-lg">
                {displayName}
              </h2>

              <div className="flex items-center gap-3">
                {/* Play — non-functional placeholder */}
                <button
                  type="button"
                  className="flex items-center gap-2 bg-white text-black font-bold
                             px-5 sm:px-7 py-2.5 rounded text-sm
                             hover:bg-white/85 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </button>

                {/* Add to My List — non-functional */}
                <button
                  type="button"
                  title="Add to My List (coming soon)"
                  aria-label="Add to My List"
                  className="w-10 h-10 rounded-full border-2 border-white/60
                             flex items-center justify-center
                             hover:border-white transition-colors"
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── Content section ─────────────────────────────────────────── */}
          <div className="px-6 sm:px-10 pb-10 pt-5">

            {/* Stats row */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-sm mb-3">
              <span className="text-green-400 font-semibold">{matchScore}% Match</span>
              {year && <span className="text-white/70">{year}</span>}
              {runtimeDisplay && (
                <span className="text-white/70">{runtimeDisplay}</span>
              )}
              {language && (
                <span className="text-[11px] border border-white/30 text-white/50
                                 px-1.5 py-0.5 rounded">
                  {language}
                </span>
              )}
            </div>

            {/* Tagline */}
            {tagline && (
              <p className="text-white/40 text-sm italic mb-5">"{tagline}"</p>
            )}

            {/* Two-column layout: overview (left) + metadata (right) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* Overview */}
              <div className="md:col-span-2">
                <p className="text-white/85 text-sm leading-relaxed">
                  {title.overview}
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-2.5 text-sm">
                {cast.length > 0 && (
                  <p className="text-white/55 leading-snug">
                    <span className="text-white/30">Starring: </span>
                    {cast.join(', ')}
                  </p>
                )}
                {genres.length > 0 && (
                  <p className="text-white/55 leading-snug">
                    <span className="text-white/30">Genres: </span>
                    {genres.map(g => g.name).join(', ')}
                  </p>
                )}
                {directors.length > 0 && (
                  <p className="text-white/55 leading-snug">
                    <span className="text-white/30">
                      {directors.length === 1 ? 'Director: ' : 'Directors: '}
                    </span>
                    {directors.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* ── More Like This ─────────────────────────────────────── */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4
                             pb-2 border-b border-white/10">
                More Like This
              </h3>

              {similarLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner size="sm" label="Loading similar titles" />
                </div>
              ) : similarData && similarData.results.length > 0 ? (
                <div className="relative">
                  {/* Left arrow */}
                  <button
                    type="button"
                    aria-label="Scroll left"
                    onClick={() => scrollSimilar('left')}
                    className={`absolute left-0 top-0 bottom-3 z-10 w-10 flex items-center justify-center
                      bg-black/50 hover:bg-black/80 transition-colors rounded-l
                      ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                    </svg>
                  </button>

                  <div
                    ref={similarRowRef}
                    onScroll={updateScrollState}
                    onLoad={updateScrollState}
                    className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
                  >
                    {(similarData.results as (Movie | TVShow)[]).slice(0, 20).map(t => (
                      <SimilarCard key={t.id} title={t} />
                    ))}
                  </div>

                  {/* Right arrow */}
                  <button
                    type="button"
                    aria-label="Scroll right"
                    onClick={() => scrollSimilar('right')}
                    className={`absolute right-0 top-0 bottom-3 z-10 w-10 flex items-center justify-center
                      bg-black/50 hover:bg-black/80 transition-colors rounded-r
                      ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <p className="text-white/30 text-sm">No similar titles found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── DetailModal (exported) ───────────────────────────────────────────────────

export function DetailModal() {
  const { activeTitle, closeModal } = useModal()

  if (!activeTitle) return null

  return createPortal(
    // key forces a fresh ModalContent mount when the title changes —
    // resets isClosing state and scroll position for the new title
    <ModalContent
      key={activeTitle.id}
      title={activeTitle}
      onRequestClose={closeModal}
    />,
    document.body
  )
}
