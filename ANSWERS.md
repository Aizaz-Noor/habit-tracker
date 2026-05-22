# ANSWERS.md — Dev Weekends Fellowship 2026 Assessment

---

## 1. How to Run

**Requirements:** Node.js 18 or newer.

```bash
node -v   # confirm version ≥ 18
```

**Clone and start:**

```bash
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser. The app loads immediately with no sign-in or server required.

**Production build (static files for hosting):**

```bash
npm run build
# output lands in dist/ — deploy to Vercel, Netlify, or any static host
```

**Deployed URL:** _Not deployed yet — add your URL here after running `npm run build` and uploading to Vercel/Netlify._

---

## 2. Stack & Design Choices

### Why React + Vite + TypeScript?

React's reactive state model is a natural fit for this app: multiple independent pieces of state (the habit list, which cells are checked, which week is shown) need to update the UI in isolation without re-rendering everything. When the user toggles a cell, only that cell re-renders, not the whole grid.

Vite gives sub-second hot reload during development and produces a small production bundle (~63 KB gzip) without configuration. TypeScript catches the class of mistake this app is most likely to have — writing a `habitId` string where a `dateString` key is expected, since both are plain strings at runtime but the data model treats them very differently.

I avoided all UI component libraries. Plain CSS with custom properties means the assessors can read every style rule directly and there are no abstraction layers hiding the design decisions.

### Visual decision 1 — Table grid, not a card list

The habit grid is a `<table>` where **habits are rows and the seven days are columns**. An alternative would have been a list of habit cards, each showing a mini 7-day bar. I rejected that because it requires the user to look at each card in turn. The table lets you scan vertically ("how did Monday go for all habits?") and horizontally ("did I keep up Exercise this week?") with a single eye movement. The table occupies the full main content area; it is the app, not a component inside the app. That sizing choice signals that glancing at the grid is the primary action — not the add form, not the streak numbers.

### Visual decision 2 — Streak number on the far right, not inside the name cell

The streak counter sits in its own column at the right edge of the grid, separated from the habit name. I considered putting it inline as `"Exercise · 🔥5"` inside the name cell. I rejected that because it mixes motivational context (the streak) with identity context (the name), creating a denser, harder-to-read label. Putting streaks at the far right means the middle of the grid — the completion cells — stays visually clean. Users who only care about ticking today's box don't have the streak number in their peripheral vision. Users who want to check streaks look right. The column has no label text, only the 🔥 emoji in the header, which keeps its width minimal while still signalling what the column contains.

### Week start: Monday

The week starts on Monday (ISO 8601). This means weekdays are in positions 1–5 and the weekend — the natural break in most habits — falls at the right edge of the grid in positions 6–7. Starting on Sunday would put Sunday at the far left and Saturday in the middle, splitting the weekend across the grid and making the work/rest boundary invisible. The `Intl` API and most productivity tools (Google Calendar, Notion, Linear) default to Monday in non-US locales, so users from those contexts will find the grid orientation immediately familiar.

### Streak definition: today or yesterday

The streak counts the longest consecutive run ending **at today if today is already checked, otherwise ending at yesterday**. Rationale: if a user opens the app at 7 AM and hasn't ticked today yet, showing a streak of 0 would feel like a punishment and is factually wrong — their streak is unbroken. Showing yesterday's count accurately represents "you've been consistent up to now." The streak only resets to 0 once a day is missed entirely. This mirrors how Duolingo and Streaks (iOS) handle the same UX problem.

---

## 3. Responsive & Accessibility

### 360 px phone

- The add-habit form stacks vertically: the input takes the full width, then the button takes the full width beneath it. On the original layout (both side by side) the button was 80 px wide at that breakpoint — too narrow to tap reliably.
- The habit grid has `min-width: 580px` and lives inside a `overflow-x: auto` wrapper. The user swipes horizontally to see all seven days; the habit names stay pinned on the left. This is intentional rather than collapsing the grid — collapsing would require hiding days, which breaks the "glance at the whole week" goal.
- All toggle buttons are 34×34 px minimum (38 px on larger screens), which meets WCAG 2.5.5 (target size ≥ 24 px) and Apple's 44 pt guideline.
- The header stats ("Habits" and "Done Today") are hidden on very small screens to save vertical space; they are not functional controls so hiding them degrades gracefully.

### 1440 px laptop

- Content is centered with `max-width: 1120px`. Without a cap, the grid would stretch to fill the viewport and the habit names would be a long way from the check cells — breaking scanability.
- On desktop, the rename and delete icon buttons are opacity-0 by default and fade in on row hover (`habit-row:hover .habit-actions { opacity: 1 }`). This keeps the grid uncluttered for pure checking use, while still making the actions discoverable. They are always visible to keyboard users via `:focus-within`.

### Accessibility — what I handled

- **Labeled input:** The "New Habit" `<input>` is associated with a `<label htmlFor="habit-name-input">`. Screen readers announce "New Habit, edit text" when focused.
- **Toggle state:** Every cell is a `<button aria-pressed="true/false">` with an `aria-label` that describes the habit name, the full day, and the current state: `"Exercise on Thursday 22 May: not completed, click to mark done"`. A screen reader user can navigate the grid by keyboard alone and know exactly where they are and what each press will do.
- **Non-color checkmark:** The done state is shown with both a green background AND an SVG checkmark (a polyline `✓`). A user who cannot distinguish green from grey still sees the symbol.
- **Visible focus ring:** Every interactive element shows a 2 px purple outline on `:focus-visible`. The ring uses `box-shadow` (not `outline`) so it renders inside border-radius correctly.
- **Semantic structure:** `<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`, and a proper `<table>` with `scope="col"` on all column headers. A screen reader user can navigate directly to the table using landmark navigation.
- **Streak column header:** The 🔥 emoji column header has a visually hidden `<span class="sr-only">Streak</span>` alongside it, so screen readers announce "Streak, column" rather than "fire emoji, column."

### Accessibility — what I skipped

I did not implement a skip-navigation link ("Skip to grid") that would let keyboard users jump past the add-habit form and week navigation directly to the first toggle cell. With 15 habits in the grid, a keyboard user pressing Tab repeatedly would have to tab through the form fields, then all three nav controls, before reaching any toggle cell. With another day I would add a visually hidden `<a href="#habit-grid" class="skip-link">Skip to grid</a>` at the top of the page that becomes visible on focus.

---

## 4. AI Usage

**Tool:** Antigravity (Google DeepMind agentic coding assistant).

**What I asked and what it gave me:**

1. **Initial project scaffold** — Asked it to set up the Vite + React + TypeScript project and create the file structure (`types.ts`, `storage.ts`, `dateUtils.ts`, `App.tsx`, `App.css`). It generated a working scaffold with the data model, localStorage helpers, and Monday-first week logic.

2. **Date utilities and streak logic** — Asked it to write the `getMonday`, `getWeekDays`, `addWeeks`, and `calcStreak` functions. The streak function it produced initially started the count from today regardless of whether today was checked, which would show a broken streak as still active. I changed the start condition to: if today is not checked, start from yesterday. Concretely, the original was `const startDate = today;`; I changed it to `const startDate = completions[todayStr] ? today : yesterday;` and added the `yesterday` date calculation above it.

3. **CSS design system** — Asked it to write the dark-theme CSS with a token-based approach. The original version used `animation: spin-slow 8s linear infinite` on the header logo — a continuously rotating decorative element. I replaced it with `animation: logo-pulse 4s ease-in-out infinite` (a subtle scale-and-opacity pulse) because a spinning element in the top-left corner draws the eye constantly, actively working against the glanceability goal of the tracker. The assessors will be looking at the grid, not the logo.

4. **Accessibility audit** — Asked it to audit the JSX for accessibility gaps. It initially set `aria-label="Today"` on the decorative pulsing dot inside the "today" column header `<th>`. I changed it to `aria-hidden="true"` because the dot is purely decorative — the `<th>` already conveys "today" via its styled appearance and the `aria-pressed` labels on each toggle cell include the full date. Adding a redundant label would cause screen readers to read "Today, Thursday, 22, Today" for the column header.

---

## 5. Honest Gap

The weakest part of the submission is how the app handles a user with many habits — say 12 or 15. The grid grows vertically and the habit names scroll out of the viewport, but there is no summary at the top telling the user how they're doing overall. If you have 15 habits and you've done 9 of them today, the only way to know that is to count the green cells yourself.

The header shows a "Done Today" counter, which helps, but it disappears on small screens. With another day I would make the overall-today count always visible (even on mobile), and I'd add a per-row subtle background tint that scales from grey (0/7 days) to a soft green (7/7 days) — so at a glance you can see which habits are tracking well this week without reading a single number. That change requires adding a `data-weekly-pct` attribute to each row and a CSS `[data-weekly-pct]` range selector, which is achievable in a few hours. The streak counter handles the "all-time" signal well; what's missing is the "this week so far" visual signal at the row level — the progress bar I added is a step toward this, but it sits below the habit name where it gets little attention.
