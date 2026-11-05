import { arrivedFrom } from '@/lib/analytics';
import { recordStats } from '@/lib/stats.functions';
import type { Metric, StatEvent } from '@/lib/stats';

// Browser side of the anonymous counts: events queue for a moment and go up in one small batch.
// Only the live site counts (not previews or local dev), never automated browsers, and never the owner's
// own devices: /admin sets dc-no-stats once the owner signs in there.
const NO_STATS = 'dc-no-stats';
const VISIT = 'dc-visit';
const queue: StatEvent[] = [];
let timer: number | undefined;
const once = new Set<string>();

function enabled() {
  if (typeof window === 'undefined' || navigator.webdriver) return false;
  if (!/(^|\.)documentaryclub\.fyi$/.test(location.hostname)) return false;
  try { return localStorage.getItem(NO_STATS) !== '1'; } catch { return true; }
}
export function excludeThisDevice() {
  try { localStorage.setItem(NO_STATS, '1'); } catch { /* storage blocked */ }
}

function flush() {
  timer = undefined;
  const events = queue.splice(0, 30);
  if (events.length) recordStats({ data: { events } }).catch(() => {});
  if (queue.length) timer = window.setTimeout(flush, 1500);
}
export function stat(m: Metric, k: string, { unique = false } = {}) {
  if (!k || !enabled()) return;
  if (unique) { const id = `${m}~${k}`; if (once.has(id)) return; once.add(id); }
  queue.push({ m, k });
  if (timer === undefined) timer = window.setTimeout(flush, 1500);
}
// Send what's queued before the tab goes to the background (people often leave straight after a click).
if (typeof window !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && queue.length) { window.clearTimeout(timer); flush(); } });

const device = () => (/iPad|Tablet/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)) ? 'tablet'
  : /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop');

// Called after every route change: the first page in a tab is a visit (with where it came from and the device),
// and each page and film page counts once per tab.
export function statPage(pathname: string) {
  if (!enabled() || pathname.startsWith('/admin')) return;
  try {
    if (!sessionStorage.getItem(VISIT)) {
      sessionStorage.setItem(VISIT, '1');
      stat('visit', arrivedFrom());
      stat('device', device());
    }
  } catch { /* storage blocked: skip visit counting */ }
  const path = pathname === '/' ? 'home' : pathname.replace(/^\/|\/$/g, '');
  stat('page', path, { unique: true });
  const film = /^\/film\/([^/]+)/.exec(pathname)?.[1];
  if (film) stat('view', film, { unique: true });
}
// Outbound clicks are caught in one place, so the buttons themselves stay plain links.
export function statClick(event: MouseEvent) {
  const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!link) return;
  const film = /^\/film\/([^/]+)/.exec(location.pathname)?.[1] ?? '';
  const href = link.href;
  if (film && /netflix\.com\/title\//.test(href)) stat('netflix', film);
  else if (film && /youtube\.com\/watch/.test(href)) stat('youtube', film);
  else if (/ko-fi\.com\//.test(href)) stat('kofi', location.pathname === '/about' ? 'about' : 'footer');
}
