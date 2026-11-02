import availability from './netflix-availability.json';

// The "Best documentaries on Netflix" page. Titles come from netflix-availability.json, a dated snapshot written by
// `npm run netflix-availability`, so the page never fetches providers at runtime. Netflix catalogues change: rerun it monthly.
// One page, not one per country: Netflix's documentaries are nearly all its own Originals, so the country lists came out
// almost identical and would compete with each other in search.
export const NETFLIX_COUNTRIES = [
  { code: 'IE', name: 'Ireland' },
  { code: 'GB', name: 'UK' },
  { code: 'US', name: 'US' },
] as const;
// The pick search param carries the page; the old per-country slugs still lead to it.
export const NETFLIX_PICK = 'netflix';
export const OLD_NETFLIX_SLUGS = ['ireland', 'uk', 'us'];
const saved = availability as Record<string, string[] | string | undefined>;
export const NETFLIX_CHECKED = typeof saved['checked'] === 'string' ? saved['checked'] : '';
export const onNetflixIn = (code: string, id: string) => (saved[code] as string[] | undefined)?.includes(id) === true;
export const onNetflix = (id: string) => NETFLIX_COUNTRIES.some(c => onNetflixIn(c.code, id));
