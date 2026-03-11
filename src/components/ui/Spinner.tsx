/*
  WHY THIS FILE EXISTS:
  A reusable loading indicator used wherever TanStack Query's `isLoading`
  state is true. Centralising it means a consistent look across all loading
  states and a single place to update the animation if the design changes.
*/

interface SpinnerProps {
  /** Size of the spinner. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg'
  /** Accessible label for screen readers. Defaults to 'Loading…' */
  label?: string
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export function Spinner({ size = 'md', label = 'Loading…' }: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} rounded-full border-white/20 border-t-white animate-spin`}
      />
    </div>
  )
}
