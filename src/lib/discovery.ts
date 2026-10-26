import type { Film } from '@/data/films';

export type Provider = { id: number; name: string; highlighted: boolean };
export type Enrichment = {
  status: 'ready' | 'missing-secret' | 'not-found' | 'unavailable';
  tmdbId?: number | undefined;
  poster?: string | undefined;
  overview?: string | undefined;
  runtime?: number | undefined;
  rating?: number | undefined;
  votes?: number | undefined;
  trailer?: string | undefined;
  backdrops: string[];
  providers: { known: boolean; link?: string | undefined; flatrate: Provider[]; rent: Provider[]; buy: Provider[] };
};
export const unknownProviders = () => ({ known: false, flatrate: [], rent: [], buy: [] });
export const fallbackEnrichment = (status: Enrichment['status']): Enrichment => ({ status, backdrops: [], providers: unknownProviders() });

export function normalizeTitle(title: string) {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
export type MovieCandidate = { id: number; title?: string; original_title?: string; release_date?: string; genre_ids?: number[] };
export function matchMovie(film: Film, results: MovieCandidate[]): MovieCandidate | undefined {
  const matches = results.filter(r => Number(r.release_date?.slice(0, 4)) === film.year && r.genre_ids?.includes(99) &&
    [r.title, r.original_title].some(title => title && normalizeTitle(title) === normalizeTitle(film.title)));
  return matches.length === 1 ? matches[0] : undefined;
}

type RawProvider = { provider_id: number; provider_name: string };
type Region = { link?: string; flatrate?: RawProvider[]; rent?: RawProvider[]; buy?: RawProvider[] };
export function parseIrishProviders(data?: { results?: Record<string, Region> }): Enrichment['providers'] {
  const region = data?.results?.['IE'];
  if (!region) return unknownProviders();
  const parse = (items?: RawProvider[]): Provider[] => [...new Map((items ?? []).filter(p => Number.isFinite(p.provider_id) && typeof p.provider_name === 'string').map(p => [p.provider_id, {
    id: p.provider_id, name: p.provider_name, highlighted: p.provider_id === 8 || p.provider_id === 9,
  }])).values()];
  const flatrate = parse(region.flatrate), rent = parse(region.rent), buy = parse(region.buy);
  return { known: flatrate.length + rent.length + buy.length > 0, link: region.link?.startsWith('https://www.themoviedb.org/') ? region.link : undefined, flatrate, rent, buy };
}

export function selectTrailer(videos?: { results?: { site: string; type: string; official?: boolean; key: string }[] }) {
  const video = videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official === true && /^[\w-]{11}$/.test(v.key));
  return video?.key;
}

export function filterYears(films: Film[], from: number | undefined, to: number | undefined, decade: string, sort: string) {
  const start = decade === 'all' ? undefined : Number(decade);
  const list = films.filter(f => (from === undefined || f.year >= from) && (to === undefined || f.year <= to) &&
    (start === undefined || (f.year >= start && f.year < start + 10)));
  return sort === 'curated' ? list : [...list].sort((a, b) => sort === 'oldest' ? a.year - b.year : b.year - a.year);
}

export function canNavigate(target: EventTarget | null, dialogOpen: boolean) {
  return !dialogOpen && !(target instanceof Element && (target.closest('input, select, textarea, [role="dialog"], [role="combobox"]') || target.closest('[contenteditable]:not([contenteditable="false"])')));
}

export const TRACKING_KEYS = { shortlist: 'dc-shortlist', watched: 'dc-watched' } as const;
export function readTracking(storage: Pick<Storage, 'getItem'>, key: string): Set<string> {
  try { const value: unknown = JSON.parse(storage.getItem(key) || '[]'); return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []); } catch { return new Set(); }
}
export function overviewSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+(?:[”"']|$)?|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) ?? [text];
  return sentences.slice(0, 4).join(' ');
}