import { useState, useCallback, useEffect } from 'react';
import type { Habit, Completions } from './types';
import { loadData, saveData } from './storage';
import {
  toDateString,
  todayString,
  getWeekDays,
  addWeeks,
  weekLabel,
  dayHeader,
  calcStreak,
  getMonday,
} from './dateUtils';
import './App.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  // Track which cell just got toggled to trigger pop animation
  const [justToggled, setJustToggled] = useState<string>('');
  // Track newly added habit id for entrance animation
  const [newlyAdded, setNewlyAdded] = useState<string>('');
  // Success flash on add
  const [addSuccess, setAddSuccess] = useState(false);

  const today = todayString();
  const weekDays = getWeekDays(anchorDate);
  const currentWeekMonday = getMonday(new Date());

  const isCurrentWeek =
    toDateString(getMonday(anchorDate)) === toDateString(currentWeekMonday);

  // ── Persist helper ─────────────────────────────────────────────────────
  const update = useCallback(
    (updater: (prev: typeof data) => typeof data) => {
      setData((prev) => {
        const next = updater(prev);
        saveData(next);
        return next;
      });
    },
    []
  );

  // ── Add habit ──────────────────────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError('Please enter a habit name.');
      return;
    }
    const duplicate = data.habits.some(
      (h) => h.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setAddError('A habit with that name already exists.');
      return;
    }
    const habit: Habit = {
      id: generateId(),
      name: trimmed,
      createdAt: today,
    };
    update((prev) => ({
      ...prev,
      habits: [...prev.habits, habit],
      completions: { ...prev.completions, [habit.id]: {} },
    }));
    setNewlyAdded(habit.id);
    setNewName('');
    setAddError('');
    // Trigger success animation
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 800);
    setTimeout(() => setNewlyAdded(''), 600);
  }

  // ── Rename habit ───────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  function startEdit(habit: Habit) {
    setEditingId(habit.id);
    setEditName(habit.name);
  }

  function commitEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    update((prev) => ({
      ...prev,
      habits: prev.habits.map((h) =>
        h.id === id ? { ...h, name: trimmed } : h
      ),
    }));
    setEditingId(null);
    setEditName('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  // ── Delete habit ───────────────────────────────────────────────────────
  function handleDelete(habit: Habit) {
    if (!window.confirm(`Delete "${habit.name}"? This cannot be undone.`)) return;
    update((prev) => {
      const completions: Completions = { ...prev.completions };
      delete completions[habit.id];
      return {
        habits: prev.habits.filter((h) => h.id !== habit.id),
        completions,
      };
    });
  }

  // ── Toggle completion ──────────────────────────────────────────────────
  function handleToggle(habitId: string, dateStr: string) {
    const key = `${habitId}:${dateStr}`;
    setJustToggled(key);
    setTimeout(() => setJustToggled(''), 350);
    update((prev) => {
      const habitCompletions = prev.completions[habitId] ?? {};
      const current = habitCompletions[dateStr] ?? false;
      return {
        ...prev,
        completions: {
          ...prev.completions,
          [habitId]: {
            ...habitCompletions,
            [dateStr]: !current,
          },
        },
      };
    });
  }

  // ── Week navigation ────────────────────────────────────────────────────
  function goToPrevWeek() {
    setAnchorDate((d) => addWeeks(d, -1));
  }
  function goToNextWeek() {
    setAnchorDate((d) => addWeeks(d, 1));
  }
  function goToThisWeek() {
    setAnchorDate(new Date());
  }

  // Dismiss inline edit on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setEditingId(null);
        setEditName('');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Weekly completion % per habit ──────────────────────────────────────
  function weeklyProgress(habitId: string): number {
    const completions = data.completions[habitId] ?? {};
    const done = weekDays.filter((d) => completions[toDateString(d)]).length;
    return Math.round((done / 7) * 100);
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo" aria-hidden="true">✦</div>
          <div className="header-text">
            <h1>Weekly Habit Tracker</h1>
            <p className="subtitle">Build consistency one day at a time.</p>
          </div>
          <div className="header-stats" aria-label="Summary">
            <div className="stat-pill">
              <span className="stat-val">{data.habits.length}</span>
              <span className="stat-lbl">Habits</span>
            </div>
            <div className="stat-pill">
              <span className="stat-val">
                {data.habits.filter(
                  (h) => data.completions[h.id]?.[today]
                ).length}
              </span>
              <span className="stat-lbl">Done Today</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* ── Add Habit Form ────────────────────────────────────────────── */}
        <section className="add-section" aria-label="Add a new habit">
          <form onSubmit={handleAdd} className="add-form" noValidate>
            <label htmlFor="habit-name-input" className="form-label">
              New Habit
            </label>
            <div className="add-form-row">
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">＋</span>
                <input
                  id="habit-name-input"
                  type="text"
                  className="habit-input"
                  placeholder="e.g. Read 30 min, Exercise, Meditate…"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (addError) setAddError('');
                  }}
                  maxLength={60}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className={`btn btn-primary${addSuccess ? ' btn-success' : ''}`}
                aria-label={addSuccess ? 'Habit added' : 'Add habit'}
              >
                {addSuccess ? '✓ Added!' : '+ Add Habit'}
              </button>
            </div>
            {addError && (
              <p className="form-error" role="alert">
                ⚠ {addError}
              </p>
            )}
          </form>
        </section>

        {/* ── Week Navigation ───────────────────────────────────────────── */}
        <nav className="week-nav" aria-label="Week navigation">
          <button
            className="btn btn-nav"
            onClick={goToPrevWeek}
            aria-label="Go to previous week"
          >
            <span className="nav-arrow">←</span>
            <span className="nav-label">Prev</span>
          </button>

          <div className="week-label-group">
            <span className="week-label">
              {isCurrentWeek && (
                <span className="live-dot" aria-hidden="true" />
              )}
              {weekLabel(weekDays)}
            </span>
            {!isCurrentWeek && (
              <button
                className="btn btn-this-week"
                onClick={goToThisWeek}
                aria-label="Return to current week"
              >
                ⌂ This Week
              </button>
            )}
          </div>

          <button
            className="btn btn-nav"
            onClick={goToNextWeek}
            aria-label="Go to next week"
          >
            <span className="nav-label">Next</span>
            <span className="nav-arrow">→</span>
          </button>
        </nav>

        {/* ── Habit Grid or Empty State ──────────────────────────────────── */}
        {data.habits.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="grid-section" aria-label="Habit tracker grid">
            <div className="grid-scroll-wrapper">
              <table className="habit-grid" role="grid">
                <thead>
                  <tr>
                    <th className="habit-col-header" scope="col">
                      <span className="sr-only">Habit</span>
                    </th>
                    {weekDays.map((day) => {
                      const ds = toDateString(day);
                      const isToday = ds === today;
                      const { abbr, num } = dayHeader(day);
                      return (
                        <th
                          key={ds}
                          scope="col"
                          className={`day-header${isToday ? ' today' : ''}`}
                        >
                          <span className="day-abbr">{abbr}</span>
                          <span className="day-num">{num}</span>
                          {isToday && (
                            <span className="today-dot" aria-hidden="true" />
                          )}
                        </th>
                      );
                    })}
                    <th className="streak-col-header" scope="col">
                      <span className="streak-header-label" aria-hidden="true">🔥</span>
                      <span className="sr-only">Streak</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.habits.map((habit) => {
                    const streak = calcStreak(data.completions[habit.id] ?? {});
                    const isEditing = editingId === habit.id;
                    const progress = weeklyProgress(habit.id);
                    const isNew = newlyAdded === habit.id;

                    return (
                      <tr
                        key={habit.id}
                        className={`habit-row${isNew ? ' row-enter' : ''}`}
                      >
                        {/* ── Habit name + actions ── */}
                        <td className="habit-name-cell">
                          {isEditing ? (
                            <div className="edit-row">
                              <input
                                className="edit-input"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitEdit(habit.id);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                maxLength={60}
                                autoFocus
                                aria-label="Edit habit name"
                              />
                              <button
                                className="btn btn-sm btn-save"
                                onClick={() => commitEdit(habit.id)}
                                aria-label="Save habit name"
                              >
                                ✓
                              </button>
                              <button
                                className="btn btn-sm btn-cancel"
                                onClick={cancelEdit}
                                aria-label="Cancel edit"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="habit-name-row">
                              <div className="habit-name-stack">
                                <span className="habit-name" title={habit.name}>
                                  {habit.name}
                                </span>
                                {/* Weekly progress mini-bar */}
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  aria-valuenow={progress}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`${progress}% this week`}
                                >
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                              <div className="habit-actions">
                                <button
                                  className="icon-btn"
                                  onClick={() => startEdit(habit)}
                                  aria-label={`Rename ${habit.name}`}
                                  title="Rename"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button
                                  className="icon-btn icon-btn--danger"
                                  onClick={() => handleDelete(habit)}
                                  aria-label={`Delete ${habit.name}`}
                                  title="Delete"
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* ── Day toggle cells ── */}
                        {weekDays.map((day) => {
                          const ds = toDateString(day);
                          const isToday = ds === today;
                          const done = !!(data.completions[habit.id]?.[ds]);
                          const toggleKey = `${habit.id}:${ds}`;
                          const popping = justToggled === toggleKey;

                          return (
                            <td
                              key={ds}
                              className={[
                                'check-cell',
                                isToday ? 'today' : '',
                                done ? 'done' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <button
                                className={`check-btn${popping ? ' pop' : ''}`}
                                onClick={() => handleToggle(habit.id, ds)}
                                aria-pressed={done}
                                aria-label={`${habit.name} on ${day.toLocaleDateString(
                                  'en-GB',
                                  { weekday: 'long', day: 'numeric', month: 'long' }
                                )}: ${done ? 'completed, click to undo' : 'not completed, click to mark done'}`}
                              >
                                {done ? (
                                  <svg className="check-svg done-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                                ) : (
                                  <svg className="check-svg empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg>
                                )}
                              </button>
                            </td>
                          );
                        })}

                        {/* ── Streak ── */}
                        <td className="streak-cell">
                          {streak > 0 ? (
                            <span
                              className="streak-badge streak-active"
                              title={`${streak}-day streak`}
                            >
                              <span className="streak-fire" aria-hidden="true">🔥</span>
                              <span className="streak-num">{streak}</span>
                            </span>
                          ) : (
                            <span className="streak-badge" title="No streak yet">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <span className="footer-dot" aria-hidden="true">◆</span>
        <p>All data stored in your browser &nbsp;·&nbsp; <span className="footer-accent">Weekly Habit Tracker</span></p>
      </footer>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-rings" aria-hidden="true">
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="empty-icon-inner">📋</div>
      </div>
      <h2 className="empty-title">No habits yet</h2>
      <p className="empty-desc">
        Add your first habit above and start building your streak today.
      </p>
      <div className="empty-arrow" aria-hidden="true">↑</div>
    </div>
  );
}
