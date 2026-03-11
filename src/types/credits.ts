/*
  WHY THIS FILE EXISTS:
  The /movie/{id}/credits and /tv/{id}/credits endpoints return the same
  response shape, so the types are shared here rather than duplicated in
  movie.ts and tv.ts.
*/

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number              // lower = more prominent billing
}

export interface CrewMember {
  id: number
  name: string
  job: string                // e.g. "Director", "Producer"
  department: string
  profile_path: string | null
}

export interface CreditsResponse {
  id: number
  cast: CastMember[]
  crew: CrewMember[]
}
