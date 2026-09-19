import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

/**
 * Node 22+ ships an experimental `localStorage` global that is undefined unless
 * --localstorage-file is passed, and it shadows jsdom's. Provide an in-memory Storage.
 */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}

function ensureStorage(name: 'localStorage' | 'sessionStorage') {
  let ok = false;
  try {
    ok = typeof window[name]?.getItem === 'function';
  } catch {
    ok = false;
  }
  if (!ok) {
    const storage = new MemoryStorage();
    Object.defineProperty(window, name, { value: storage, configurable: true, writable: true });
    Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
  }
}
ensureStorage('localStorage');
ensureStorage('sessionStorage');

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

afterEach(() => {
  cleanup();
});

// jsdom lacks matchMedia; components read prefers-reduced-motion / color-scheme.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
