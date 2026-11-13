# Betashares Invest Coding Challenge: Search App

## My solution

A Vue 3 search page for ASX ETFs and shares, in [web/](./web/). See [web/README.md](./web/README.md) for how it works and the decisions behind it.

```bash
# terminal 1, from the repo root
npm run api:install
npm run api            # mock API on http://localhost:8787

# terminal 2
cd web
npm install
npm run dev            # app on http://localhost:3000
```

Tests, from `web/`:

- Unit tests: `npm run test:unit`
- End-to-end tests: `npm run test:e2e`. The first time, run `npx playwright install chromium` to download the browser they use.

Component stories, from `web/`: `npm run storybook`, then open http://localhost:6006.

---

This is a coding challenge to test your flair for building a search and filters page using a mock API as the backend.

You can build the app in React, Vue or Angular, and use any third-party libraries you wish.

## Contents

- [ASSIGNMENT.md](./ASSIGNMENT.md): the full assignment brief
- [api/](./api/): a local mock of the backend Search API, serving instrument data

## Candidate Instructions

Start with [ASSIGNMENT.md](./ASSIGNMENT.md).

Run the mock Search API from the repository root:

```bash
npm run api:install
npm run api        # http://localhost:8787
```

See [api/README.md](./api/README.md) for its endpoints, request format and examples.
