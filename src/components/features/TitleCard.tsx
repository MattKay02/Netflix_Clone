/*
  WHY THIS FILE EXISTS:
  The poster card is the atomic unit of the browse experience — used in every
  MovieRow and eventually in the Browse grid. Encapsulating the hover effect,
  image loading, and click behaviour here keeps MovieRow clean and the card
  style consistent everywhere.

  CARD SIZING:
  Cards use fixed widths at Tailwind breakpoints:
    < 640px  (sm) : w-36  = 144px wide, 216px tall  (aspect 2:3)
    640–1023 (lg) : w-44  = 176px wide, 264px tall
    ≥ 1024px      : w-48  = 192px wide, 288px tall

  These widths are the single source of truth. useCardsPerPage reads the same
  breakpoint values to calculate how many cards fit per row. If you change
  these widths, update CARD_WIDTHS in useCardsPerPage.ts to match.

  STATE USED:
  - useState (local): hoverRect — the card's DOMRect when the popup is open.
    null = popup closed. Component-scoped; nothing else cares.
  - useModal (Context): openModal — shared with HeroBanner and DetailModal,
    lives in Context.

  HOVER POPUP:
  A 175 ms delay fires before the popup appears. The popup shows a backdrop
  image, title, overview, and three action buttons. The chevron button (⌄)
  closes the popup and opens the full DetailModal for the title.

  PORTAL:
  The popup renders via createPortal into document.body using position:fixed,
  escaping every overflow:hidden ancestor without changes to parent components.
*/

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { tmdbImage } from '../../utils/tmdbImage'
import { useModal } from '../../contexts/ModalContext'
import type { Movie } from '../../types/movie'
import type { TVShow } from '../../types/tv'

const HOVER_DELAY_MS = 175

interface TitleCardProps {
  title: Movie | TVShow
}

function isMovie(t: Movie | TVShow): t is Movie {
  return 'title' in t
}

// ─── Hover popup ─────────────────────────────────────────────────────────────

interface HoverPopupProps {
  title: Movie | TVShow
  sourceRect: DOMRect
  onClose: () => void
  onOpenModal: () => void
}

function HoverPopup({ title, sourceRect, onClose, onOpenModal }: HoverPopupProps) {
  const [isClosing, setIsClosing] = useState(false)

  const titleIsMovie = isMovie(title)
  const displayName  = titleIsMovie ? title.title : title.name
  const backdropPath = tmdbImage(title.backdrop_path, 'w500')
  const posterPath   = tmdbImage(title.poster_path,   'w342')
  const heroImage    = backdropPath ?? posterPath

  const expandedWidth  = sourceRect.width * 2.25
  const backdropHeight = expandedWidth * (9 / 16)
  const infoHeight     = 148   // approximate info section height

  const centredLeft = sourceRect.left + sourceRect.width / 2 - expandedWidth / 2
  const left = Math.max(8, Math.min(window.innerWidth  - expandedWidth - 8, centredLeft))

  const centredTop  = sourceRect.top + sourceRect.height / 2 - (backdropHeight + infoHeight) / 2
  const top  = Math.max(8, Math.min(window.innerHeight - (backdropHeight + infoHeight) - 8, centredTop))

  function startClose() {
    if (isClosing) return
    setIsClosing(true)
    setTimeout(onClose, 150)
  }

  function handlePopupClick(e: React.MouseEvent) {
    // Only open modal if the click wasn't on an action button
    if ((e.target as HTMLElement).closest('button')) return
    startClose()
    onOpenModal()
  }

  return (
    <div
      className={`fixed z-[9999] rounded-lg overflow-hidden shadow-2xl cursor-pointer
        ${isClosing ? 'hover-card-out' : 'hover-card-in'}`}
      style={{ left, top, width: expandedWidth }}
      onMouseLeave={startClose}
      onClick={handlePopupClick}
    >
      {/* Backdrop image */}
      <div
        className="relative w-full bg-gray-800 bg-cover bg-center"
        style={{ height: backdropHeight, backgroundImage: heroImage ? `url(${heroImage})` : undefined }}
        aria-hidden="true"
      >
        <div className="absolute bottom-0 left-0 right-0 h-12
                        bg-gradient-to-b from-transparent to-[#181818]" />
      </div>

      {/* Info section */}
      <div className="bg-[#181818] px-3.5 pt-2 pb-3.5">
        <p className="text-white font-bold text-sm line-clamp-1 mb-1 leading-tight">
          {displayName}
        </p>

        {title.overview && (
          <p className="text-white/60 text-[11px] line-clamp-3 leading-snug mb-3">
            {title.overview}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          {/* Play */}
          <button
            type="button"
            aria-label="Play"
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center
                       hover:bg-white/85 transition-colors shrink-0"
          >
            <svg className="w-[18px] h-[18px] text-black translate-x-px" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {/* Add to My List — non-functional */}
          <button
            type="button"
            aria-label="Add to My List (coming soon)"
            title="Add to My List (coming soon)"
            className="w-9 h-9 rounded-full border-2 border-white/50
                       flex items-center justify-center
                       hover:border-white transition-colors shrink-0"
          >
            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>

          {/* Expand chevron — opens the full DetailModal (right-aligned) */}
          <button
            type="button"
            aria-label="More details"
            onClick={() => { startClose(); onOpenModal() }}
            className="ml-auto w-9 h-9 rounded-full border-2 border-white/50
                       flex items-center justify-center
                       hover:border-white transition-colors shrink-0"
          >
            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TitleCard ───────────────────────────────────────────────────────────────

export function TitleCard({ title }: TitleCardProps) {
  const { openModal } = useModal()

  const cardRef  = useRef<HTMLButtonElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null)

  const displayName = isMovie(title) ? title.title : title.name
  const posterPath  = tmdbImage(title.poster_path, 'w342')

  function handleMouseEnter() {
    timerRef.current = setTimeout(() => {
      if (cardRef.current) setHoverRect(cardRef.current.getBoundingClientRect())
    }, HOVER_DELAY_MS)
  }

  function handleMouseLeave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    // Popup manages its own mouse-leave — don't force-close here
  }

  // Close popup when the page scrolls (fixed position would drift from card)
  useEffect(() => {
    if (!hoverRect) return
    const close = () => setHoverRect(null)
    window.addEventListener('scroll', close, { passive: true })
    return () => window.removeEventListener('scroll', close)
  }, [hoverRect])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return (
    <>
      <button
        ref={cardRef}
        type="button"
        aria-label={`View details for ${displayName}`}
        className="relative w-36 sm:w-44 lg:w-48 rounded overflow-hidden cursor-pointer
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => openModal(title)}
      >
        <div
          className="w-full aspect-[2/3] bg-gray-800 bg-cover bg-center"
          style={{ backgroundImage: posterPath ? `url(${posterPath})` : undefined }}
          aria-hidden="true"
        />
      </button>

      {hoverRect && createPortal(
        <HoverPopup
          title={title}
          sourceRect={hoverRect}
          onClose={() => setHoverRect(null)}
          onOpenModal={() => openModal(title)}
        />,
        document.body
      )}
    </>
  )
}
