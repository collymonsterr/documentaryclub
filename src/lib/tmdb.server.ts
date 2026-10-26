import { FILMS, type Film } from '@/data/films';
import { fallbackEnrichment, matchMovie, normalizeTitle, parseIrishProviders, selectTrailer, type Enrichment, type MovieCandidate } from './discovery';

type Details = {
  id: number; title?: string; original_title?: string; release_date?: string;
  genres?: { id: number }[]; poster_path?: string; overview?: string; runtime?: number; vote_average?: number; vote_count?: number;
  credits?: { crew?: { job: string; name: string }[] };
  videos?: Parameters<typeof selectTrailer>[0];
  images?: { backdrops?: { file_path: string }[] };
  'watch/providers'?: Parameters<typeof parseIrishProviders>[0];
};
export type TmdbAuth = { token?: string; apiKey?: string };
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
  const directors = details.credits?.crew?.filter(c => c.job === 'Director').map(c => normalizeTitle(c.name)) ?? [];
  return details.id > 0 && Number(details.release_date?.slice(0, 4)) === film.year && details.genres?.some(g => g.id === 99) &&
    [details.title, details.original_title].some(t => t && normalizeTitle(t) === normalizeTitle(film.title)) &&
    film.director.split(', ').every(name => directors.includes(normalizeTitle(name)));
}
async function enrich(film: Film, auth: TmdbAuth): Promise<Enrichment> {
  try {
    let id = verifiedIds.get(film.id);
    if (!id) {
      const search = await request<{ results: MovieCandidate[] }>('search/movie', auth, { query: film.title, primary_release_year: String(film.year), include_adult: 'false' });
      id = matchMovie(film, Array.isArray(search.results) ? search.results : [])?.id;
    }
    if (!id) return fallbackEnrichment('not-found');
    const details = await request<Details>(`movie/${id}`, auth, { append_to_response: 'credits,videos,images,watch/providers', language: 'en-US', include_image_language: 'en,null' });
    if (!validDetails(film, details)) return fallbackEnrichment('not-found');
    verifiedIds.set(film.id, id);
    return {
      status: 'ready', tmdbId: id, poster: image(details.poster_path, 'w500'), overview: details.overview?.trim() || undefined,
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