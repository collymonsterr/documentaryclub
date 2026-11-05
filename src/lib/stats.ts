// Anonymous, first-party counts for the owner's Stats page: one Firestore document per day, metric and key
// (stats/2026-11-05~save~free-solo = { d, m, k, n }). Nothing about who did it is stored, so it counts every
// visitor, not only those who accept Google Analytics. The published Firestore rules (firestore.rules) only let
// anyone add to a count, and only the owner read them.

export const METRICS = {
  visit: 'Visits',
  page: 'Page views',
  view: 'Film page views',
  save: 'Saves',
  watched: 'Marked watched',
  trailer: 'Trailer plays',
  netflix: 'Watch on Netflix clicks',
  youtube: 'Watch free on YouTube clicks',
  share: 'Copy link (film pages)',
  surprise: 'Surprise me picks',
  nosearch: 'Searches with no results',
  account: 'New accounts',
  kofi: 'Ko-fi tip clicks',
  country: 'Visits by country',
  device: 'Visits by device',
} as const;
export type Metric = keyof typeof METRICS;
export type StatEvent = { m: Metric; k: string };

// Metrics whose key must be a catalogue film id.
export const FILM_METRICS: readonly Metric[] = ['view', 'save', 'watched', 'trailer', 'netflix', 'youtube', 'share', 'surprise'];
export const MAX_EVENTS = 30;
// The rules accept at most this many added to one document in one write.
export const MAX_STEP = 20;

const KEY = /^[a-z0-9._|-]{1,80}$/;
// Doc ids can't hold "/", so paths keep their shape with "|"; everything else outside the key alphabet goes.
export function statKey(raw: string) {
  return raw.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\//g, '|').replace(/\s+/g, '-')
    .replace(/[^a-z0-9._|-]/g, '').replace(/-{2,}/g, '-').slice(0, 80);
}
export const isMetric = (m: unknown): m is Metric => typeof m === 'string' && Object.hasOwn(METRICS, m);

// The site's own calendar day, so "today" matches the owner's day in Ireland.
export const statDay = (at: Date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
export const docId = (d: string, m: string, k: string) => `${d}~${m}~${k}`;

// Keeps only well-formed events (film metrics must name a real film) and folds repeats into one count per document.
export function foldEvents(events: unknown, films: ReadonlySet<string>, day: string) {
  const counts = new Map<string, { d: string; m: Metric; k: string; n: number }>();
  if (!Array.isArray(events)) return [];
  for (const e of events.slice(0, MAX_EVENTS)) {
    const m = (e as StatEvent | null)?.m, k = statKey(String((e as StatEvent | null)?.k ?? ''));
    if (!isMetric(m) || !KEY.test(k) || (FILM_METRICS.includes(m) && !films.has(k))) continue;
    const id = docId(day, m, k), hit = counts.get(id);
    if (hit) hit.n = Math.min(MAX_STEP, hit.n + 1); else counts.set(id, { d: day, m, k, n: 1 });
  }
  return [...counts.values()];
}

// Crawlers and preview fetchers that run scripts; they shouldn't count as visitors.
export const isBot = (ua: string) => !ua || /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|python|curl|wget/i.test(ua);

export type StatDoc = { d: string; m: string; k: string; n: number };
export type Summary = {
  days: string[];
  totals: Partial<Record<Metric, number>>;
  daily: Partial<Record<Metric, number[]>>;
  top: Partial<Record<Metric, { k: string; n: number }[]>>;
  first: string | null;
};
// Every day from `from` to `to` inclusive (YYYY-MM-DD), for charts with no gaps.
export function dayRange(from: string, to: string) {
  const out: string[] = [];
  for (let t = Date.parse(`${from}T12:00:00Z`), end = Date.parse(`${to}T12:00:00Z`); t <= end; t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}
export function summarise(docs: StatDoc[], from: string, to: string): Summary {
  const days = dayRange(from, to), index = new Map(days.map((d, i) => [d, i]));
  const totals: Summary['totals'] = {}, daily: Summary['daily'] = {}, byKey: Partial<Record<Metric, Map<string, number>>> = {};
  let first: string | null = null;
  for (const doc of docs) {
    if (!isMetric(doc.m) || typeof doc.n !== 'number') continue;
    if (!first || doc.d < first) first = doc.d;
    const i = index.get(doc.d);
    if (i === undefined) continue;
    totals[doc.m] = (totals[doc.m] ?? 0) + doc.n;
    (daily[doc.m] ??= days.map(() => 0))[i]! += doc.n;
    const keys = (byKey[doc.m] ??= new Map());
    keys.set(doc.k, (keys.get(doc.k) ?? 0) + doc.n);
  }
  const top: Summary['top'] = {};
  for (const [m, keys] of Object.entries(byKey) as [Metric, Map<string, number>][]) top[m] = [...keys].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n || a.k.localeCompare(b.k));
  return { days, totals, daily, top, first };
}

// Kit subscribers folded into daily counts and totals; the dashboard never receives anyone's address.
export type KitSubscriber = { state?: string | undefined; created_at?: string | undefined; fields?: Record<string, unknown> | null | undefined };
export function summariseKit(subs: KitSubscriber[]) {
  const byDay: Record<string, number> = {}, byState: Record<string, number> = {}, bySource: Record<string, number> = {};
  for (const s of subs) {
    const state = s.state ?? 'unknown';
    byState[state] = (byState[state] ?? 0) + 1;
    if (s.created_at) { const d = statDay(new Date(s.created_at)); byDay[d] = (byDay[d] ?? 0) + 1; }
    const source = typeof s.fields?.['source'] === 'string' && s.fields['source'] ? String(s.fields['source']) : 'unknown';
    if (state === 'active') bySource[source] = (bySource[source] ?? 0) + 1;
  }
  return { total: subs.length, active: byState['active'] ?? 0, byDay, byState, bySource };
}
