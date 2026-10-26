import type { Film } from '@/data/films';
import { matchesOmdb, parseOmdb, validImdbId, type OmdbMetadata, type OmdbResponse } from './discovery';

export const OMDB_CACHE_MS = 7 * 24 * 60 * 60_000;
type Entry = { expires: number; value: Promise<OmdbMetadata | undefined> };
const cache = new Map<string, Entry>();
let active = 0;
const waiting: (() => void)[] = [];
async function limited<T>(run: () => Promise<T>): Promise<T> {
  if (active >= 3) await new Promise<void>(resolve => waiting.push(resolve));
  else active++;
  try { return await run(); } finally {
    const next = waiting.shift();
    if (next) next(); else active--;
  }
}
export async function getOmdbEnrichment(film: Film, apiKey?: string, imdbId?: string): Promise<OmdbMetadata | undefined> {
  if (!apiKey || (imdbId !== undefined && !validImdbId(imdbId))) return undefined;
  const key = `${film.id}:${imdbId ?? 'title-year'}`;
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.value;
  const value = limited(async () => {
    try {
      const url = new URL('https://www.omdbapi.com/');
      url.searchParams.set('apikey', apiKey);
      if (imdbId) url.searchParams.set('i', imdbId);
      else { url.searchParams.set('t', film.title); url.searchParams.set('y', String(film.year)); }
      url.searchParams.set('type', 'movie');
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return undefined;
      const data = await response.json() as OmdbResponse;
      return matchesOmdb(film, data, imdbId) ? parseOmdb(data) : undefined;
    } catch { return undefined; } // Upstream errors can contain credentials: never log or return them.
  });
  const entry = { expires: Date.now() + OMDB_CACHE_MS, value };
  if (cache.size >= 34 && !cache.has(key)) { const oldest = cache.keys().next().value; if (oldest) cache.delete(oldest); }
  cache.set(key, entry);
  void value.then(result => { if (!result && cache.get(key) === entry) entry.expires = Date.now() + 60_000; });
  return value;
}