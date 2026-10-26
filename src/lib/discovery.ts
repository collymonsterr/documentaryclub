import type { Film } from '@/data/films';

export type Provider = { id: number; name: string; highlighted: boolean };
export type Enrichment = {
  status: 'ready' | 'missing-secret' | 'not-found' | 'unavailable';
  tmdbId?: number | undefined;
  imdbId?: string | undefined;
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
// Import identity: exact normalized title, or a canonical title that only adds/removes a ":" subtitle (Stranded → Stranded: I've Come…).
export function importTitleMatches(submitted: string, candidates: (string | undefined)[], exactOnly = false) {
  const head = (t: string) => normalizeTitle(t.split(':')[0] ?? t);
  const s = normalizeTitle(submitted);
  return candidates.some(c => {
    if (!c) return false;
    const n = normalizeTitle(c);
    if (n === s) return true;
    return !exactOnly && (head(c) === s || head(submitted) === n);
  });
}
export function normalizeDirector(film: Film, name: string) {
  const normalized = normalizeTitle(name);
  // Film-specific credited-name equivalence verified against the filmmakers' credits:
  // https://www.sidestilt.com/the-pez-outlaw (Amy Bandlien Storkel & Bryan Storkel).
  return film.id === 'pez-outlaw' && normalized === 'amystorkel' ? 'amybandlienstorkel' : normalized;
}
export type MovieCandidate = { id: number; title?: string; original_title?: string; release_date?: string; genre_ids?: number[] };
export function movieCandidates(film: Film, results: MovieCandidate[]): MovieCandidate[] {
  return [...new Map(results.filter(r => Number.isInteger(r.id) && r.id > 0 && Math.abs(Number(r.release_date?.slice(0, 4)) - film.year) <= 1 && r.genre_ids?.includes(99) &&
    [r.title, r.original_title].some(title => title && normalizeTitle(title) === normalizeTitle(film.title))).map(r => [r.id, r])).values()];
}
export function matchMovie(film: Film, results: MovieCandidate[]): MovieCandidate | undefined {
  const matches = results.filter(r => Number(r.release_date?.slice(0, 4)) === film.year && r.genre_ids?.includes(99) &&
    [r.title, r.original_title].some(title => title && normalizeTitle(title) === normalizeTitle(film.title)));
  return matches.length === 1 ? matches[0] : undefined;
}

export type OmdbMetadata = { imdb?: number | undefined; rottenTomatoes?: number | undefined; awards?: string | undefined };
export type OmdbResponse = { Response?: string; imdbID?: string; Title?: string; Year?: string; Type?: string; Genre?: string; Director?: string; imdbRating?: string; Ratings?: { Source?: string; Value?: string }[]; Awards?: string };
export function validImdbId(value: unknown): value is string { return typeof value === 'string' && /^tt\d{7,10}$/.test(value); }
export function matchesOmdb(film: Film, data: OmdbResponse, imdbId?: string) {
  if (data.Response !== 'True' || !validImdbId(data.imdbID) || data.Type !== 'movie') return false;
  if (imdbId) return data.imdbID === imdbId;
  const directors = (data.Director ?? '').split(',').map(name => normalizeDirector(film, name.trim()));
  return normalizeTitle(data.Title ?? '') === normalizeTitle(film.title) && data.Year === String(film.year) &&
    (data.Genre ?? '').split(',').some(genre => genre.trim().toLowerCase() === 'documentary') &&
    film.director.split(', ').every(name => directors.includes(normalizeDirector(film, name)));
}
export function parseOmdb(data: OmdbResponse): OmdbMetadata {
  const imdb = /^\d+(?:\.\d+)?$/.test(data.imdbRating ?? '') ? Number(data.imdbRating) : undefined;
  const rt = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value;
  const rottenTomatoes = /^\d{1,3}%$/.test(rt ?? '') ? Number(rt?.slice(0, -1)) : undefined;
  const awards = data.Awards?.trim();
  return { imdb: imdb !== undefined && imdb >= 0 && imdb <= 10 ? imdb : undefined,
    rottenTomatoes: rottenTomatoes !== undefined && rottenTomatoes <= 100 ? rottenTomatoes : undefined,
    awards: awards && !/^(N\/A|none)$/i.test(awards) ? awards : undefined };
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

// Era quick collection: 'pre2000' is release year < 2000 (1999 in, 2000 out). Series use first release year.
export const inEra = (year: number, era: 'all' | 'pre2000') => era === 'all' || year < 2000;
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