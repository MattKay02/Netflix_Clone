/*
  WHY THIS FILE EXISTS:
  The Hero banner is the large full-width section at the top of the Home page.
  It shows a random trending movie with its backdrop image, title, synopsis,
  and two action buttons: Play and More Info.

  STATE USED:
  - TanStack Query: fetches the trending movies list (server state)
  - useState (local): heroTitle — the randomly selected movie from the list.
    This is LOCAL state because only HeroBanner displays it. The random
    selection happens once on mount and doesn't need to be shared.
  - useModal (Context): openModal — opens the detail modal on "More Info" click

  WHY THE HERO PICKS A RANDOM MOVIE:
  Netflix's hero rotates through trending content. We replicate this by
  randomly selecting from the trending list on each page load. We could use
  the first result, but a random pick makes the app feel more alive.

  NOTE: The backdrop image uses a `style` prop because Tailwind can't generate
  dynamic class names with runtime values (background-image URLs).
*/

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getTrendingMovies, getRandomMovie } from '../../api/movies'
import { tmdbImage } from '../../utils/tmdbImage'
import { useModal } from '../../contexts/ModalContext'
import { Spinner } from '../ui/Spinner'
import { ErrorMessage } from '../ui/ErrorMessage'
import type { Movie } from '../../types/movie'

export function HeroBanner() {
  const { openModal } = useModal()
  const [heroTitle, setHeroTitle] = useState<Movie | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['trending', 'movies'],
    queryFn: getTrendingMovies,
  })

  // Once data loads, pick a random movie for the hero
  // useEffect is correct here — it's NOT fetching data, it's reacting to
  // already-fetched data changing. This is a valid useEffect use case.
  useEffect(() => {
    if (data?.results && data.results.length > 0) {
      setHeroTitle(getRandomMovie(data.results))
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="h-[56.25vw] max-h-[80vh] flex items-center justify-center bg-gray-900">
        <Spinner size="lg" label="Loading hero content" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-[56.25vw] max-h-[80vh] flex items-center justify-center bg-gray-900">
        <ErrorMessage error={error as Error} />
      </div>
    )
  }

  if (!heroTitle) return null

  const backdropUrl = tmdbImage(heroTitle.backdrop_path, 'original')
  // Truncate overview to ~200 chars for the banner synopsis
  const synopsis =
    heroTitle.overview.length > 200
      ? `${heroTitle.overview.slice(0, 197)}…`
      : heroTitle.overview

  return (
    <div
      className="relative h-[56.25vw] max-h-[80vh] min-h-[400px] w-full bg-gray-900 bg-cover bg-center"
      style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined }}
      role="banner"
      aria-label={`Featured title: ${heroTitle.title}`}
    >
      {/* Gradient overlays — left-to-right fade + bottom fade into the page */}
      <div className="absolute inset-0 bg-hero-gradient" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-row-gradient" aria-hidden="true" />

      {/* Content */}
      <div className="absolute bottom-[20%] left-4 sm:left-12 xl:left-16 max-w-xs sm:max-w-md lg:max-w-xl">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
          {heroTitle.title}
        </h1>

        {synopsis && (
          <p className="hidden sm:block text-sm sm:text-base text-white/90 leading-relaxed mb-5 drop-shadow">
            {synopsis}
          </p>
        )}

        <div className="flex gap-3">
          {/* Play button — placeholder (no video player yet) */}
          <button
            type="button"
            className="flex items-center gap-2 bg-white text-black font-bold px-5 py-2 rounded text-sm sm:text-base hover:bg-white/80 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>

          {/* More Info → opens the modal */}
          <button
            type="button"
            onClick={() => openModal(heroTitle)}
            className="flex items-center gap-2 bg-white/30 text-white font-bold px-5 py-2 rounded text-sm sm:text-base hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            More Info
          </button>
        </div>
      </div>
    </div>
  )
}
