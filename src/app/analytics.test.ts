import { afterEach, describe, expect, it, vi } from 'vitest';
import indexHtml from '../../index.html?raw';
import caddy from '../../deploy/quest.caddy?raw';
import { screenPath, trackScreen } from './analytics';

const lf = (s: string) => s.replace(/\r\n/g, '\n');
const inlineScripts = () => [...lf(indexHtml).matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

describe('Google Analytics tag', () => {
  it('sits at the top of the one page every screen is served from', () => {
    const html = lf(indexHtml);
    const tag = html.indexOf('https://www.googletagmanager.com/gtag/js?id=G-2QBG227Q5J');
    expect(tag).toBeGreaterThan(-1);
    expect(tag).toBeLessThan(html.indexOf('<meta charset'));
    expect(html).toContain("gtag('config', 'G-2QBG227Q5J'");
  });

  it('is allowed by the live security policy: the inline script hash matches deploy/quest.caddy', async () => {
    const scripts = inlineScripts();
    expect(scripts).toHaveLength(1);
    const hash = await sha256(scripts[0]!);
    // If this fails, the inline tag changed: copy the new hash into script-src in deploy/quest.caddy.
    expect(lf(caddy)).toContain(`'sha256-${hash}'`);
    expect(lf(caddy)).toContain('https://*.googletagmanager.com');
    expect(lf(caddy)).toContain('https://*.google-analytics.com');
  });
});

describe('screen tracking', () => {
  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it('reports each screen as its own path', () => {
    expect(screenPath({ name: 'title' })).toBe('/');
    expect(screenPath({ name: 'level', levelId: 'w1-l1' })).toBe('/level/w1-l1');
    expect(screenPath({ name: 'role', roleId: 'cmc-scientist', levelId: 'w1-l4' })).toBe(
      '/role/cmc-scientist',
    );

    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    trackScreen({ name: 'map', worldId: 'w2' });
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_title: 'map',
      page_path: '/map/w2',
      page_location: `${window.location.origin}/map/w2`,
    });
  });

  it('does nothing when the tag is not loaded (blocked, offline, tests)', () => {
    expect(() => trackScreen({ name: 'map' })).not.toThrow();
  });
});
