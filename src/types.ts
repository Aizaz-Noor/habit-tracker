// Core data types for the Habit Tracker

export interface Habit {
  id: string;
  name: string;
  createdAt: string; // ISO date string YYYY-MM-DD
}

// completions[habitId][dateString] = true means completed on that day
export type Completions = Record<string, Record<string, boolean>>;

export interface AppData {
  habits: Habit[];
  completions: Completions;
}
