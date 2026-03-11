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
  - useState (local): isHovered — hover state is purely local, nothing else cares
  - useModal (Context): openModal — shared with HeroBanner, so it lives in Context

  TAILWIND NOTE:
  The poster image uses a `style` prop for the background-image URL because
  Tailwind cannot generate dynamic class names at runtime (it's a static scan).
  Dynamic styles must use the `style` prop.
*/

import { useState } from 'react'
import { tmdbImage } from '../../utils/tmdbImage'
import { useModal } from '../../contexts/ModalContext'
import type { Movie } from '../../types/movie'
import type { TVShow } from '../../types/tv'

interface TitleCardProps {
  title: Movie | TVShow
}

// Type guard: distinguishes Movie from TVShow at runtime
function isMovie(title: Movie | TVShow): title is Movie {
  return 'title' in title
}

export function TitleCard({ title }: TitleCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { openModal } = useModal()

  const displayName = isMovie(title) ? title.title : title.name
  const posterPath = tmdbImage(title.poster_path, 'w342')
  const backdropPath = tmdbImage(title.backdrop_path, 'w500')

  return (
    <button
      type="button"
      aria-label={`View details for ${displayName}`}
      className="relative w-36 sm:w-44 lg:w-48 rounded overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => openModal(title)}
    >
      {/* Poster image — aspect-[2/3] derives height from fixed width above */}
      <div
        className="w-full aspect-[2/3] bg-gray-800 bg-cover bg-center transition-transform duration-300 ease-in-out"
        style={{
          backgroundImage: posterPath ? `url(${posterPath})` : undefined,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
        aria-hidden="true"
      />

      {/* Hover overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/60 flex items-end p-2 transition-opacity">
          {backdropPath && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${backdropPath})` }}
              aria-hidden="true"
            />
          )}
          <p className="relative z-10 text-xs font-semibold text-white line-clamp-2 text-left">
            {displayName}
          </p>
        </div>
      )}
    </button>
  )
}
