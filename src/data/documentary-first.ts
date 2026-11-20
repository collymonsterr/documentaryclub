import type { Film } from './films';
import snapshot from './documentary-first.json';

// Documentary First guest picks (/documentary-first, pick=documentary-first). Christian Taylor's podcast asks every guest for a
// documentary pick; their DocuView Deja View page lists them. The agreed swap: we list the guests' picks that are in our catalogue,
// credit each one on its film page with a tracked link to that guest's pick, and they link back with ?ref=documentaryfirst.
// Picks come from their published sheet through `npm run documentary-first`, a dated snapshot like the streaming pages, so page
// loads never fetch it. Only Status "Pick" rows count, and never the hosts' own picks.
export const DF_ID = 'documentary-first';
export const DF_NAME = 'Documentary First';
export const DF_SITE = 'https://documentaryfirst.com';
export const DF_PICKS_PAGE = `${DF_SITE}/pages/docuview-deja-view`;
export const DF_SHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7W6nHyRujbKm4g-Uin-KaiI7kbY2OxJbjPH4M8p6qStxWPZ9jxXVOUJNfnQDlDF0Yb-vlByPHnRxT/pub?gid=0&single=true&output=csv';
export const DF_HOSTS = ['Christian', 'Christian Taylor', 'Jason Rugg', 'Josh Lindsay'];

export type DfPick = { film: string; title: string; guest: string; episode?: number; aired?: string };
const saved = snapshot as { checked?: string; picks?: DfPick[] };
export const DF_CHECKED = saved.checked ?? '';
export const DF_PICKS: DfPick[] = saved.picks ?? [];
const byFilm = new Map<string, DfPick[]>();
for (const p of DF_PICKS) byFilm.set(p.film, [...(byFilm.get(p.film) ?? []), p]);
export const dfPicksFor = (filmId: string) => byFilm.get(filmId) ?? [];
export const isDfPick = (filmId: string) => byFilm.has(filmId);

// Spaces as %20, as in their own example link (URLSearchParams would write +, which not every page decodes).
// Their page finds the pick from the title (forgiving about case, punctuation and years) and shows the named guest first.
export const dfLink = (pick: Pick<DfPick, 'title' | 'guest'>) =>
  `${DF_PICKS_PAGE}?q=${encodeURIComponent(pick.title)}&by=${encodeURIComponent(pick.guest)}&utm_source=documentaryclub&utm_medium=referral`;

// Matching their titles to ours: same title once case, punctuation, a leading "The/A/An" and any bracketed year or subtitle are
// ignored, or the same title before a ":" subtitle on either side; the year within one when they give one; and only one candidate.
const bare = (t: string) => t.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/&/g, ' and ').trim().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]/g, '');
const head = (t: string) => bare(t.split(':')[0] ?? t);
export function matchPick(title: string, year: number | undefined, films: Film[]): Film | undefined {
  const names = (f: Film) => [f.title, ...(f.aliases ?? [])];
  const near = (f: Film) => !year || Math.abs(f.year - year) <= 1;
  const exact = films.filter(f => near(f) && names(f).some(n => bare(n) === bare(title)));
  if (exact.length) return exact.length === 1 ? exact[0] : undefined;
  const loose = films.filter(f => near(f) && names(f).some(n => head(n) === bare(title) || bare(n) === head(title)));
  return loose.length === 1 ? loose[0] : undefined;
}
