/*
  WHY THIS FILE EXISTS:
  TanStack Query's `isError` state must always be handled — silent failures
  are banned per CLAUDE.md. This component gives every error a consistent,
  user-friendly look. The special-case message for missing API keys ensures
  developers get a clear signal when .env.local hasn't been set up yet.
*/

interface ErrorMessageProps {
  /** The error object from TanStack Query, or a plain string */
  error?: Error | string | null
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  const isMissingKey =
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: number }).status === 401
      : false

  const message = isMissingKey
    ? 'Add your TMDB API key to .env.local to load content.'
    : typeof error === 'string'
    ? error
    : error?.message ?? 'Something went wrong. Please try again.'

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="text-4xl">⚠️</span>
      <p className="text-netflix-lightgray max-w-sm text-sm leading-relaxed">{message}</p>
      {isMissingKey && (
        <code className="text-xs text-netflix-gray mt-1 font-mono bg-white/5 px-3 py-1 rounded">
          cp .env.local.example .env.local
        </code>
      )}
    </div>
  )
}
