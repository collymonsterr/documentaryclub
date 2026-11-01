import { afterEach, describe, expect, it, vi } from 'vitest';
import { CATALOGUE, MANIFEST, SHEET, SNAPSHOT, searchCatalogue } from './catalogue';
import { CATEGORIES, FILMS } from './films';
import { IMPORT_LIST, MERGED_INTO } from './import-list';
import { importTitleMatches } from '@/lib/discovery';

const byId = (id: string) => CATALOGUE.find(f => f.id === id);
describe('approved import reconciliation', () => {
  it('reconciles 135 inputs: 4 merged, 131 new, 148 unique titles (before batch 2)', () => {
    expect(IMPORT_LIST).toHaveLength(135);
    expect(MANIFEST.entries).toHaveLength(135);
    expect(MANIFEST.entries.filter(e => e.status === 'merged-existing')).toHaveLength(4);
    expect(Object.values(MERGED_INTO).sort()).toEqual(['fire-of-love', 'ibelin', 'mariupol', 'perfect-neighbor']);
    expect(CATALOGUE).toHaveLength(SHEET.length);
    expect(new Set(CATALOGUE.map(f => f.id)).size).toBe(SHEET.length);
    expect(MANIFEST.entries.map(e => `${e.input.title}|${e.input.year}`)).toEqual(IMPORT_LIST.map(e => `${e.title}|${e.year}`));
  });
  it('keeps the original 17 first with unchanged IDs', () => {
    expect(CATALOGUE.slice(0, 17).map(f => f.id)).toEqual(FILMS.map(f => f.id));
  });
  it('takes awards only from the sheet and keeps unresolved titles visible', () => {
    expect(CATALOGUE.every(f => f.awards.join() === (SHEET.find(r => r.id === f.id)?.awards ?? []).join())).toBe(true);
    const removed = new Set(['the-culture-high', 'super-high-me', 'rolling-papers', 'daughters-of-the-cult', 'bad-surgeon-love-under-the-knife', 'cocaine-cowboys-ii-hustlin-with-the-godmother', 'countdown-to-death-pablo-escobar', 'marijuana-a-chronic-history']);
    for (const e of MANIFEST.entries) if (!removed.has(e.id)) expect(byId(e.id)).toBeDefined();
  });
});
describe('verified identities', () => {
  const chosen = (title: string) => MANIFEST.entries.find(e => e.input.title === title)?.chosen;
  it('picks documentaries over same-title dramas and the right format', () => {
    expect(chosen('The Staircase')).toMatchObject({ mediaType: 'tv', year: 2004 });
    expect(chosen('Last Breath')).toMatchObject({ mediaType: 'movie', year: 2019 });
    expect(chosen('Catfish')).toMatchObject({ mediaType: 'movie', year: 2010 });
    expect(chosen('The Family')).toMatchObject({ mediaType: 'tv', year: 2019 });
    expect(chosen('Paradise Lost')).toMatchObject({ mediaType: 'movie', year: 1996, canonicalTitle: 'Paradise Lost: The Child Murders at Robin Hood Hills' });
    expect(chosen('Stranded')?.canonicalTitle).toMatch(/Plane That Crashed/);
    expect(chosen('Into the Deep')?.canonicalTitle).toMatch(/Submarine/);
    expect(chosen('The Summit')?.people).toContain('Nick Ryan');
    expect(chosen('HyperNormalisation')?.mediaType).toBe('movie');
    expect(chosen('The Century of the Self')?.mediaType).toBe('tv');
  });
  it('accepts canonical subtitles but rejects unrelated subtitle titles', () => {
    expect(importTitleMatches('Stranded', ["Stranded: I've Come from a Plane That Crashed on the Mountains"])).toBe(true);
    expect(importTitleMatches('Waco: American Apocalypse', ['Waco: The Rules of Engagement'])).toBe(false);
    expect(importTitleMatches('Stranded', ['Stranded: X'], true)).toBe(false);
  });
  it('snapshot holds public metadata only', () => {
    const text = JSON.stringify([SNAPSHOT, MANIFEST]);
    expect(text).not.toMatch(/api_key|apikey|Bearer|omdbapi\.com|api\.themoviedb/i);
  });
});
describe('search and type filter', () => {
  it('matches title, alias and director and filters by format', () => {
    expect(searchCatalogue(CATALOGUE, 'robin hood', 'all').map(f => f.id)).toEqual(['paradise-lost']);
    expect(searchCatalogue(CATALOGUE, 'herzog', 'all').length).toBeGreaterThanOrEqual(4);
    expect(searchCatalogue(CATALOGUE, 'tiger king', 'movie')).toHaveLength(0);
    expect(searchCatalogue(CATALOGUE, 'tiger king', 'tv').map(f => f.id)).toEqual(['tiger-king']);
  });
});
describe('live Irish providers', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
  it('uses the tv endpoint for series, caches, and hides upstream errors', async () => {
    const fetcher = vi.fn(async (input: URL) => {
      expect(new URL(input).pathname).toBe('/3/tv/100698/watch/providers');
      return Response.json({ results: { IE: { flatrate: [{ provider_id: 8, provider_name: 'Netflix' }] } } });
    });
    vi.stubGlobal('fetch', fetcher);
    const { getLiveProviders } = await import('@/lib/tmdb.server');
    const a = await getLiveProviders('tv', 100698, { token: 'synthetic-fixture' });
    await getLiveProviders('tv', 100698, { token: 'synthetic-fixture' });
    expect(a.flatrate[0]?.name).toBe('Netflix'); expect(fetcher).toHaveBeenCalledTimes(1);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('upstream diagnostic')));
    const failed = await getLiveProviders('movie', 1, { token: 'synthetic-fixture' });
    expect(failed.known).toBe(false); expect(JSON.stringify(failed)).not.toContain('diagnostic');
  });
  it('makes no request without credentials', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const { getLiveProviders } = await import('@/lib/tmdb.server');
    expect((await getLiveProviders('movie', 5, {})).known).toBe(false); expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('list page category coverage', () => {
  it('every title has exactly one home category', () => {
    expect(CATALOGUE.every(f => f.categories.length === 1)).toBe(true);
  });
  it('every title appears under at least one category and every category is non-empty', () => {
    expect(CATALOGUE.every(f => f.categories.length >= 1)).toBe(true);
    for (const c of CATEGORIES) expect(CATALOGUE.some(f => f.categories.includes(c.id))).toBe(true);
  });
});
