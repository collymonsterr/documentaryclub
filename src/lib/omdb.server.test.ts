import { afterEach, describe, expect, it, vi } from 'vitest';
import { FILMS } from '@/data/films';
import { matchesOmdb, parseOmdb } from './discovery';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.resetModules(); });
const film = FILMS[0];
if (!film) throw new Error('Missing catalogue fixture');
const fixture = { Response: 'True', imdbID: 'tt1234567', Type: 'movie', Title: film.title, Year: String(film.year), Genre: 'Documentary', Director: film.director, imdbRating: '7.8', Ratings: [{ Source: 'Rotten Tomatoes', Value: '95%' }], Awards: 'Festival award.' };
describe('OMDb identity and parsing', () => {
  it('returns valid IMDb/Rotten Tomatoes scores and sourced awards', () => {
    expect(parseOmdb(fixture)).toEqual({ imdb: 7.8, rottenTomatoes: 95, awards: 'Festival award.' });
  });
  it('keeps missing, N/A and invalid values absent', () => {
    expect(parseOmdb({ imdbRating: 'N/A', Ratings: [{ Source: 'Rotten Tomatoes', Value: '101%' }], Awards: 'N/A' })).toEqual({ imdb: undefined, rottenTomatoes: undefined, awards: undefined });
    expect(parseOmdb({ imdbRating: '11' }).imdb).toBeUndefined();
  });
  it('requires the verified IMDb identity and never silently falls back from a mismatched ID', () => {
    expect(matchesOmdb(film, fixture, 'tt1234567')).toBe(true);
    expect(matchesOmdb(film, fixture, 'tt7654321')).toBe(false);
  });
  it('requires exact title/year/documentary and every director for title fallback', () => {
    expect(matchesOmdb(film, fixture)).toBe(true);
    for (const change of [{ Title: 'Different' }, { Year: String(film.year - 1) }, { Genre: 'Drama' }, { Director: 'Different' }]) expect(matchesOmdb(film, { ...fixture, ...change })).toBe(false);
  });
});
describe('OMDb bounded server cache', () => {
  it('deduplicates requests and expires successful metadata after seven days over HTTPS', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(async (input: URL) => {
      expect(input.protocol).toBe('https:');
      expect(input.hostname).toBe('www.omdbapi.com');
      expect(input.searchParams.get('i')).toBe('tt1234567');
      return Response.json(fixture);
    });
    vi.stubGlobal('fetch', fetcher);
    const { getOmdbEnrichment, OMDB_CACHE_MS } = await import('./omdb.server');
    expect(OMDB_CACHE_MS).toBe(604800000);
    const [a, b] = await Promise.all([getOmdbEnrichment(film, 'synthetic-fixture', 'tt1234567'), getOmdbEnrichment(film, 'synthetic-fixture', 'tt1234567')]);
    expect(a).toEqual(b); expect(a?.imdb).toBe(7.8); expect(fetcher).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(OMDB_CACHE_MS - 1);
    await getOmdbEnrichment(film, 'synthetic-fixture', 'tt1234567'); expect(fetcher).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2);
    await getOmdbEnrichment(film, 'synthetic-fixture', 'tt1234567'); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('makes no call without credentials and hides provider errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('upstream diagnostic'));
    vi.stubGlobal('fetch', fetcher);
    const { getOmdbEnrichment } = await import('./omdb.server');
    expect(await getOmdbEnrichment(film)).toBeUndefined(); expect(fetcher).not.toHaveBeenCalled();
    expect(await getOmdbEnrichment(film, 'synthetic-fixture')).toBeUndefined();
  });
  it('limits simultaneous requests to three', async () => {
    let active = 0, peak = 0;
    vi.stubGlobal('fetch', vi.fn(async () => { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 5)); active--; return Response.json({ Response: 'False' }); }));
    const { getOmdbEnrichment } = await import('./omdb.server');
    await Promise.all(FILMS.map(f => getOmdbEnrichment(f, 'synthetic-fixture')));
    expect(peak).toBe(3);
  });
});