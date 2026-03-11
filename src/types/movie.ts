/*
  WHY THIS FILE EXISTS:
  Every TMDB API response shape is typed here. Keeping types in src/types/
  (rather than inline in component files or API files) means they can be
  imported anywhere without creating circular dependencies, and a single
  change here propagates everywhere.
*/

export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null      // relative path — use tmdbImage() to build full URL
  backdrop_path: string | null    // relative path — use tmdbImage() to build full URL
  release_date: string            // "YYYY-MM-DD"
  vote_average: number            // 0–10
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_title: string
  popularity: number
  video: boolean
}

export interface MovieListResponse {
  page: number
  results: Movie[]
  total_pages: number
  total_results: number
}

export interface MovieDetail extends Movie {
  // Extends Movie with fields only available from the /movie/{id} endpoint
  genres: { id: number; name: string }[]
  runtime: number | null          // minutes
  tagline: string
  status: string
  budget: number
  revenue: number
  homepage: string | null
  imdb_id: string | null
  production_companies: {
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }[]
}

export interface MovieVideo {
  id: string
  key: string                     // YouTube video key
  name: string
  site: 'YouTube' | 'Vimeo'
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Behind the Scenes' | 'Bloopers' | 'Featurette'
  official: boolean
  published_at: string
}

export interface MovieVideosResponse {
  id: number
  results: MovieVideo[]
}
