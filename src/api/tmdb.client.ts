/*
  WHY THIS FILE EXISTS:
  A single Axios instance configured with the TMDB base URL and API key means:
  1. The API key is injected automatically on every request — no repetition.
  2. The base URL is set once — change it here to affect every API call.
  3. Components never import axios directly — they import from this file,
     so the abstraction boundary is clean and testable.

  NEVER import axios directly in API files or components. Always use this client.
*/

import axios from 'axios'

export const tmdbClient = axios.create({
  baseURL: import.meta.env.VITE_TMDB_BASE_URL,
  params: {
    // Automatically appended as ?api_key=... on every request
    api_key: import.meta.env.VITE_TMDB_API_KEY,
  },
})
