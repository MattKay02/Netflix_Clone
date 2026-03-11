/*
  WHY THIS FILE EXISTS:
  TV show responses from TMDB use different field names than movies (e.g.
  `name` instead of `title`, `first_air_date` instead of `release_date`).
  Keeping these as separate interfaces (rather than a union) makes it explicit
  which type you're working with at any given point. The ModalContext uses a
  union `Movie | TVShow` to represent "any title that can be shown in a modal".
*/

export interface TVShow {
  id: number
  name: string                    // NOTE: "name" not "title" (unlike Movie)
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string          // "YYYY-MM-DD"
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_name: string
  popularity: number
  origin_country: string[]
}

export interface TVListResponse {
  page: number
  results: TVShow[]
  total_pages: number
  total_results: number
}

export interface TVDetail extends TVShow {
  // Extends TVShow with fields only available from the /tv/{id} endpoint
  genres: { id: number; name: string }[]
  number_of_episodes: number
  number_of_seasons: number
  tagline: string
  status: string
  homepage: string | null
  episode_run_time: number[]
  networks: {
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }[]
}

// Genre map — TMDB returns genre IDs in list responses; use this to display names
export interface Genre {
  id: number
  name: string
}

export interface GenreListResponse {
  genres: Genre[]
}
