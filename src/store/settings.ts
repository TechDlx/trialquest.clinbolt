import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage, STORAGE_KEYS } from './storage';

export type ThemeSetting = 'system' | 'light' | 'dark';
export type MotionSetting = 'system' | 'reduce' | 'full';
export type TextSize = 'normal' | 'large';

export interface SettingsState {
  sound: boolean;
  relaxed: boolean;
  theme: ThemeSetting;
  motion: MotionSetting;
  textSize: TextSize;
  setSound: (v: boolean) => void;
  setRelaxed: (v: boolean) => void;
  setTheme: (v: ThemeSetting) => void;
  setMotion: (v: MotionSetting) => void;
  setTextSize: (v: TextSize) => void;
  resetSettings: () => void;
}

export const SETTINGS_VERSION = 1;

const defaults = {
  sound: false,
  relaxed: false,
  theme: 'system' as ThemeSetting,
  motion: 'system' as MotionSetting,
  textSize: 'normal' as TextSize,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setSound: (sound) => set({ sound }),
      setRelaxed: (relaxed) => set({ relaxed }),
      setTheme: (theme) => set({ theme }),
      setMotion: (motion) => set({ motion }),
      setTextSize: (textSize) => set({ textSize }),
      resetSettings: () => set({ ...defaults }),
    }),
    {
      name: STORAGE_KEYS.settings,
      version: SETTINGS_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        sound: s.sound,
        relaxed: s.relaxed,
        theme: s.theme,
        motion: s.motion,
        textSize: s.textSize,
      }),
    },
  ),
);

function prefers(query: string): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

export function resolveTheme(theme: ThemeSetting): 'light' | 'dark' {
  if (theme === 'system') return prefers('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  return theme;
}

export function resolveReducedMotion(motion: MotionSetting): boolean {
  if (motion === 'system') return prefers('(prefers-reduced-motion: reduce)');
  return motion === 'reduce';
}
