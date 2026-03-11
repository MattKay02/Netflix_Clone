/*
  WHY THIS FILE EXISTS:
  TV show API calls are kept separate from movie API calls because the TMDB
  endpoints, response shapes, and field names differ (e.g. `name` vs `title`).
  Mixing them in one file would force you to constantly check which type you're
  working with. Separation keeps the intent clear.
*/

import { tmdbClient } from './tmdb.client'
import type { TVListResponse, TVDetail, GenreListResponse } from '../types/tv'
import type { CreditsResponse } from '../types/credits'

/**
 * Fetch the current trending TV shows (week window).
 */
export const getTrendingTV = async (): Promise<TVListResponse> => {
  const { data } = await tmdbClient.get<TVListResponse>('/trending/tv/week')
  return data
}

/**
 * Fetch TV shows for a specific genre.
 */
export const getTVByGenre = async (genreId: number): Promise<TVListResponse> => {
  const { data } = await tmdbClient.get<TVListResponse>('/discover/tv', {
    params: {
      with_genres: genreId,
      sort_by: 'popularity.desc',
    },
  })
  return data
}

/**
 * Fetch full details for a single TV show.
 */
export const getTVDetail = async (tvId: number): Promise<TVDetail> => {
  const { data } = await tmdbClient.get<TVDetail>(`/tv/${tvId}`)
  return data
}

/**
 * Fetch the full genre list for TV shows from TMDB.
 * Useful for displaying genre names alongside genre IDs.
 */
export const getTVGenres = async (): Promise<GenreListResponse> => {
  const { data } = await tmdbClient.get<GenreListResponse>('/genre/tv/list')
  return data
}

/**
 * Fetch cast and crew for a single TV show.
 * Used by the TitleCard hover popup expanded detail section.
 */
export const getTVCredits = async (tvId: number): Promise<CreditsResponse> => {
  const { data } = await tmdbClient.get<CreditsResponse>(`/tv/${tvId}/credits`)
  return data
}

/**
 * Fetch TV shows similar to a given show.
 * Used by the DetailModal "More Like This" section.
 */
export const getSimilarTV = async (tvId: number): Promise<TVListResponse> => {
  const { data } = await tmdbClient.get<TVListResponse>(`/tv/${tvId}/similar`)
  return data
}

// TMDB genre IDs used in the Home page TV rows
export const TV_GENRES: { id: number; label: string }[] = [
  { id: 10759, label: 'Action & Adventure' },
  { id: 35, label: 'Comedy' },
  { id: 18, label: 'Drama' },
  { id: 10765, label: 'Sci-Fi & Fantasy' },
  { id: 9648, label: 'Mystery' },
]
