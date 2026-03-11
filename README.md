# Netflix Clone

A frontend-only Netflix clone built with React and TypeScript. This project exists to practice two specific skills: **context engineering** — knowing exactly which state layer to use and why — and **full API integration** with the TMDB REST API.

It is not a tutorial follow-along. Every architectural decision is documented inline, and the codebase is intentionally designed to be read as a learning resource alongside being a working app.

---

## Purpose

Most frontend projects end up with state scattered everywhere — server data in Zustand, UI toggles in Context, API calls in `useEffect`. This project enforces a strict, deliberate architecture where every piece of state has a reason to exist where it does.

The two core learning goals:

**1. Context engineering**
Understanding the four state layers and choosing between them correctly:

| Layer | Tool | When to use |
|---|---|---|
| Local | `useState` | One component owns it |
| Scoped shared UI | React Context | Shared across a subtree, not persisted |
| Persistent client | Zustand | Survives page refresh, no backend |
| Server / API | TanStack Query | Comes from an external API |

The rule is not "use Zustand for everything global" or "use Context for everything shared." Each layer has a specific job. Breaking the rules creates bugs (stale data, missing persistence, unnecessary re-renders) that are hard to trace back to the root cause.

**2. Full API integration**
The TMDB API is used as a real, production-grade REST API — typed response interfaces, a centralised Axios client, query key conventions, and explicit loading/error handling on every request. No silent failures, no hardcoded data, no faking it.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 19 | Functional components and hooks only |
| Language | TypeScript 5 | Strict mode, `interface` over `type`, no `any` |
| Build tool | Vite 7 | Fast HMR, ES module output |
| Styling | Tailwind CSS v3 | Utility-only, Netflix dark theme |
| Routing | React Router v7 | Client-side routing, no SSR |
| Server state | TanStack Query v5 | Replaces `useEffect` for all data fetching |
| Client state | Zustand v5 | Watchlist persisted to localStorage |
| HTTP client | Axios | Centralised instance in `src/api/tmdb.client.ts` |
| Data source | TMDB REST API | Free API for movie and TV catalogue data |

---

## Project Structure

```
src/
├── api/              TMDB API functions — one file per resource
│   ├── tmdb.client.ts    Single Axios instance (base URL + API key)
│   ├── movies.ts         getTrending, getMoviesByGenre, getMovieDetail
│   └── tv.ts             getTrendingTV, getTVByGenre, getTVDetail
│
├── components/
│   ├── ui/           Generic, reusable — no business logic
│   │   ├── Spinner.tsx
│   │   └── ErrorMessage.tsx
│   └── features/     Feature-specific — consume hooks and context
│       ├── HeroBanner.tsx
│       ├── MovieRow.tsx
│       └── TitleCard.tsx
│
├── contexts/         React Context providers (ephemeral shared UI state)
│   └── ModalContext.tsx
│
├── hooks/            Custom hooks (co-located with component if single-use)
│
├── pages/            Route-level components — compose, don't fetch
│   ├── LoginPage.tsx
│   └── HomePage.tsx
│
├── providers/        Non-Context providers
│   └── QueryProvider.tsx
│
├── store/            Zustand stores — persistent client state only
│   └── watchlistStore.ts
│
├── types/            TypeScript interfaces for every API response shape
│   ├── movie.ts
│   └── tv.ts
│
└── utils/            Pure functions, no side effects
    └── tmdbImage.ts  Canonical TMDB image URL builder
```

---

## Key Architecture Files

These two files are the most important for understanding the project's intent. Read them before touching any state, store, or context.

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — The state layer decision matrix. Explains why each piece of state lives where it does, what the provider tree order means, and what not to put in each layer.

- **[CLAUDE.md](CLAUDE.md)** — The project brain for AI-assisted development. Documents conventions, stack decisions, and coding rules so that every session starts with the same shared context.

---

## Getting Started

**1. Clone and install**
```bash
git clone <repo-url>
cd Netflix_Clone
npm install
```

**2. Set up your TMDB API key**

Get a free API key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api), then:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and replace the placeholder:

```
VITE_TMDB_API_KEY=your_actual_key_here
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

**3. Run the dev server**
```bash
npm run dev
```

The app runs at `http://localhost:5173`. Without a TMDB key the app still loads — it shows a clear error message instead of crashing.

---

## Features Built

- [x] Login page (frontend MVP — any input accepted)
- [x] Home page — Hero banner with random trending movie
- [x] Genre movie rows — horizontal scroll, independent per-row queries
- [x] TitleCard — poster card with hover overlay
- [ ] Title detail modal
- [ ] Browse / filter page
- [ ] Search
- [ ] My List (watchlist)
- [ ] Profile switcher

---

## TMDB API

All API calls go through the centralised client at `src/api/tmdb.client.ts`. The API key is injected automatically on every request via Axios `params` — it is never hardcoded in source files.

**Endpoints used:**

| Endpoint | Function | Used by |
|---|---|---|
| `GET /trending/movie/week` | `getTrendingMovies()` | HeroBanner, Trending row |
| `GET /trending/tv/week` | `getTrendingTV()` | Trending TV row |
| `GET /discover/movie` | `getMoviesByGenre(genreId)` | Genre movie rows |
| `GET /discover/tv` | `getTVByGenre(genreId)` | Genre TV rows |
| `GET /movie/{id}` | `getMovieDetail(id)` | Title modal (upcoming) |
| `GET /movie/{id}/videos` | `getMovieVideos(id)` | Trailer embed (upcoming) |
| `GET /movie/{id}/similar` | `getSimilarMovies(id)` | More Like This (upcoming) |
| `GET /tv/{id}` | `getTVDetail(id)` | Title modal (upcoming) |

**Image URLs** are built exclusively via `tmdbImage(path, size)` in `src/utils/tmdbImage.ts`. Never construct TMDB image URLs manually.

**Query key convention:**
```ts
['trending', 'movies']
['trending', 'tv']
['movies', 'genre', '28']
['movies', 'detail', '550']
```

---

## Conventions

- Named exports only — no default exports
- `interface` over `type` for object shapes
- No `any` — use `unknown` and narrow
- No `useEffect` for data fetching — TanStack Query only
- No server data in Zustand — Zustand is for client-only state
- Loading and error states handled explicitly on every query — no silent failures
- All env vars prefixed `VITE_` — accessed via `import.meta.env`, never `process.env`
