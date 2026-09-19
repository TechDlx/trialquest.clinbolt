import { useState } from 'react';
import { useSettings, type MotionSetting, type TextSize, type ThemeSetting } from '@/store/settings';
import { useProgress } from '@/store/progress';
import { navigate } from '@/app/router';
import { Page, TopBar, Disclaimer } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';

function Toggle({
  label,
  hint,
  checked,
  onChange,
  testId,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 shrink-0 accent-brand-600"
        data-testid={testId}
      />
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card">
      <span className="font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="tap rounded-xl border-2 border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsScreen() {
  const s = useSettings();
  const resetProgress = useProgress((p) => p.resetProgress);
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState('');

  return (
    <Page nav="settings">
      <TopBar title="Settings" />
      <div className="grid gap-2">
        <Toggle
          label="Sound"
          hint="Tiny synthesized tones. Off by default."
          checked={s.sound}
          onChange={s.setSound}
        />
        <Toggle
          label="Relaxed mode"
          hint="Turns off every timer. You can still earn 3 stars."
          checked={s.relaxed}
          onChange={s.setRelaxed}
          testId="setting-relaxed"
        />
        <Select<ThemeSetting>
          label="Theme"
          value={s.theme}
          onChange={s.setTheme}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <Select<MotionSetting>
          label="Animations"
          value={s.motion}
          onChange={s.setMotion}
          options={[
            { value: 'system', label: 'Follow device' },
            { value: 'reduce', label: 'Reduce' },
            { value: 'full', label: 'Full' },
          ]}
        />
        <Select<TextSize>
          label="Text size"
          value={s.textSize}
          onChange={s.setTextSize}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'large', label: 'Large' },
          ]}
        />
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-bold">Progress</h2>
        <Button
          variant="danger"
          className="mt-2"
          onClick={() => setConfirm(true)}
          data-testid="reset-progress"
        >
          Reset all progress
        </Button>
      </section>

      <section className="mt-6 text-sm text-muted">
        <h2 className="text-sm font-bold text-fg">About</h2>
        <p className="mt-1">
          Trial Quest v{__APP_VERSION__}. Content aligned with ICH-GCP E6 and general FDA / EMA pathways;
          simplified for learning.
        </p>
        <Disclaimer className="mt-2 text-left" />
      </section>

      <Modal open={confirm} title="Reset all progress?" onClose={() => setConfirm(false)}>
        <p className="text-sm">
          This deletes your XP, stars, badges, streak and Codex on this device. It cannot be undone.
        </p>
        <label className="mt-3 block text-sm">
          Type <strong>RESET</strong> to confirm
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="tap mt-1 w-full rounded-xl border-2 border-border bg-surface-2 px-3 py-2"
            data-testid="reset-confirm-input"
          />
        </label>
        <div className="mt-3 flex gap-2">
          <Button
            variant="danger"
            disabled={typed !== 'RESET'}
            onClick={() => {
              resetProgress();
              setConfirm(false);
              setTyped('');
              navigate({ name: 'title' });
            }}
            className="flex-1"
            data-testid="reset-confirm"
          >
            Reset
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </Modal>
    </Page>
  );
}
