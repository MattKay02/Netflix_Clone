# CLAUDE.md — Netflix Clone (Frontend Only)

<!--
  WHY THIS FILE EXISTS:
  CLAUDE.md is read automatically by Claude Code at the start of every session.
  It is the persistent project brain — it eliminates the need to re-explain
  context, constraints, and conventions every time a new session opens.

  WHAT MAKES A GOOD CLAUDE.md:
  - Short enough to be read in full (aim for <300 lines)
  - Dense with decisions, not descriptions
  - Answers the questions Claude would otherwise ask
  - Explicitly kills off bad default behaviours for your stack
-->

---

## Project Overview

A frontend-only Netflix clone built with React + TypeScript + Vite.
Uses the TMDB API for real movie/TV data.
No backend. No auth server. No database.

**Primary learning goal:** Explicit context management.
See [ARCHITECTURE.md](ARCHITECTURE.md) for the full state-layer decision matrix.

<!--
  WHY: The "frontend only" constraint is critical. Without it, Claude may
  suggest Express routes, NextAuth, or Prisma schemas. Stating it once here
  prevents that across every session.
-->

---

## Stack

| Layer       | Choice              | Notes                              |
|-------------|---------------------|------------------------------------|
| Framework   | React 18            | Functional components, hooks only  |
| Language    | TypeScript 5        | Strict mode on                     |
| Build tool  | Vite 5              | Not CRA, not Next.js               |
| Styling     | Tailwind CSS v3     | No CSS Modules, no styled-components |
| State       | Zustand             | No Redux, no Context for global state |
| Data fetch  | TanStack Query v5   | No useEffect for fetching          |
| Routing     | React Router v6     | File-based layout pattern          |
| API         | TMDB REST API       | Key stored in .env.local only      |

<!--
  WHY: Claude defaults to common patterns. Without explicit stack choices,
  you'll get useState for global state, useEffect for fetching, and
  styled-components. Listing negatives ("No Redux") is as important as
  listing positives — it kills off the alternatives Claude might default to.
-->

---

## Environment Variables

```
VITE_TMDB_API_KEY=your_key_here
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

**Rules:**
- All env vars are prefixed `VITE_` (Vite requirement)
- Never hardcode API keys in source files
- Never commit `.env.local`
- Template is in `.env.local.example`

<!--
  WHY: Claude sometimes hardcodes API keys in examples or uses process.env
  instead of import.meta.env. This section prevents both mistakes.
-->

---

## Project Structure

```
src/
├── api/              # TMDB API functions (one file per resource)
│   ├── movies.ts
│   ├── tv.ts
│   └── tmdb.client.ts   # Axios instance with base config
├── components/
│   ├── ui/           # Generic, reusable (Button, Modal, Spinner)
│   └── features/     # Feature-specific (HeroBanner, MovieRow, VideoPlayer)
├── contexts/         # React Context providers (ephemeral shared UI state)
├── hooks/            # Custom hooks only — no business logic in components
├── pages/            # Route-level components (Home, Browse, Title)
├── providers/        # Non-Context providers (QueryProvider)
├── store/            # Zustand stores (one file per domain)
├── types/            # Shared TypeScript interfaces
└── utils/            # Pure utility functions
```

<!--
  WHY: Without this, Claude will put API calls directly in components,
  mix types inline, and create flat unorganised file structures.
  The structure you define here is the structure Claude will follow.
-->

---

## State Layer Rules (summary — full rules in ARCHITECTURE.md)

| State | Lives in | Why |
|---|---|---|
| Hover, local toggle | `useState` | Component-scoped, ephemeral |
| Modal open/close | React Context | Shared across subtree, not persisted |
| My List (watchlist) | Zustand + persist | Must survive page refresh |
| TMDB API data | TanStack Query | Server state, needs caching |

**Hard rules:**
- Never store server data in Zustand
- Never use Context for state that should persist across page loads
- Never use Zustand for ephemeral modal/UI state
- Never use `useEffect` for data fetching

---

## Coding Conventions

### TypeScript
- Prefer `interface` over `type` for object shapes
- Never use `any` — use `unknown` and narrow it
- All API responses must have a corresponding type in `src/types/`
- Props interfaces are named `[ComponentName]Props`

### Components
- Functional components only, no class components
- One component per file
- Named exports only — no default exports (makes refactoring easier)
- Co-locate component-specific hooks next to the component file

### Data Fetching
- Use TanStack Query for ALL server state
- `useEffect` is banned for data fetching
- Query keys follow the pattern: `['resource', id, params]`
- Loading and error states must always be handled explicitly — no silent failures

### Styling
- Tailwind utility classes only
- No inline `style` props unless for dynamic values (e.g. background-image URLs)
- Responsive breakpoints: `sm:`, `md:`, `lg:` — mobile-first always
- Netflix dark theme: `bg-netflix-dark` base, `text-white`, `accent: netflix-red`

<!--
  WHY: This is the most important section. These conventions directly shape
  Claude's output line by line. The more specific you are here, the less
  cleanup you do after generation. "Named exports only" alone will save you
  dozens of micro-corrections across a project.
-->

---

## TMDB API Patterns

```typescript
// Always use this client — never import axios directly in components
// src/api/tmdb.client.ts
import axios from 'axios'

export const tmdbClient = axios.create({
  baseURL: import.meta.env.VITE_TMDB_BASE_URL,
  params: {
    api_key: import.meta.env.VITE_TMDB_API_KEY,
  },
})
```

```typescript
// Image URL helper — always use this, never construct manually
// src/utils/tmdbImage.ts
export const tmdbImage = (path: string, size: 'w500' | 'w780' | 'original') =>
  `${import.meta.env.VITE_TMDB_IMAGE_BASE}/${size}${path}`
```

<!--
  WHY: Without this, Claude will construct image URLs inline in JSX with
  string concatenation in multiple different formats across different files.
  Giving Claude the canonical pattern means it uses it consistently.
-->

---

## Key Features to Build

Listed in priority order. Build in this sequence.

1. **Home page** — Hero banner (random trending), horizontal movie rows by genre ✅
2. **Browse page** — Filterable grid by genre/type (movie vs TV)
3. **Title modal** — Click any card → overlay with details, trailer, similar titles
4. **Search** — Debounced TMDB search, results page
5. **My List** — Zustand-persisted watchlist (localStorage via zustand/middleware)
6. **Profile switcher** — Static UI only, no real auth

<!--
  WHY: Ordering matters. Without it, Claude may jump to auth or a profile
  page before core browsing works. This section acts as a backlog that
  Claude can reference when you ask "what should we build next?"
-->

---

## What This Project Is NOT

- Not a full-stack app — no Express, no Next.js API routes, no tRPC
- Not a real auth system — no JWT, no sessions, no OAuth
- Not a video streaming app — embed YouTube trailers via TMDB trailer data only
- Not a payments feature — no Stripe, no subscription logic

---

## Common Mistakes to Avoid

- Don't use `useEffect` to fetch data — use TanStack Query
- Don't store server data in Zustand — Zustand is for client/UI state only
- Don't use `px` units in Tailwind — use Tailwind's spacing scale
- Don't import from barrel files if it causes circular deps — import directly
- Don't add `console.log` in committed code — use a logger utility if needed
- Don't use default exports — named exports only

---

## Session Startup Checklist

When starting a new Claude Code session, confirm:
- [ ] Which feature are we building today?
- [ ] Are there any existing files Claude should read before writing new ones?
- [ ] Is there a type in `src/types/` that needs creating first?
- [ ] Does ARCHITECTURE.md need updating for new state decisions?
