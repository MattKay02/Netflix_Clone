/*
  WHY THIS FILE EXISTS:
  MovieRow needs to know how many cards fit per page so it can slice the
  title list correctly and drive the arrow pagination.

  HOW IT WORKS:
  Cards have fixed pixel widths that change at Tailwind breakpoints (see
  TitleCard.tsx). This hook reads those same widths and calculates how many
  complete cards fit in the container at the current viewport size.

  Two measurements are combined:
    1. container width  — from ResizeObserver (fires on every layout change)
    2. card width       — from window.innerWidth breakpoint lookup

  Both are re-evaluated whenever the ResizeObserver fires. Because the
  container is fluid (fills the viewport minus arrow widths), the ResizeObserver
  fires on every viewport resize, including breakpoint crossings. A separate
  window resize listener is added as a safety net for edge cases where the
  container width doesn't change but the breakpoint does.

  CARD_WIDTHS must match the Tailwind classes in TitleCard.tsx:
    w-36 = 144px  (< 640px)
    w-44 = 176px  (640–1023px)
    w-48 = 192px  (≥ 1024px)

  STATE USED:
  - useState (local): count — only MovieRow cares, nothing global needed.
*/

import { useState, useEffect, type RefObject } from 'react'

// These must stay in sync with TitleCard.tsx's responsive width classes
const CARD_WIDTHS = {
  mobile:  144, // w-36, viewport < 640px
  tablet:  176, // w-44, viewport 640–1023px
  desktop: 192, // w-48, viewport ≥ 1024px
} as const

// Single source of truth for card gap. Exported so MovieRow can apply the
// same value via inline style — no chance of the two ever diverging.
export const GAP_PX = 4

function getCardWidth(): number {
  if (typeof window === 'undefined') return CARD_WIDTHS.desktop
  if (window.innerWidth < 640)  return CARD_WIDTHS.mobile
  if (window.innerWidth < 1024) return CARD_WIDTHS.tablet
  return CARD_WIDTHS.desktop
}

function calcCount(containerWidth: number): number {
  const cardWidth = getCardWidth()
  // How many complete cards fit, including the gap after each card except the last?
  // Formula: floor((containerWidth + gap) / (cardWidth + gap))
  return Math.max(1, Math.floor((containerWidth + GAP_PX) / (cardWidth + GAP_PX)))
}

export function useCardsPerPage(containerRef: RefObject<HTMLDivElement | null>): number {
  const [count, setCount] = useState(6) // safe default before first measurement

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Measure immediately on mount
    setCount(calcCount(el.getBoundingClientRect().width))

    // Re-measure whenever the container resizes (covers viewport resize too)
    const observer = new ResizeObserver(([entry]) => {
      setCount(calcCount(entry.contentRect.width))
    })
    observer.observe(el)

    // Safety net: re-evaluate if viewport crosses a breakpoint without changing
    // container width (rare but possible in fixed-layout contexts)
    const onWindowResize = () => {
      setCount(calcCount(el.getBoundingClientRect().width))
    }
    window.addEventListener('resize', onWindowResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onWindowResize)
    }
  }, [containerRef])

  return count
}
