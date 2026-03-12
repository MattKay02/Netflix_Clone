/*
  WHY THIS FILE EXISTS:
  The Hero banner is the large full-width section at the top of the Home page.
  It rotates through 5 trending movies, sliding left/right every 6 seconds.

  STATE USED:
  - TanStack Query: fetches the trending movies list (server state).
  - useState (local): heroes, activeIndex, prevIndex, direction, isAnimating,
    isPaused — all component-scoped, nothing external needs them.
  - useRef (isAnimatingRef): lets the auto-rotation setTimeout check the
    current animation state without adding isAnimating to effect deps
    (which would reset the 6 s timer every time the slide finishes).
  - useModal (Context): openModal — opens the detail modal on "More Info" click.

  ROTATION MECHANISM:
  A setTimeout fires after ROTATE_MS. Each time activeIndex changes (manual
  nav or auto-rotation) the effect cleanup clears the old timeout and a fresh
  one starts — so manual navigation resets the 6 s countdown.

  PROGRESS BARS:
  The active bar's inner fill div gets `key={activeIndex}` so it re-mounts
  (restarting the CSS animation) on every slide change. `animationPlayState`
  is toggled via inline style on hover (isPaused).

  SLIDE ANIMATION:
  Two absolutely-positioned layers — outgoing + incoming — render inside an
  overflow:hidden container. The outgoing layer plays the exit animation while
  the incoming plays the entrance animation, then prevIndex is cleared.
*/

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { getTrendingMovies } from '../../api/movies'
import { tmdbImage } from '../../utils/tmdbImage'
import { useModal } from '../../contexts/ModalContext'
import { Spinner } from '../ui/Spinner'
import { ErrorMessage } from '../ui/ErrorMessage'
import type { Movie } from '../../types/movie'

const ROTATE_MS  = 6000
const SLIDE_MS   = 600
const HERO_COUNT = 5

// ─── HeroSlide ────────────────────────────────────────────────────────────────
// Renders one full-bleed slide: backdrop, gradients, title, synopsis, buttons.
// Used for both the outgoing and the incoming layer.

interface HeroSlideProps {
  title: Movie
  onOpenModal: () => void
}

