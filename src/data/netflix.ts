import availability from './netflix-availability.json';

// "Best documentaries on Netflix" pages, one per country. Titles come from netflix-availability.json, a dated snapshot
// written by `npm run netflix-availability`, so the pages never fetch providers at runtime. Netflix catalogues change: rerun it monthly.
export const NETFLIX_COUNTRIES = [
  { code: 'IE', slug: 'ireland', name: 'Ireland', in: 'in Ireland' },
  { code: 'GB', slug: 'uk', name: 'UK', in: 'in the UK' },
  { code: 'US', slug: 'us', name: 'US', in: 'in the US' },
] as const;
// The pick search param carries the page, e.g. pick=netflix-ie.
export const netflixPick = (code: string) => `netflix-${code.toLowerCase()}`;
export const netflixCountry = (pick?: string) => NETFLIX_COUNTRIES.find(c => netflixPick(c.code) === pick);
const saved = availability as Record<string, string[] | string | undefined>;
export const NETFLIX_CHECKED = typeof saved['checked'] === 'string' ? saved['checked'] : '';
export const onNetflixIn = (code: string, id: string) => (saved[code] as string[] | undefined)?.includes(id) === true;
