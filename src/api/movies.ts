/*
  WHY THIS FILE EXISTS:
  All movie-related TMDB API calls live here. Keeping API functions in
  dedicated files (rather than inside components or hooks) means:
  - They're reusable across multiple hooks/components
  - They're easy to mock in tests
  - The data-fetching logic is decoupled from the component rendering logic

  These functions are consumed by TanStack Query hooks (useQuery), never
  called directly inside components. See the hooks/ directory for the
  corresponding query hooks.
*/

import { tmdbClient } from './tmdb.client'
import type { Movie, MovieListResponse, MovieDetail, MovieVideosResponse } from '../types/movie'

/**
 * Fetch the current trending movies (day window).
 * Used by HeroBanner — we pick a random item from the results.
 */
export const getTrendingMovies = async (): Promise<MovieListResponse> => {
  const { data } = await tmdbClient.get<MovieListResponse>('/trending/movie/week')
  return data
}

/**
 * Fetch movies for a specific genre.
 * Used by MovieRow — each row corresponds to one genre.
 *
 * @param genreId - TMDB genre ID (see TMDB genre list endpoint)
 */
export const getMoviesByGenre = async (genreId: number): Promise<MovieListResponse> => {
  const { data } = await tmdbClient.get<MovieListResponse>('/discover/movie', {
    params: {
      with_genres: genreId,
      sort_by: 'popularity.desc',
    },
  })
  return data
}

/**
 * Fetch full details for a single movie.
 * Used by the Title modal.
 */
export const getMovieDetail = async (movieId: number): Promise<MovieDetail> => {
  const { data } = await tmdbClient.get<MovieDetail>(`/movie/${movieId}`)
  return data
}

/**
 * Fetch trailers and clips for a movie.
 * Used by the Title modal to embed YouTube trailers.
 */
export const getMovieVideos = async (movieId: number): Promise<MovieVideosResponse> => {
  const { data } = await tmdbClient.get<MovieVideosResponse>(`/movie/${movieId}/videos`)
  return data
}

/**
 * Fetch movies similar to a given movie.
 * Used by the Title modal "More Like This" section.
 */
export const getSimilarMovies = async (movieId: number): Promise<MovieListResponse> => {
  const { data } = await tmdbClient.get<MovieListResponse>(`/movie/${movieId}/similar`)
  return data
}

/**
 * Convenience: extract the first official YouTube trailer from a videos response.
 * Returns undefined if none found.
 */
export const extractTrailerKey = (response: MovieVideosResponse): string | undefined => {
  const trailer = response.results.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
  )
  return trailer?.key ?? response.results.find((v) => v.site === 'YouTube')?.key
}

// TMDB genre IDs for the Home page rows
// Full list: https://api.themoviedb.org/3/genre/movie/list
export const MOVIE_GENRES: { id: number; label: string }[] = [
  { id: 28, label: 'Action' },
  { id: 35, label: 'Comedy' },
  { id: 27, label: 'Horror' },
  { id: 10749, label: 'Romance' },
  { id: 878, label: 'Science Fiction' },
  { id: 18, label: 'Drama' },
]

// Selects a random movie from the list for the Hero banner
export const getRandomMovie = (movies: Movie[]): Movie => {
  return movies[Math.floor(Math.random() * movies.length)]
}
