import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './catalogue';
import { CATEGORIES } from './films';
import { MOODS, makerIndex, matchesFacets } from './discovery-facets';
const cat = (id: string) => CATALOGUE.find(f => f.id === id)?.categories;
describe('17-category restructure', () => {
  it('uses the 17 categories in the requested order', () => {
    expect(CATEGORIES.map(c => c.label)).toEqual(['Strange', 'Cults & Psychology', 'Scams', 'Tech', 'Crime', 'Politics', 'War', 'Adventure', 'Sport', 'Nature', 'Science', 'Economics', 'Art', 'Music', 'Life Stories', 'Drugs', 'Sex']);
  });
  it('every title has exactly one valid category and none is empty', () => {
    for (const f of CATALOGUE) { expect(f.categories).toHaveLength(1); expect(CATEGORIES.some(c => c.id === f.categories[0])).toBe(true); }
    for (const c of CATEGORIES) expect(CATALOGUE.some(f => f.categories[0] === c.id)).toBe(true);
  });
  it('applies the brief moves', () => {
    expect(cat('mariupol')).toEqual(['war']); expect(cat('senna')).toEqual(['sport']); expect(cat('apollo-11')).toEqual(['science']);
    expect(cat('stories-we-tell')).toEqual(['life']); expect(cat('amy')).toEqual(['music']); expect(cat('fantastic-fungi')).toEqual(['nature']);
    expect(cat('quiet-on-set-the-dark-side-of-kids-tv')).toEqual(['crime']); expect(cat('kink')).toEqual(['sex']); expect(cat('cocaine-cowboys')).toEqual(['drugs']);
  });
  it('credits Louis Theroux as presenter and lists him as a maker', () => {
    expect(CATALOGUE.find(f => f.id === 'louis-and-the-brothel')?.presenter).toBe('Louis Theroux');
    expect(CATALOGUE.find(f => f.id === 'louis-and-the-brothel')?.director).toBe("Geoffrey O'Connor");
    expect(makerIndex().find(m => m.name === 'Louis Theroux')?.films).toHaveLength(6);
  });
  it('has seven moods, each with titles', () => {
    expect(MOODS).toHaveLength(7);
    for (const m of MOODS) expect(CATALOGUE.some(f => matchesFacets(f, { award: '', mood: m.id, pick: '', maker: '' }))).toBe(true);
  });
});
