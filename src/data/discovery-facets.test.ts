import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './catalogue';
import { EDITORIAL, accolades, discoveryShelves, makerIndex, matchesFacets, formatCommitment } from './discovery-facets';
const film = (id: string) => { const f = CATALOGUE.find(f => f.id === id); if (!f) throw new Error(id); return f; };
describe('evidence-led discovery', () => {
  it('distinguishes Academy wins from nominations', () => {
    expect(accolades(film('mariupol')).some(a => a.facet === 'oscar-win')).toBe(true);
    expect(accolades(film('fire-of-love')).some(a => a.facet === 'oscar-nominee')).toBe(true);
    expect(accolades(film('fire-of-love')).some(a => a.facet === 'oscar-win')).toBe(false);
  });
  it('never turns unnamed aggregate counts into festival awards', () => {
    expect(accolades({ ...film('skywalkers'), awards: [] }, '1 win & 3 nominations')).toEqual([]);
    expect(accolades({ ...film('skywalkers'), awards: [] }, 'Nominated for 1 Oscar. 5 wins total')[0]?.label).toBe('Academy Award nominee');
  });
  it('combines mood, pick, award and maker with AND', () => {
    expect(matchesFacets(film('pez-outlaw'), { award: '', mood: 'funny', pick: '', maker: '' })).toBe(true);
    expect(matchesFacets(film('pez-outlaw'), { award: 'oscar-win', mood: 'funny', pick: '', maker: '' })).toBe(false);
    expect(matchesFacets(film('free-solo'), { award: '', mood: 'gripping', pick: '', maker: 'Jimmy Chin' })).toBe(true);
    expect(matchesFacets(film('free-solo'), { award: '', mood: 'gripping', pick: '', maker: 'Werner Herzog' })).toBe(false);
  });
  it('hides shelves with fewer than three titles', () => {
    expect(discoveryShelves([film('pez-outlaw'), film('winnebago-man')])).toEqual([]);
    expect(discoveryShelves([film('pez-outlaw'), film('winnebago-man'), film('best-worst-movie')]).find(s => s.id === 'funny')?.films).toHaveLength(3);
  });
  it('great makers have at least three unique titles', () => {
    const jimmy = makerIndex().find(m => m.name === 'Jimmy Chin');
    expect(jimmy?.films).toHaveLength(4);
    expect(matchesFacets(film('free-solo'), { award: '', mood: '', pick: 'makers', maker: '' })).toBe(true);
  });
  it('editorial tags refer only to actual catalogue IDs', () => {
    for (const id of Object.keys(EDITORIAL)) expect(CATALOGUE.some(f => f.id === id)).toBe(true);
  });
  it('shows film runtime and series commitment without treating collections as films', () => {
    expect(formatCommitment(film('free-solo'), 100)).toBe('1h 40m');
    expect(formatCommitment({ ...film('free-solo'), mediaType: 'tv', episodes: 6 }, 45)).toBe('Series · 6 episodes · 45 min / ep');
    expect(formatCommitment({ ...film('free-solo'), mediaType: 'collection', parts: ['One', 'Two', 'Three'] })).toBe('3 films');
  });
});