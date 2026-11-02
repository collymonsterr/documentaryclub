import availability from './streaming-availability.json';

// "Best documentaries on Netflix / Prime Video / …" pages. Titles come from streaming-availability.json, a dated snapshot written by
// `npm run streaming-availability` (TMDB's JustWatch data), so the pages never fetch providers at runtime. Catalogues change: rerun it monthly.
// One page per service, not per country: Netflix's lists came out near-identical across countries and would compete in search.
export const STREAMING_COUNTRIES = ['IE', 'GB', 'US'] as const;
// match is tested against TMDB provider names; it leaves out add-on channels sold through a service ("HBO Max Amazon Channel").
export const SERVICES = [
  { id: 'netflix', name: 'Netflix', match: /^netflix/i, where: 'in Ireland, the UK or the US' },
  { id: 'prime-video', name: 'Prime Video', match: /^amazon prime video/i, where: 'in Ireland, the UK or the US' },
  { id: 'disney-plus', name: 'Disney+', match: /^disney plus/i, where: 'in Ireland, the UK or the US' },
  { id: 'bbc-iplayer', name: 'BBC iPlayer', match: /^bbc iplayer/i, where: 'in the UK' },
  { id: 'hbo-max', name: 'HBO Max', match: /^(hbo )?max$/i, where: 'in Ireland, the UK or the US' },
] as const;
export type ServiceId = (typeof SERVICES)[number]['id'];
// The pick search param carries the page (pick=prime-video); Netflix's old per-country slugs still lead to /netflix.
export const service = (pick?: string) => SERVICES.find(s => s.id === pick);
export const OLD_NETFLIX_SLUGS = ['ireland', 'uk', 'us'];
const saved = availability as { checked?: string; services?: Record<string, Record<string, string[]>> };
export const STREAMING_CHECKED = saved.checked ?? '';
export const streamsOn = (id: ServiceId, film: string) => STREAMING_COUNTRIES.some(c => saved.services?.[id]?.[c]?.includes(film) === true);
