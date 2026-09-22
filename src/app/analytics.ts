import { href, type Route } from './router';

type Gtag = (...args: unknown[]) => void;

/**
 * The screen's address for analytics: the hash route as a plain path, so "#/level/w1-l1" reports
 * as "/level/w1-l1" instead of every screen counting as "/".
 */
export function screenPath(route: Route): string {
  return href(route).replace(/^#/, '').split('?')[0] || '/';
}

/**
 * Reports one page view for a screen. The Google tag in index.html loads gtag and turns off its
 * own page view, because hash routing never loads a new page. Does nothing when the tag is
 * missing (blocked, offline, or in tests).
 */
export function trackScreen(route: Route): void {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== 'function') return;
  const path = screenPath(route);
  gtag('event', 'page_view', {
    page_title: route.name,
    page_path: path,
    page_location: `${window.location.origin}${path}`,
  });
}
