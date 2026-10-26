import { afterEach, describe, expect, it, vi } from 'vitest';
import { FILMS } from '@/data/films';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
describe('TMDB graceful enrichment', () => {
  it('returns all curated IDs without a secret and makes no requests', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch',fetcher);
    const { getCatalogueEnrichment } = await import('./tmdb.server');
    const result = await getCatalogueEnrichment({});
    expect(Object.keys(result)).toEqual(FILMS.map(f => f.id));
    expect(result['ibelin']?.status).toBe('missing-secret'); expect(fetcher).not.toHaveBeenCalled();
  });
  it('handles authentication and network failures without exposing upstream details', async () => {
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('upstream diagnostic', {status:401})));
    const { getCatalogueEnrichment } = await import('./tmdb.server');
    const result = await getCatalogueEnrichment({token:'synthetic-test-fixture'});
    expect(Object.values(result).every(value => value.status === 'unavailable')).toBe(true);
    expect(JSON.stringify(result)).not.toContain('upstream diagnostic');
  });
  it('deduplicates and caches matching films while rejecting wrong directors', async () => {
    const fetcher = vi.fn(async (input: URL) => {
      const url = new URL(input);
      const film = url.pathname.endsWith('search/movie') ? FILMS.find(f => f.title === url.searchParams.get('query')) : FILMS[Number(url.pathname.split('/').at(-1)) - 1];
      if (!film) return new Response('{}');
      const id = FILMS.indexOf(film) + 1;
      if (url.pathname.endsWith('search/movie')) return Response.json({results:[{id,title:film.title,release_date:`${film.year}-01-01`,genre_ids:[99]}]});
      return Response.json({id,title:film.title,release_date:`${film.year}-01-01`,genres:[{id:99}],credits:{crew:film.director.split(', ').map(name => ({job:'Director',name:film.id === 'mission' ? 'Wrong director' : name}))},overview:'A verified overview. Another meaningful sentence.',runtime:90,vote_average:7.4,vote_count:20,poster_path:'/poster.jpg',images:{backdrops:[{file_path:'/scene.jpg'}]},'watch/providers':{results:{IE:{flatrate:[{provider_id:8,provider_name:'Netflix'}]}}}});
    });
    vi.stubGlobal('fetch',fetcher);
    const { getCatalogueEnrichment } = await import('./tmdb.server');
    const [a,b] = await Promise.all([getCatalogueEnrichment({token:'synthetic-test-fixture'}),getCatalogueEnrichment({token:'synthetic-test-fixture'})]);
    expect(a).toEqual(b); expect(a['beyond-utopia']?.status).toBe('ready'); expect(a['mission']?.status).toBe('not-found');
    expect(a['ibelin']?.providers.flatrate[0]?.name).toBe('Netflix');
    expect(fetcher).toHaveBeenCalledTimes(34);
    await getCatalogueEnrichment({token:'synthetic-test-fixture'}); expect(fetcher).toHaveBeenCalledTimes(34);
  });
});
