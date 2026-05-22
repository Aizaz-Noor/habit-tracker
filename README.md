# Weekly Habit Tracker

A single-page habit tracker. Add daily habits, check them off on a weekly grid, watch streaks build over time. No account, no server — data lives in your browser.

## Run locally

> **Requires Node.js 18+** — check with `node -v`

```bash
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**.

## Build for production

```bash
npm run build
# static files land in dist/ — deploy to Vercel, Netlify, or any static host
```

## Deployed URL

**Not deployed yet** — add your live URL here after deploying.

## What it does

- Add, rename (inline), and delete habits
- Weekly grid: habits as rows, Mon–Sun as columns
- Today's column highlighted; pulsing dot confirms which week you're on
- Previous / next week navigation + "This Week" shortcut
- Per-habit streak counter (🔥 N) — calculated across all weeks, not just the visible one
- Weekly progress bar per habit (thin gradient line under the name)
- "Done Today" counter in the header for at-a-glance status
- Full persistence in `localStorage` — survives page reload and browser restart

## Data

Stored in `localStorage` under the key `habit-tracker-data`. Clearing site data will reset the tracker. No data is ever sent to a server.

## Commit history

The assessment requires at least one commit showing progress. Suggested sequence after scaffolding:

```bash
git init && git add .gitignore package.json tsconfig*.json vite.config.ts eslint.config.js index.html
git commit -m "chore: initial Vite React TypeScript scaffold"

git add src/types.ts src/storage.ts src/dateUtils.ts
git commit -m "feat: data model, localStorage persistence, date helpers and streak logic"

git add src/App.tsx
git commit -m "feat: habit CRUD, weekly grid, week navigation, streak display"

git add src/App.css src/index.css
git commit -m "style: dark dashboard design, responsive layout, micro-animations"

git add README.md ANSWERS.md
git commit -m "docs: README and ANSWERS for assessment submission"
```

## Tech stack

- React 19 + TypeScript · Vite 8
- Plain CSS (no UI library)
- `localStorage` for persistence
