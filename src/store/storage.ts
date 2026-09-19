import type { StateStorage } from 'zustand/middleware';

/** localStorage wrapped so private mode, quota errors and blocked storage never crash the game. */
export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* ignore: storage unavailable or full */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const STORAGE_KEYS = {
  progress: 'trialquest.progress',
  settings: 'trialquest.settings',
} as const;
