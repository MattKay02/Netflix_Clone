/*
  WHY THIS FILE EXISTS:
  TMDB API returns image paths as relative strings (e.g. "/abc123.jpg").
  The full URL requires a base URL and a size prefix. Without this helper,
  image URLs get constructed inline in JSX across many files in slightly
  different ways, making it impossible to change the base URL in one place.

  ALWAYS use this function — never concatenate tmdb image URLs manually.

  Sizes reference: https://developer.themoviedb.org/docs/image-basics
  - w185  : small thumbnail
  - w342  : medium card / poster
  - w500  : standard card
  - w780  : hero / large card
  - original : full resolution (use sparingly — large files)
*/

export type ImageSize = 'w185' | 'w342' | 'w500' | 'w780' | 'original'

/**
 * Builds a full TMDB image URL from a relative path.
 *
 * @param path   - The relative image path from TMDB API (e.g. "/abc123.jpg")
 * @param size   - The desired image size
 * @returns      Full URL string, or empty string if path is null/undefined
 *
 * @example
 * tmdbImage('/abc123.jpg', 'w500')
 * // → "https://image.tmdb.org/t/p/w500/abc123.jpg"
 */
export const tmdbImage = (path: string | null | undefined, size: ImageSize): string => {
  if (!path) return ''
  return `${import.meta.env.VITE_TMDB_IMAGE_BASE}/${size}${path}`
}