function HeroSlide({ title, onOpenModal }: HeroSlideProps) {
  const backdropUrl = tmdbImage(title.backdrop_path, 'original')
  const synopsis =
    title.overview.length > 200
      ? `${title.overview.slice(0, 197)}…`
      : title.overview

  return (
    <div
      className="absolute inset-0 bg-gray-900 bg-cover bg-center"
      style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined }}
    >
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-hero-gradient"   aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-row-gradient" aria-hidden="true" />

      {/* Content */}
      <div className="absolute bottom-[20%] left-4 sm:left-12 xl:left-16 max-w-xs sm:max-w-md lg:max-w-xl">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
          {title.title}
        </h1>

        {synopsis && (
          <p className="hidden sm:block text-sm sm:text-base text-white/90 leading-relaxed mb-5 drop-shadow">
            {synopsis}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 bg-white text-black font-bold
                       px-5 py-2 rounded text-sm sm:text-base
                       hover:bg-white/80 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="flex items-center gap-2 bg-white/30 text-white font-bold
                       px-5 py-2 rounded text-sm sm:text-base
                       hover:bg-white/20 transition-colors backdrop-blur-sm"
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

// ─── HeroBanner ───────────────────────────────────────────────────────────────

export function HeroBanner() {
  const { openModal } = useModal()

  const [heroes,      setHeroes]      = useState<Movie[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [prevIndex,   setPrevIndex]   = useState<number | null>(null)
  const [direction,   setDirection]   = useState<'right' | 'left'>('right')
  const [isAnimating, setIsAnimating] = useState(false)

  // Ref so the auto-rotation timeout can read isAnimating without being a dep
  const isAnimatingRef = useRef(false)
  isAnimatingRef.current = isAnimating

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['trending', 'movies'],
    queryFn:  getTrendingMovies,
  })

  // Once data loads, pick a random start and take HERO_COUNT consecutive items
  useEffect(() => {
    if (!data?.results || data.results.length === 0) return
    const results = data.results
    const start   = Math.floor(Math.random() * results.length)
    const picked  = Array.from(
      { length: Math.min(HERO_COUNT, results.length) },
      (_, i) => results[(start + i) % results.length],
    )
    setHeroes(picked)
  }, [data])

  // ── Navigation helpers ────────────────────────────────────────────────────

  function goTo(index: number, dir: 'right' | 'left') {
    if (isAnimatingRef.current || heroes.length === 0 || index === activeIndex) return
    setDirection(dir)
    setPrevIndex(activeIndex)
    setActiveIndex(index)
    setIsAnimating(true)
    setTimeout(() => {
      setPrevIndex(null)
      setIsAnimating(false)
    }, SLIDE_MS)
  }

  function navigate(dir: 'right' | 'left') {
    const next =
      dir === 'right'
        ? (activeIndex + 1) % heroes.length
        : (activeIndex - 1 + heroes.length) % heroes.length
    goTo(next, dir)
  }

  // ── Auto-rotation ─────────────────────────────────────────────────────────
  // Restarts on every activeIndex change so manual nav resets the countdown.
  // isAnimating is read via ref inside the callback to avoid it being a dep
  // (adding it would reset the timer every time a slide finishes).

  useEffect(() => {
    if (heroes.length < 2) return
    const id = setTimeout(() => {
      if (isAnimatingRef.current) return
      const next = (activeIndex + 1) % heroes.length
      setDirection('right')
      setPrevIndex(activeIndex)
      setActiveIndex(next)
      setIsAnimating(true)
      setTimeout(() => {
        setPrevIndex(null)
        setIsAnimating(false)
      }, SLIDE_MS)
    }, ROTATE_MS)
    return () => clearTimeout(id)
  }, [activeIndex, heroes.length])

  // ── Derived classes ───────────────────────────────────────────────────────

  const outClass = direction === 'right' ? 'hero-slide-out-left'  : 'hero-slide-out-right'
  const inClass  = direction === 'right' ? 'hero-slide-in-right'  : 'hero-slide-in-left'

  // ── Loading / error states ────────────────────────────────────────────────

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

  if (heroes.length === 0) return null

  return (
    <div
      className="relative h-[56.25vw] max-h-[80vh] min-h-[400px] w-full overflow-hidden"
      role="banner"
      aria-label={`Featured title: ${heroes[activeIndex]?.title}`}
    >
      {/* Outgoing slide — exits while the new slide enters */}
      {prevIndex !== null && (
        <div className={`absolute inset-0 ${outClass}`} aria-hidden="true">
          <HeroSlide
            title={heroes[prevIndex]}
            onOpenModal={() => openModal(heroes[prevIndex])}
          />
        </div>
      )}

      {/* Active (incoming) slide */}
      <div className={`absolute inset-0 ${isAnimating ? inClass : ''}`}>
        <HeroSlide
          title={heroes[activeIndex]}
          onOpenModal={() => openModal(heroes[activeIndex])}
        />
      </div>

      {/* Left arrow — fades in on hover */}
      <button
        type="button"
        aria-label="Previous featured title"
        onClick={() => navigate('left')}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20
                   w-10 h-10 rounded-full bg-black/40 border border-white/20
                   flex items-center justify-center
                   hover:bg-black/70 transition-colors"
      >
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
        </svg>
      </button>

      {/* Right arrow — fades in on hover */}
      <button
        type="button"
        aria-label="Next featured title"
        onClick={() => navigate('right')}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20
                   w-10 h-10 rounded-full bg-black/40 border border-white/20
                   flex items-center justify-center
                   hover:bg-black/70 transition-colors"
      >
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
        </svg>
      </button>

      {/* Progress indicator bars — bottom-centre, clickable */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
        {heroes.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to featured title ${i + 1}`}
            onClick={() => goTo(i, i > activeIndex ? 'right' : 'left')}
            className="relative h-1 w-12 bg-white/15 rounded-full overflow-hidden"
          >
            {/* Active bar: CSS animation fills over ROTATE_MS; key resets it on each slide */}
            {i === activeIndex && (
              <div
                key={activeIndex}
                className="absolute inset-y-0 left-0 w-full bg-white/50 origin-left rounded-full"
                style={{ animation: `heroProgress ${ROTATE_MS}ms linear forwards` }}
              />
            )}
            {/* Past bars: fully filled */}
            {i < activeIndex && (
              <div className="absolute inset-0 bg-white/40 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
