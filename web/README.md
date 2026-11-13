# Fund Search

A search page for ASX-listed ETFs and shares, built with Vue 3, TypeScript, Vite, PrimeVue and Pinia, using the Fetch API. It runs against the local mock Search API in `../api`.

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

| Command                   | What it does                                  |
| ------------------------- | --------------------------------------------- |
| `npm run dev`             | Dev server with hot reload                    |
| `npm run build`           | Type-check and production build               |
| `npm run test:unit`       | Unit and component tests (Vitest)             |
| `npm run test:e2e`        | End-to-end tests against the API (Playwright) |
| `npm run storybook`       | Component workshop on http://localhost:6006   |
| `npm run build-storybook` | Static build of the component workshop        |
| `npm run type-check`      | Type-check only                               |
| `npm run lint`            | Lint (oxlint and ESLint)                      |
| `npm run format`          | Format `src/` (Prettier)                      |

A pre-commit hook (husky and lint-staged) lints and formats the staged files, so a commit with lint errors is stopped. `npm install` sets it up.

## What it does

- **Predictive suggestions.** With the box empty: recent searches, popular searches and flagship funds. While typing: search for the text in everything or only ETFs or shares (with counts), the matching ETFs and shares, and popular terms that contain the text.
- **Search.** Matches ticker, name and issuer. Results change when a search is submitted or a suggestion is picked, not on every key. `OR` between words finds either.
- **Results.** Logo, ticker, name, type, issuer, badges (flagship, Auto Invest) and shares on issue, with matches underlined. Clicking a result opens a details drawer.
- **Filters and sorting.** Type, issuer and fund features (Betashares, flagship, Auto Invest), each with live counts, removable filter chips, and five sort orders.
- **Pagination**, with a page size choice and a simpler "Page 2 of 31" layout on phones.
- **States.** A loading skeleton (only if loading takes over 120ms, so fast searches don't flicker), a friendly no-results message with tips, and a friendly error with retry.
- **Accessibility.** Labelled controls, keyboard-operable suggestions, visible focus rings, and WCAG AA contrast checked by tests in both themes.
- **Theme and mobile.** A warm light theme by default with a dark theme toggle. On phones: a scrolling row of popular searches, an icon search button, and the back button closes the details drawer.

### Performance

- Suggestions wait 150ms after the last key, and ask only for the fields a suggestion shows.
- Requests that are needed together (suggestions and their counts, the filter counts) are sent at the same time.
- A newer request cancels an older one of the same kind, so typing fast never shows stale results.
- Filter counts leave out empty values (`omit_empty_counts`), so responses stay small.
- The results only change on submit, not on every key, so the main search runs once per search.

### Testing

| What                     | How                                                                           |
| ------------------------ | ----------------------------------------------------------------------------- |
| Unit and component tests | 363 Vitest tests, beside the code in `__tests__` folders                      |
| End-to-end tests         | 8 Playwright tests in `e2e/`, against the real app and API, desktop and phone |
| Colour contrast          | Tests for WCAG AA in both themes (`theme/__tests__/contrast.spec.ts`)         |
| Component states         | 62 Storybook stories, each checked by the accessibility addon                 |
| Lint, format and types   | oxlint, ESLint, Prettier and vue-tsc, with lint and format on every commit    |

## Project Breakdown

### Design decisions

1. **Mockup first, then fit it to the API.** I built a clickable mockup with the real component library to test the flow, keyboard use and states cheaply, then reworked it around what the API actually offers. There are no fees or returns, so rows show ticker, name, type, issuer and badges. There is no popularity data, so popular searches come from a config list, recent searches and flagship funds.
2. **PrimeVue 4.5, pinned.** It is MIT licensed, while v5 needs a paid licence. The styled Aura theme needs no extra setup.
3. **Light brand theming.** Brand orange (`#FC4D16`) for focus and highlights, on the warm greys of the Betashares site. Buttons use a deeper orange, because white on the bright orange fails WCAG AA.
4. **A standalone page.** The brief asks for a search page, not a rebuild of the site.

### Principles

1. **Modular.** Each piece has one job, and components don't know about each other.
2. **Transportable.** Only the API composable knows the API, so a different endpoint changes one file. Components use props and events, never the store, so they can be copied into another app. The theme lives in one preset file and a few CSS variables.
3. **Simple to read.** Standard Vue single-file components, small named functions, no clever code.

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
3. **Changing a filter** searches again and reloads the filter counts. **Changing the sort or page** only searches again. A newer request cancels an older one of the same kind, so a slow response never overwrites a newer one.
4. **Picking a result** loads it from `/instruments/:id` into the details drawer.

Failures: the main search shows a friendly error with retry. Optional parts (suggestions, filter counts) quietly hide. Every failure is logged to the console with what failed, and requests time out after 10 seconds.

### How it was built

Layer by layer, from the data upward, each with its own tests before the next.

1. **API composable** (unit tests with mocked `fetch`). It takes the app's own params and types and builds the API's request body itself, so no API name such as `search_text` or `display_name` exists outside it.
2. **Pinia store** (unit tests). I started with watchers and `onWatcherCleanup`, then chose explicit actions, because each one visibly sends its request and is easier to trace and test. A small request tracker cancels stale requests, rather than a library such as Vue Query.
3. **Search page** (component tests). The only place that knows both the store and the components.
4. **Generic components** (component tests). Props and events only, from a design worked out with the Claude design skill.
5. **Search components** (component tests). Built on the generic ones and kept beside the page in `pages/search/`.
6. **Theming** (contrast tests). Measuring colour pairs against WCAG AA caught grey counts on tinted backgrounds and muted text on the warm background. Both now use a darker grey.
7. **Storybook.** One story file beside each component, with sample data so no API is needed. The page has no story, because Playwright covers it.
8. **Playwright.** The tests found a real accessibility bug (the sort dropdown was named by its value, not "Sort by"), and showed that the default order happens to be alphabetical, so they wait for each API response instead of trusting the screen.

After that I hardened error handling (friendly messages, logging, timeouts, retry), fixed the phone layout, and removed code that was no longer used.

### Trade-offs and next steps

- No Vue Router, so searches aren't shareable by URL yet (`?q=...&kind=etf`), and there is no full page for each ETF or share.
- Popular searches are a curated list. Real search analytics would make them truly dynamic.
- Errors are logged to the console. `utils/logError.ts` is the one place to send them to an error tracker such as Sentry.
- The Vite proxy only works in dev. A deployment needs the same `/api` route on the web server.
- Request timeouts use `AbortSignal.any`, which needs a 2024 or newer browser.
- No CI yet. A GitHub Actions workflow running lint, type-check, unit and end-to-end tests on each push would be the next step.
