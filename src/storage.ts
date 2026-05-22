import type { AppData } from './types';

const STORAGE_KEY = 'habit-tracker-data';

/** Load data from localStorage. Returns default empty state on error. */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { habits: [], completions: {} };
    return JSON.parse(raw) as AppData;
  } catch {
    // If parsing fails, start fresh
    return { habits: [], completions: {} };
  }
}

/** Save data to localStorage. Silently ignores errors (e.g. private mode). */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable — data lives only in memory this session
  }
}
