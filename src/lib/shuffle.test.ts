import { describe, expect, it } from 'vitest';
import { orderFilms, shuffleIds } from './discovery';
import { CATALOGUE } from '@/data/catalogue';
const seeded = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
describe('gallery shuffle', () => {
  const ids = CATALOGUE.map(f => f.id);
  it('keeps every catalogue ID exactly once', () => { const o = shuffleIds(ids, seeded(7)); expect(o).toHaveLength(610); expect(new Set(o).size).toBe(610); });
  it('is deterministic for an injected RNG and differs between seeds', () => { expect(shuffleIds(ids, seeded(3))).toEqual(shuffleIds(ids, seeded(3))); expect(shuffleIds(ids, seeded(3))).not.toEqual(shuffleIds(ids, seeded(4))); });
  it('filtering preserves the shuffled relative order (stable prev/next)', () => {
    const o = shuffleIds(ids, seeded(9)); const ordered = orderFilms(CATALOGUE, o);
    const filtered = ordered.filter(f => f.year < 2000).map(f => f.id);
    expect(filtered).toEqual(o.filter(id => filtered.includes(id)));
  });
  it('explicit year sort overrides random order', () => {
    const r = [...orderFilms(CATALOGUE, shuffleIds(ids, seeded(5)))].sort((a, b) => a.year - b.year);
    expect(r[0]!.year).toBe(Math.min(...CATALOGUE.map(f => f.year)));
  });
});
import { searchCatalogue } from '@/data/catalogue';
describe('collections', () => {
  it('Up series appears under the Series filter and search', () => {
    expect(searchCatalogue(CATALOGUE, 'up', 'tv').some(f => f.mediaType === 'collection')).toBe(true);
    expect(searchCatalogue(CATALOGUE, '', 'movie').some(f => f.mediaType === 'collection')).toBe(false);
  });
});
