import { FILMS, type Film } from '@/data/films';
import { fallbackEnrichment, movieCandidates, normalizeDirector, normalizeTitle, parseIrishProviders, selectTrailer, validImdbId, type Enrichment, type MovieCandidate } from './discovery';

type Details = {
  id: number; title?: string; original_title?: string; release_date?: string;
  genres?: { id: number }[]; poster_path?: string; overview?: string; runtime?: number; vote_average?: number; vote_count?: number;
  credits?: { crew?: { job: string; name: string }[] };
  videos?: Parameters<typeof selectTrailer>[0];
  images?: { backdrops?: { file_path: string }[] };
  'watch/providers'?: Parameters<typeof parseIrishProviders>[0];
  external_ids?: { imdb_id?: string };
};
export type TmdbAuth = { token?: string | undefined; apiKey?: string | undefined };
type Entry = { expires: number; value: Promise<Enrichment> };
const cache = new Map<string, Entry>();
const verifiedIds = new Map<string, number>();

function image(path: string | undefined, size: string) {
  return path && /^\/[a-zA-Z0-9._-]+$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}
async function request<T>(path: string, auth: TmdbAuth, query: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  if (!auth.token && auth.apiKey) url.searchParams.set('api_key', auth.apiKey);
  const response = await fetch(url, { headers: auth.token ? { Authorization: `Bearer ${auth.token}`, Accept: 'application/json' } : { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  // Never log URLs, upstream bodies, or errors: they may echo credentials.
  if (!response.ok) throw new Error('TMDB request unavailable');
  return await response.json() as T;
}
function validDetails(film: Film, details: Details) {
  const directors = details.credits?.crew?.filter(c => c.job === 'Director').map(c => normalizeDirector(film, c.name)) ?? [];
  // Festival premieres and distribution releases can differ by one year; title, genre and every director must still match.
  return details.id > 0 && Math.abs(Number(details.release_date?.slice(0, 4)) - film.year) <= 1 && details.genres?.some(g => g.id === 99) &&
    [details.title, details.original_title].some(t => t && normalizeTitle(t) === normalizeTitle(film.title)) &&
    film.director.split(', ').every(name => directors.includes(normalizeDirector(film, name)));
}
async function enrich(film: Film, auth: TmdbAuth): Promise<Enrichment> {
  try {
    const cachedId = verifiedIds.get(film.id);
    const getDetails = (id: number) => request<Details>(`movie/${id}`, auth, { append_to_response: 'credits,videos,images,watch/providers,external_ids', language: 'en-US', include_image_language: 'en,null' });
    let details: Details | undefined;
    if (cachedId) { const candidate = await getDetails(cachedId); if (candidate.id === cachedId && validDetails(film, candidate)) details = candidate; }
    else {
      const search = await request<{ results: MovieCandidate[] }>('search/movie', auth, { query: film.title, include_adult: 'false' });
      const candidates = movieCandidates(film, Array.isArray(search.results) ? search.results : []);
      if (candidates.length > 4) return fallbackEnrichment('not-found');
      const verified: Details[] = [];
      for (const candidate of candidates) {
        const found = await getDetails(candidate.id);
        if (found.id === candidate.id && validDetails(film, found)) verified.push(found);
      }
      if (verified.length === 1) details = verified[0];
    }
    if (!details) { verifiedIds.delete(film.id); return fallbackEnrichment('not-found'); }
    verifiedIds.set(film.id, details.id);
    return {
      status: 'ready', tmdbId: details.id, imdbId: validImdbId(details.external_ids?.imdb_id) ? details.external_ids.imdb_id : undefined,
      poster: image(details.poster_path, 'w500'), overview: details.overview?.trim() || undefined,
      runtime: details.runtime && details.runtime > 0 ? details.runtime : undefined,
      rating: (details.vote_count ?? 0) > 0 && Number.isFinite(details.vote_average) ? details.vote_average : undefined, votes: details.vote_count,
      trailer: selectTrailer(details.videos),
      backdrops: [...new Set((details.images?.backdrops ?? []).map(b => image(b.file_path, 'w1280')).filter((p): p is string => Boolean(p)))].slice(0, 4),
      providers: parseIrishProviders(details['watch/providers']),
    };
  } catch { return fallbackEnrichment('unavailable'); }
}
export async function getCatalogueEnrichment(auth: TmdbAuth): Promise<Record<string, Enrichment>> {
  if (!auth.token && !auth.apiKey) return Object.fromEntries(FILMS.map(f => [f.id, fallbackEnrichment('missing-secret')]));
  const result: Record<string, Enrichment> = {};
  let cursor = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < FILMS.length) {
      const film = FILMS[cursor++];
      if (!film) break;
      let entry = cache.get(film.id);
      if (!entry || entry.expires <= Date.now()) {
        const value = enrich(film, auth);
        entry = { expires: Date.now() + 60_000, value };
        cache.set(film.id, entry);
        void value.then(data => { const current = cache.get(film.id); if (current?.value === value) current.expires = Date.now() + (data.status === 'ready' ? 6 * 60 * 60_000 : 60_000); });
      }
      result[film.id] = await entry.value;
    }
  }));
  return result;
}