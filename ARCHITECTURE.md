# Architecture — Netflix Clone

<!--
  WHY THIS FILE EXISTS:
  This project's primary learning goal is explicit context management: knowing
  *why* each piece of state lives where it does, not just that it works.
  This document is the single source of truth for all state-layer decisions.
  Read this before touching any store, context, or hook in the codebase.
-->

---

## The Four State Layers

Every piece of state in this app belongs to exactly one layer. Choosing the
wrong layer creates bugs (stale data, missing persistence, unnecessary
re-renders). Use this table as the decision matrix:

| Layer | Tool | When to use | Persists? | Shareable? |
|---|---|---|---|---|
| **Local** | `useState` / `useReducer` | One component owns it, nothing else cares | No | No |
| **Context** | React Context + `useContext` | UI state shared across a subtree, ephemeral | No | Within provider |
| **Client store** | Zustand | UI state that must survive page refresh | Yes (localStorage) | Global |
| **Server state** | TanStack Query | Data that comes from an API | Cached | Global |

---

## Why These Rules Exist

### `useState` — Local state
Use when: hover state, input value, accordion open/closed, local toggle.

The rule is containment. If only one component ever reads or writes the state,
it belongs in that component. Lifting it higher creates unnecessary coupling.

```tsx
// RIGHT: hover is only relevant inside TitleCard
const [isHovered, setIsHovered] = useState(false)

// WRONG: putting hover state in a Context or Zustand store
```

---

### React Context — Scoped shared UI state

Use when: multiple components need the same ephemeral UI state and they share
a common ancestor that is not the app root.

**In this project, Context is used for:**
- `ModalContext` — which title modal is currently open (`Movie | TVShow | null`)

**Why Context and not Zustand for the modal?**
Modal state is pure UI. It resets on every page load (you don't want the
modal open on refresh). Using Zustand's `persist` middleware would be wrong
here — it would try to serialize a complex object to localStorage for no
reason. Context is the right tool: it's scoped to the component tree, it's
reactive, and it's ephemeral by default.

**Why Context and not prop drilling?**
`HeroBanner` opens the modal. `TitleCard` (nested deep in `MovieRow`) also
opens the modal. Their closest common ancestor is `HomePage`, but you'd need
to thread `onOpenModal` through `MovieRow → TitleCard`. Context eliminates
that coupling.

```
HomePage
├── HeroBanner          ← calls openModal(title)
└── MovieRow
    └── TitleCard       ← calls openModal(title)
        (without Context, both need the same prop drilled down from HomePage)
```

**Context files:** [src/contexts/ModalContext.tsx](src/contexts/ModalContext.tsx)

---

### Zustand — Persistent client UI state

Use when: state must survive a page refresh and is truly global (not scoped
to a subtree).

**In this project, Zustand is used for:**
- `watchlistStore` — the user's saved titles ("My List"), persisted to
  localStorage via `zustand/middleware`'s `persist`

**Why Zustand and not Context for the watchlist?**
The watchlist must survive page refresh. A user adds a title, navigates away,
comes back — the title should still be there. `persist` middleware handles
this automatically. Context has no persistence mechanism.

**Why Zustand and not TanStack Query for the watchlist?**
The watchlist is pure client state — there's no backend storing it. TanStack
Query is for *server* state. Putting client-only data in a Query would mean
faking an API, which is the wrong abstraction.

**Store files:** [src/store/watchlistStore.ts](src/store/watchlistStore.ts)

---

### TanStack Query — Server / API state

Use when: data comes from an external API (TMDB in this case).

**Never use `useEffect` to fetch data.** TanStack Query replaces that pattern
entirely and gives you:
- Automatic caching (same query = no duplicate requests)
- Loading and error states without manual `isLoading` booleans
- Background refetching when the window regains focus
- Query deduplication across components

**Query key convention in this project:**
```ts
['trending', 'movies']
['movies', 'genre', genreId]
['movies', 'detail', movieId]
['tv', 'trending']
```

The key is an array. The first element is the resource type, subsequent
elements narrow the query. This makes cache invalidation predictable.

**API files:** [src/api/movies.ts](src/api/movies.ts), [src/api/tv.ts](src/api/tv.ts)

---

## Provider Tree

```tsx
// src/main.tsx
<BrowserRouter>           // React Router — enables useNavigate everywhere
  <QueryProvider>         // TanStack Query — server state cache
    <ModalProvider>       // React Context — ephemeral UI state
      <App />
    </ModalProvider>
  </QueryProvider>
</BrowserRouter>
```

**Why this order?**
- `BrowserRouter` is outermost so any provider or component can call
  `useNavigate` or `useLocation` if needed.
- `QueryProvider` wraps everything below it so any component can use
  `useQuery` without additional setup.
- `ModalProvider` is the innermost — it's UI-specific and only needs the
  router and query client to already exist.

---

## What Does NOT Belong in Each Layer

| Don't put this... | ...in here | Because |
|---|---|---|
| TMDB movie data | Zustand | Zustand is for client state; server data belongs in TanStack Query |
| Watchlist | TanStack Query | There's no server; it's client-only state |
| Modal open/close | Zustand | It's ephemeral; persisting it to localStorage is wrong |
| Hover state | Context | Only one component cares; Context would cause unnecessary re-renders |

---

## File Map

```
src/
├── api/              TMDB API functions — one file per resource
│   ├── tmdb.client.ts    Axios instance (base URL + API key)
│   ├── movies.ts         getTrending, getMoviesByGenre
│   └── tv.ts             getTrendingTV
├── components/
│   ├── ui/           Generic reusable components (no business logic)
│   └── features/     Feature-specific components (use hooks + context)
├── contexts/         React Context providers
│   └── ModalContext.tsx
├── hooks/            Custom hooks (co-locate with component if single-use)
├── pages/            Route-level components
├── providers/        Non-Context providers (QueryProvider)
├── store/            Zustand stores
│   └── watchlistStore.ts
├── types/            TypeScript interfaces for API responses
└── utils/            Pure functions with no side effects
    └── tmdbImage.ts  Canonical image URL builder
```
