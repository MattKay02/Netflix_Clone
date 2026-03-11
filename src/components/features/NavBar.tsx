/*
  WHY THIS FILE EXISTS:
  The NavBar appears at the top of every authenticated page. It replicates
  Netflix's header: logo + nav links (left), search / bell / profile (right).

  SCROLL BEHAVIOUR:
  At the top of the page the background is a vertical gradient (dark → transparent)
  so the hero image shows through while the nav contents remain readable.
  After scrolling 80px the background becomes solid netflix-dark. The swap is
  animated via transition-colors / duration-300.

  STATE USED:
  - useScrolled (custom hook): scrolled — drives the background swap.
    Component-scoped; nothing outside NavBar cares about scroll position.
  - useState (local): isDropdownOpen — profile dropdown visibility.
    Ephemeral UI toggle; nothing else cares which state it's in.

  NON-FUNCTIONAL ITEMS:
  Movies, TV Shows, New & Popular, My List, Search, Bell, and most dropdown
  entries have no routes/actions yet — they are present for visual completeness.
  Each is marked with a TODO comment so they're easy to wire up later.
  They use <button type="button"> so they are keyboard-accessible and clearly
  interactive even without a destination.
*/

import { useRef, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useScrolled } from '../../hooks/useScrolled'

// Left-side navigation links.
// `to` is set only for functional routes; null items render as plain buttons.
const NAV_LINKS = [
  { label: 'Browse',          to: '/'   },
  { label: 'Movies',          to: null  }, // TODO: /browse/movies
  { label: 'TV Shows',        to: null  }, // TODO: /browse/tv
  { label: 'New & Popular',   to: null  }, // TODO: /new-and-popular
  { label: 'My List',         to: null  }, // TODO: /my-list
] as const

// Profile dropdown menu items (non-functional except Sign Out).
const DROPDOWN_ITEMS = [
  { label: 'Manage Profiles' }, // TODO: /profiles
  { label: 'Account' },         // TODO: /account
  { label: 'Help Center' },     // TODO: /help
] as const

export function NavBar() {
  const scrolled        = useScrolled(80)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef     = useRef<HTMLDivElement>(null)
  const navigate        = useNavigate()

  // Close dropdown when the user clicks anywhere outside it
  useEffect(() => {
    if (!isDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isDropdownOpen])

  function handleSignOut() {
    setIsDropdownOpen(false)
    navigate('/login')
  }

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between
        px-4 md:px-10 xl:px-16 h-16 transition-colors duration-300
        ${scrolled ? 'bg-netflix-dark' : 'bg-gradient-to-b from-black/80 to-transparent'}`}
    >
      {/* ── Left: logo + nav links ── */}
      <div className="flex items-center gap-6 lg:gap-8">
        {/* Logo */}
        <Link
          to="/"
          className="text-netflix-red font-black text-xl lg:text-2xl tracking-tighter shrink-0 select-none"
          aria-label="Netflix Clone home"
        >
          NETFLIX CLONE
        </Link>

        {/* Nav links — hidden on small screens to avoid overflow */}
        <ul className="hidden md:flex items-center gap-4 lg:gap-6" role="list">
          {NAV_LINKS.map(({ label, to }) =>
            to ? (
              <li key={label}>
                <Link
                  to={to}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ) : (
              <li key={label}>
                {/* TODO: wire up route when page is built */}
                <button
                  type="button"
                  className="text-sm text-white/80 hover:text-white transition-colors cursor-not-allowed"
                  title="Coming soon"
                >
                  {label}
                </button>
              </li>
            )
          )}
        </ul>
      </div>

      {/* ── Right: search, bell, profile ── */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Search — TODO: open search bar */}
        <button
          type="button"
          aria-label="Search"
          title="Search (coming soon)"
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
        </button>

        {/* Notification bell — TODO: notifications panel */}
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications (coming soon)"
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
        </button>

        {/* Profile avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Profile menu"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 group"
          >
            {/* Avatar — coloured rectangle matching Netflix's default profile icon */}
            <div
              className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-sm font-bold select-none"
              aria-hidden="true"
            >
              U
            </div>
            {/* Caret — flips when dropdown is open */}
            <svg
              className={`w-3 h-3 text-white/80 group-hover:text-white transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {/* Dropdown panel */}
          {isDropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-48 bg-black/90 border border-white/10 rounded shadow-xl py-2 text-sm"
            >
              {DROPDOWN_ITEMS.map(({ label }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  title="Coming soon"
                  className="w-full text-left px-4 py-2 text-netflix-lightgray hover:text-white transition-colors cursor-not-allowed"
                >
                  {label}
                </button>
              ))}

              {/* Divider */}
              <div className="border-t border-white/10 my-2" aria-hidden="true" />

              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-netflix-lightgray hover:text-white transition-colors"
              >
                Sign out of Netflix Clone
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
