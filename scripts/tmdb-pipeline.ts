// Shared TMDB/OMDb lookup used by the import and catalogue sync scripts. Reads credentials from the env,
// returns ONLY public normalized metadata. Never prints URLs, credentials or upstream bodies.
import { EXPECTED_PEOPLE, MEDIA_HINTS, SEARCH_ALIASES } from '../src/data/import-list';
import { importTitleMatches, parseOmdb, selectTrailer, validImdbId, type OmdbResponse } from '../src/lib/discovery';

export type Media = 'movie' | 'tv';
export async function tmdb<T>(path: string, query: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  const token = process.env['TMDB_READ_ACCESS_TOKEN'];
  if (!token) throw new Error('TMDB credential missing');
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (r.ok) return await r.json() as T;
    await new Promise(res => setTimeout(res, 800));
  }
  throw new Error('TMDB unavailable');
}
export const img = (p: string | undefined, size: string) => p && /^\/[\w.-]+$/.test(p) ? `https://image.tmdb.org/t/p/${size}${p}` : undefined;
type Cand = { id: number; media: Media; title: string; alt?: string; year: number; genre_ids?: number[] };
export type Detail = Record<string, any>;

export async function omdb(imdbId: string | undefined, media: Media) {
  const omdbKey = process.env['OMDB_API_KEY'];
  if (!omdbKey || !validImdbId(imdbId)) return undefined;
  const url = new URL('https://www.omdbapi.com/');
  url.searchParams.set('apikey', omdbKey); url.searchParams.set('i', imdbId);
  try {
    const r = await fetch(url); if (!r.ok) return undefined;
    const d = await r.json() as OmdbResponse;
    return d.Response === 'True' && d.imdbID === imdbId && d.Type === (media === 'tv' ? 'series' : 'movie') ? parseOmdb(d) : undefined;
  } catch { return undefined; }
}
export function summarize(media: Media, d: Detail) {
  const people: string[] = media === 'movie'
    ? (d.credits?.crew ?? []).filter((c: any) => c.job === 'Director').map((c: any) => c.name)
    : (d.created_by ?? []).map((c: any) => c.name);
  return {
    mediaType: media, tmdbId: d.id as number, imdbId: validImdbId(d.external_ids?.imdb_id) ? d.external_ids.imdb_id as string : undefined,
    canonicalTitle: (media === 'movie' ? d.title : d.name) as string, people: [...new Set(people)],
    runtime: media === 'movie' ? (d.runtime > 0 ? d.runtime : undefined) : (d.episode_run_time?.[0] > 0 ? d.episode_run_time[0] : undefined),
    episodes: media === 'tv' && d.number_of_episodes > 0 ? d.number_of_episodes as number : undefined,
    poster: img(d.poster_path, 'w500'), overview: (d.overview as string | undefined)?.trim() || undefined,
    trailer: selectTrailer(d.videos),
    backdrops: [...new Set<string>((d.images?.backdrops ?? []).map((b: any) => img(b.file_path, 'w1280')).filter(Boolean))].slice(0, 3),
    tmdbRating: d.vote_count > 0 ? Math.round(d.vote_average * 10) / 10 : undefined, votes: d.vote_count > 0 ? d.vote_count : undefined,
  };
}
export const details = (media: Media, id: number) => tmdb<Detail>(`${media}/${id}`, { append_to_response: 'credits,videos,images,external_ids', language: 'en-US', include_image_language: 'en,null' });

// `media` restricts matching to one format; `aliases` adds approved alternate titles for this lookup only.
export async function resolve(title: string, year: number, credited: string[] = [], { media: only, aliases = [] }: { media?: Media; aliases?: string[] } = {}) {
  const key = `${title}|${year}`;
  const alternates = [...(SEARCH_ALIASES[key] ?? []), ...aliases];
  const queries = [...new Set([title, title.split(':')[0]!.trim(), ...alternates])];
  const found = new Map<string, Cand>();
  for (const q of queries) for (const media of (only ? [only] : ['movie', 'tv']) as Media[]) {
    const res = await tmdb<{ results?: any[] }>(`search/${media}`, { query: q, include_adult: 'false' });
    for (const r of res.results ?? []) {
      const c: Cand = { id: r.id, media, title: media === 'movie' ? r.title : r.name, alt: media === 'movie' ? r.original_title : r.original_name, year: Number((media === 'movie' ? r.release_date : r.first_air_date)?.slice(0, 4)), genre_ids: r.genre_ids };
      if (c.genre_ids?.includes(99) && Math.abs(c.year - year) <= 1 && (importTitleMatches(title, [c.title, c.alt]) || alternates.some(a => importTitleMatches(a, [c.title, c.alt], true)))) found.set(`${media}:${c.id}`, c);
    }
  }
  const verified: { c: Cand; d: Detail; exact: boolean }[] = [];
  for (const c of [...found.values()].slice(0, 8)) {
    const d = await details(c.media, c.id);
    if (d.id === c.id && (d.genres ?? []).some((g: any) => g.id === 99)) verified.push({ c, d, exact: importTitleMatches(title, [c.title, c.alt], true) });
  }
  let pick = verified, reason = 'unique verified documentary match';
  const person = EXPECTED_PEOPLE[key];
  if (person) { pick = pick.filter(v => summarize(v.c.media, v.d).people.includes(person)); reason = `verified credited filmmaker ${person}`; }
  const norm = (n: string) => n.toLowerCase().normalize('NFKD').replace(/[^a-z]/g, '');
  if (credited.length && pick.length > 1) { const p2 = pick.filter(v => summarize(v.c.media, v.d).people.some(n => credited.map(norm).includes(norm(n)))); if (p2.length) { pick = p2; reason = 'verified credited filmmaker from sheet'; } }
  const hint = MEDIA_HINTS[key];
  if (pick.length > 1 && hint && pick.filter(v => v.c.media === hint).length === 1) { pick = pick.filter(v => v.c.media === hint); reason = `approved ${hint === 'tv' ? 'series' : 'film'} format among verified candidates`; }
  if (pick.length > 1 && pick.filter(v => v.exact).length === 1) { pick = pick.filter(v => v.exact); reason = 'only exact-title documentary among verified candidates'; }
  if (pick.length > 1 && pick.filter(v => v.c.year === year).length === 1) { pick = pick.filter(v => v.c.year === year); reason = 'only exact-year documentary among verified candidates'; }
  const candidates = verified.map(v => ({ mediaType: v.c.media, tmdbId: v.c.id, title: v.c.title, year: v.c.year }));
  if (pick.length !== 1) return { status: verified.length ? 'pending-ambiguous' : 'pending-not-found', reason: verified.length ? 'multiple verified documentary candidates' : 'no documentary candidate with matching title and year ±1', candidates };
  const v = pick[0]!;
  const meta = summarize(v.c.media, v.d);
  return { status: 'resolved', reason, candidates, year: v.c.year, meta: { ...meta, omdb: await omdb(meta.imdbId, v.c.media) } };
}
