# Fund Search

A search page for ASX-listed ETFs and shares, built with Vue 3, Vite, PrimeVue and Pinia. It runs against the local mock Search API in `../api`.

## Getting started

Requires Node 24 (22.22+ also works).

```sh
# terminal 1, from the repo root
npm run api:install
npm run api            # mock API on http://localhost:8787

# terminal 2, from web/
npm install
npm run dev            # app on http://localhost:3000
```

Vite proxies `/api/*` to `http://localhost:8787`, so the browser only talks to port 3000 and no CORS setup is needed.

## Scripts

| Command             | What it does                   |
| ------------------- | ------------------------------ |
| `npm run dev`       | Dev server with hot reload     |
| `npm run build`     | Production build               |
| `npm run test:unit` | Unit tests (Vitest)            |
| `npm run test:e2e`  | End-to-end tests (Playwright)  |
| `npm run storybook` | Component workshop (Storybook) |
| `npm run lint`      | Lint (ESLint)                  |
| `npm run format`    | Format `src/` (Prettier)       |

## Project Breakdown

### Goal

Replace a basic search box with a modern search experience: predictive suggestions, filters, sorting, pagination, and clear loading and empty states, backed by the mock Search API.

### Design process

1. **Brief to acceptance criteria.** I turned the brief into a checklist (suggestions, search bar, results, filters and ordering, loading states) and designed against it.
2. **Interactive mockup first.** Before writing app code I built a clickable mockup with the real component library. That let me test the flow, keyboard use and states (loading, no results, API error) cheaply.
3. **Fit the design to the real API.** Once I had the API spec I reworked the design around what the data actually offers. There are no fees or returns, so result rows show ticker, name, type, issuer and badges. The API has no popularity data, so "popular searches" come from a config list, recent searches and flagship funds.
4. **Pick the library on facts.** PrimeVue 4.5 is MIT licensed, while v5 needs a paid licence, so I pinned 4.5. I used the styled Aura theme rather than Volt (Tailwind) because it needs no extra setup.
5. **Light brand theming.** Brand orange (`#FC4D16`) is used sparingly for focus rings and highlights. Buttons use a deeper orange because white on the bright orange fails WCAG AA contrast. Matches use a bold underline rather than a coloured background.
6. **Standalone page.** The brief asks for a search page, not a rebuild of the Betashares site, so this is a standalone page that borrows the brand colour.

### Principles

1. **Modular, as if part of a larger project.** Each piece has one job: the API layer, the store, the composables and the UI components are separate, and components don't know about each other. A parent page could mount the search anywhere.
2. **Transportable to another project.** Everything that talks to the API sits in one place, so a different endpoint or data shape changes one file. The theme lives in one preset file. Components take props and emit events instead of reaching into global state, so they can be copied into another app.
3. **Simple to read.** Standard Vue single-file components, no JSX, no Router (it's a single page). Pinia holds the shared search state (query, filters, sort, page, results) and nothing else. Prefer small, named functions over clever code.

### Structure

_Update this to match the final folders._

```
src/
  composables/  # API composable, debounce, keyboard handling
  stores/       # Pinia search store
  pages/        # SearchPage
  components/   # generic building blocks and search components
  App.vue
```

### Build order

The app is built layer by layer, from the data upward, and each layer ships with its own tests before the next one starts.

1. **API composable.** Wraps the mock Search API (`/search`, `/facets`, `/instruments`). It's the only code that knows about endpoints and request shapes. _Tests:_ unit tests with mocked `fetch`.
2. **Pinia store.** Holds the shared search state (query, filters, sort, page, results, status) and calls the composable. _Tests:_ unit tests for actions and state changes.
3. **Search page.** Wires the store to the layout. It's the only place that knows about both the store and the components. _Tests:_ component tests with the store mocked.
4. **Generic components.** Reusable, library-agnostic building blocks extracted first (for example a search input with suggestions, a paginated list, a filter group, an empty state). They use props and events only, with no store access. _Tests:_ component tests for props, events and states.
5. **Component implementations.** The search-specific components (result item, filter panel, suggestion list) are built on the generic ones and fed by the page. _Tests:_ component tests for rendering and interactions.
6. **Theming.** The PrimeVue preset and brand colours are applied after the logic is done, so styling never leaks into it. _Checks:_ visual review and a contrast check.
7. **Storybook.** Stories for every component in its key states (empty, suggestions, loading, results, no results, error). _Checks:_ stories double as visual references.
8. **Playwright.** End-to-end flows against the mock API: search, pick a suggestion, filter, sort, paginate and no results. _Tests:_ the e2e suite.

### Comments during build

Notes I made while building each layer.

1. **API composable.** Used the base search call with a filter for suggestions. Thought about caching but left it for the moment as the data is in memory. May refactor once implementing, but fine for starters.
2. **Pinia store.** _No comments yet._
3. **Search page.** _No comments yet._
4. **Generic components.** _No comments yet._
5. **Component implementations.** _No comments yet._
6. **Theming.** _No comments yet._
7. **Storybook.** _No comments yet._
8. **Playwright.** _No comments yet._

### Search flow

Typing updates the store (debounced) and the store calls `/search` through the API composable. The suggestion list uses a light request (`?fields=symbol,display_name`). Choosing a filter, sort or page updates the store and the results refresh. `from` in the API is 1-based, and the page converts the paginator's 0-based position.

### Trade-offs and next steps

- No Vue Router, so searches aren't shareable by URL yet (`?q=...&kind=etf`).
- The Vite proxy only works in dev. A deployment needs the same `/api` route on the web server.
