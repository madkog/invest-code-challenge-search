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

To run the end-to-end tests, install the browser once with `npx playwright install chromium`, then run `npm run test:e2e`. They start the API and the app themselves, or reuse them if they are already running.

## Scripts

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Dev server with hot reload                    |
| `npm run build`      | Type-check and production build               |
| `npm run test:unit`  | Unit and component tests (Vitest)             |
| `npm run test:e2e`   | End-to-end tests against the API (Playwright) |
| `npm run storybook`  | Component workshop on http://localhost:6006   |
| `npm run type-check` | Type-check only                               |
| `npm run lint`       | Lint (oxlint and ESLint)                      |
| `npm run format`     | Format `src/` (Prettier)                      |

## What it does

- **Predictive suggestions.** With the box empty: recent searches, popular searches and flagship funds. While typing: search for the text in everything or only ETFs or shares (with counts), the matching ETFs and shares, and popular terms that contain the text.
- **Search.** Matches ticker, name and issuer. Results change when a search is submitted or a suggestion is picked, not on every key. `OR` between words finds either.
- **Results.** Logo, ticker, name, type, issuer, badges (flagship, Auto Invest) and shares on issue, with matches underlined. Clicking a result opens a details drawer.
- **Filters and sorting.** Type, issuer and fund features (Betashares, flagship, Auto Invest), each with live counts, removable filter chips, and five sort orders.
- **Pagination**, with a page size choice and a simpler "Page 2 of 31" layout on phones.
- **States.** A loading skeleton (only if loading takes over 120ms, so fast searches don't flicker), a friendly no-results message with tips, and a friendly error with retry.
- **Accessibility.** Labelled controls, keyboard-operable suggestions, visible focus rings, and WCAG AA contrast checked by tests in both themes.
- **Theme and mobile.** A warm light theme by default with a dark theme toggle. On phones: a scrolling row of popular searches, an icon search button, and the back button closes the details drawer.

## Project Breakdown

### Goal

Replace a basic search box with a modern search experience: predictive suggestions, filters, sorting, pagination, and clear loading and empty states, backed by the mock Search API.

### Design process

1. **Brief to acceptance criteria.** I turned the brief into a checklist (suggestions, search bar, results, filters and ordering, loading states) and designed against it.
2. **Interactive mockup first.** Before writing app code I built a clickable mockup with the real component library. That let me test the flow, keyboard use and states (loading, no results, API error) cheaply. It is in `../docs/search-design/`.
3. **Fit the design to the real API.** Once I had the API spec I reworked the design around what the data actually offers. There are no fees or returns, so result rows show ticker, name, type, issuer and badges. The API has no popularity data, so "popular searches" come from a config list, recent searches and flagship funds.
4. **Pick the library on facts.** PrimeVue 4.5 is MIT licensed, while v5 needs a paid licence, so I pinned 4.5. I used the styled Aura theme rather than Volt (Tailwind) because it needs no extra setup.
5. **Light brand theming.** Brand orange (`#FC4D16`) is used sparingly for focus rings and highlights, on the warm grey background and stone greys of the Betashares site. Buttons use a deeper orange because white on the bright orange fails WCAG AA contrast.
6. **Standalone page.** The brief asks for a search page, not a rebuild of the Betashares site, so this is a standalone page that borrows the brand look.

### Principles

1. **Modular, as if part of a larger project.** Each piece has one job: the API layer, the store, the composables and the UI components are separate, and components don't know about each other. A parent page could mount the search anywhere.
2. **Transportable to another project.** Everything that talks to the API sits in one place, so a different endpoint or data shape changes one file. The theme lives in one preset file and a few CSS variables. Components take props and emit events instead of reaching into global state, so they can be copied into another app.
3. **Simple to read.** Standard Vue single-file components, no JSX, no Router (it's a single page). Pinia holds the shared search state and nothing else. Prefer small, named functions over clever code.

### Structure

```
src/
  composables/  # search API (the only code that knows the API), delayed loading flag,
                # colour scheme, close-on-back
  utils/        # HTTP client, request tracker, error logging, text and contrast helpers
  stores/       # Pinia search store
  components/   # generic building blocks: search input, results list, skeleton, empty and
                # error states, pagination, filters, sort, theme toggle
  pages/search/ # SearchPage and everything only it uses
    components/   # search box, result row, details drawer, filter panel, toolbar, popular searches
    composables/  # recent searches
    utils/        # formatting and sort options
    config.ts     # popular searches, issuer names, fund features, loading delay
  theme/        # PrimeVue preset, global styles and contrast tests
  stories/      # sample data for Storybook
  types/        # shared types
e2e/            # Playwright end-to-end tests
.storybook/     # Storybook setup (PrimeVue theme, fonts, light and dark switch)
```

### Search flow

1. **Typing** asks for suggestions 150ms after the last key. The store sends two requests together: a light `/search` with only the fields a suggestion needs, and `/facets/kind` for the ETF and share counts.
2. **Submitting or picking a suggestion** sets the query. The store sends `/search`, and the page reloads the filter counts (`/facets/kind`, `/facets/issuer` and the yes/no filters) for the new text.
3. **Changing a filter, sort or page** updates the store, which searches again. A newer request cancels an older one of the same kind, so a slow response never overwrites a newer one.
4. **Picking a result** loads it from `/instruments/:id` into the details drawer.

Failures: the main search shows a friendly error with retry. Optional parts (suggestions, filter counts) quietly hide. Every failure is logged to the console with what failed, and requests time out after 10 seconds.

### Build order

The app is built layer by layer, from the data upward, and each layer ships with its own tests before the next one starts.

1. **API composable.** Wraps the mock Search API (`/search`, `/facets`, `/instruments`). It's the only code that knows about endpoints and request shapes. _Tests:_ unit tests with mocked `fetch`.
2. **Pinia store.** Holds the shared search state (query, filters, sort, page, results, status) and calls the composable. _Tests:_ unit tests for actions and state changes.
3. **Search page.** Wires the store to the layout. It's the only place that knows about both the store and the components. _Tests:_ component tests with the store's actions spied on.
4. **Generic components.** Reusable building blocks (search input with suggestions, results list, skeleton, empty and error states, pagination, filters). They use props and events only, with no store access. _Tests:_ component tests for props, events and states.
5. **Component implementations.** The search-specific components (search box, result row, filter panel, details drawer) are built on the generic ones and fed by the page. _Tests:_ component tests for rendering and interactions.
6. **Theming.** The PrimeVue preset and brand colours are applied after the logic is done, so styling never leaks into it. _Checks:_ visual review and contrast tests.
7. **Storybook.** Stories for every component in its key states (empty, suggestions open, loading, no results, error, on a phone), with a light and dark switch and accessibility checks. _Checks:_ stories double as visual references.
8. **Playwright.** End-to-end flows against the mock API: search, suggestions, filter, sort, paginate, no results, API errors and the mobile back button. _Tests:_ the e2e suite.

### Comments during build

Notes I made while building each layer.

1. **API composable.** Used the base search call with a filter for suggestions. Thought about caching but left it for the moment as the data is in memory. The composable takes the app's own params (`text`, `filters`, `sort`, `page`, `size`) and builds the API request body itself, so the store never sees `search_text` or `{ value }` booleans. It also maps responses to the app's own types (`Instrument`, `Sort`, camelCase names), so no API field name such as `display_name` or `is_betashares` exists outside it. That includes the yes/no filters, where the API sends counts for the text "true" and "false" and the composable returns just the count with the filter on.
2. **Pinia store.** Started with watchers and `onWatcherCleanup` (Vue's built-in cancellation), then chose explicit actions. They are easier to trace and test, because each one visibly sends its request and returns a promise. Cancelling stale requests is handled by a small request tracker (`utils/requestTracker.ts`) rather than a library such as Vue Query. I kept it as a Pinia store rather than a composable so the search state survives leaving the page, for example when a details page returns to the same results.
3. **Search page.** Started as a layout skeleton wired to the store, with PrimeVue's default theme so it could be seen working. Converted everything to TypeScript so the page, store and API share types.
4. **Generic components.** Built from a design worked out using the Claude design skill. They take props and emit events, and none touch the store. One difference from the mockup: the pagination bar stays visible when the page size is larger than the total, so the size can be changed back.
5. **Component implementations.** The search-specific pieces live with the page in `pages/search/`, and only generic code stays shared. Results change only when a search is submitted. Clicking a result, or picking an ETF or share in the search box, opens a details drawer with the fields the API returns. Checked against the running mock API as well as with unit tests.
6. **Theming.** I measured the key colour pairs in both themes against WCAG AA, and they are now tests (`theme/__tests__/contrast.spec.ts`). They caught grey counts on tinted backgrounds, and muted text on the warmer page background, which both now use a darker grey. The page is light by default to match the Betashares site, with a toggle for dark that is remembered.
7. **Storybook.** One story file beside each component, using sample data from `src/stories/fixtures.ts`, so no API is needed. Stories that need the dropdown open use a play function to click or type. The accessibility panel checks each story. The page itself has no story, because it is the one part that uses the store and the API, and the Playwright tests cover it.
8. **Playwright.** The tests found a real accessibility bug: the sort dropdown was named by its value instead of "Sort by". They also showed that "Betashares first" happens to list funds alphabetically, so the tests wait for each API response instead of trusting what is on screen.

After the main build I hardened error handling (friendly messages, logging, timeouts, retry for search and details), fixed the layout on phones, and removed code that was no longer used.

### Trade-offs and next steps

- No Vue Router, so searches aren't shareable by URL yet (`?q=...&kind=etf`), and there is no full page for each ETF or share.
- Popular searches are a curated list. Real search analytics would make them truly dynamic.
- Errors are logged to the console. `utils/logError.ts` is the one place to send them to an error tracker such as Sentry.
- The Vite proxy only works in dev. A deployment needs the same `/api` route on the web server.
- Request timeouts use `AbortSignal.any`, which needs a 2024 or newer browser.
