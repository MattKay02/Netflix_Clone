/*
  WHY THIS FILE EXISTS:
  NavBar needs to know whether the user has scrolled past a threshold so it
  can switch from its transparent-gradient state to a solid dark background.
  Extracting this into a hook keeps the component clean and makes the scroll
  logic reusable if other components ever need it.

  STATE USED:
  - useState (local to each caller): scrolled — boolean flag.
    Nothing outside the calling component cares about scroll position.
*/

import { useState, useEffect } from 'react'

export function useScrolled(threshold = 80): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    // Passive: we never call preventDefault, so browser can optimise scroll perf
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
