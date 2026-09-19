import { labLevels } from '@/content/lab';
import { content } from '@/content';
import { href } from '@/app/router';
import { Page, TopBar } from '@/components/Layout';

/** Hidden engine lab: one demo level per engine World 1 does not exercise. */
export function LabScreen() {
  return (
    <Page nav="settings">
      <TopBar title="Engine lab" back={{ name: 'settings' }} />
      <p className="text-sm text-muted">
        Demo levels for testing engines. Not on the map; no role card gate; results are recorded like any
        level.
      </p>
      <ul className="mt-4 grid gap-2">
        {labLevels.map((l) => (
          <li key={l.id}>
            <a
              href={href({ name: 'level', levelId: l.id })}
              className="tap flex flex-col rounded-2xl bg-surface p-3 shadow-card"
              data-testid={`lab-${l.id}`}
            >
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                {l.stages.map((s) => s.game.engine).join(' + ')} · {content.roleRefById[l.roleId]?.shortTitle}
              </span>
              <span className="font-bold">{l.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </Page>
  );
}
