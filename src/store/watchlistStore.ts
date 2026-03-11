/*
  WHY THIS FILE EXISTS — AND WHY IT'S ZUSTAND (NOT CONTEXT):

  The watchlist ("My List") must survive page refreshes. A user adds a title,
  closes the browser, comes back — the list should still be there.

  React Context has no built-in persistence mechanism. You'd have to manually
  sync to localStorage with useEffect, handle hydration, and manage edge cases.
  Zustand's `persist` middleware does all of that automatically.

  Two questions that determined this choice:
  1. Does it need to persist across page refreshes? YES → rules out Context.
  2. Is it client-only state (no backend)? YES → rules out TanStack Query.

  Zustand is the correct answer: persistent, global, client-only state.

  USAGE:
    const { list, addToList, removeFromList, isInList } = useWatchlistStore()
*/

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Movie } from '../types/movie'

interface WatchlistState {
  /** The persisted list of saved movies */
  list: Movie[]
  /** Add a movie to the list (no-op if already present) */
  addToList: (movie: Movie) => void
  /** Remove a movie from the list by ID */
  removeFromList: (movieId: number) => void
  /** Returns true if the movie is already in the list */
  isInList: (movieId: number) => boolean
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      list: [],

      addToList: (movie) => {
        // Guard: don't add duplicates
        if (get().isInList(movie.id)) return
        set((state) => ({ list: [...state.list, movie] }))
      },

      removeFromList: (movieId) => {
        set((state) => ({
          list: state.list.filter((m) => m.id !== movieId),
        }))
      },

      isInList: (movieId) => {
        return get().list.some((m) => m.id === movieId)
      },
    }),
    {
      name: 'netflix-clone-watchlist', // localStorage key
      // By default, persist serializes the entire state to JSON.
      // We only store `list` — the action functions are recreated on mount.
      partialize: (state) => ({ list: state.list }),
    }
  )
)
