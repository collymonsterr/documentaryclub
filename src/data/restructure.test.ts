import { describe, expect, it } from 'vitest';
import { CATALOGUE, SHEET } from './catalogue';
import { CATEGORIES } from './films';
import { EDITORIAL, MOODS, matchesFacets } from './discovery-facets';
const film = (id: string) => CATALOGUE.find(f => f.id === id);
describe('catalogue sheet import', () => {
  it('uses the 17 categories (no Strange) and every title has exactly one', () => {
    expect(new Set(CATEGORIES.map(c => c.label))).toEqual(new Set(['Adventure', 'Art', 'Crime', 'Cults & Psychology', 'Drugs', 'Economics', 'Food', 'Life Stories', 'Music', 'Nature', 'Politics', 'Science', 'Scams', 'Sex', 'Sport', 'Tech', 'War']));
    for (const f of CATALOGUE) { expect(f.categories).toHaveLength(1); expect(CATEGORIES.some(c => c.id === f.categories[0])).toBe(true); }
  });
  it('shows exactly the live master rows and drops the 8 removed ones', () => {
    expect(CATALOGUE.map(f => f.id).sort()).toEqual(SHEET.map(r => r.id).sort());
    for (const id of ['super-high-me', 'the-culture-high', 'rolling-papers', 'daughters-of-the-cult']) expect(film(id)).toBeUndefined();
    expect(film('the-last-dance')?.mediaType).toBe('tv');
    expect(film('somm')?.tags).toEqual(expect.arrayContaining(['wine', 'editors-choice']));
  });
  it('applies sheet category and director to existing titles by id', () => {
    for (const r of SHEET) {
      expect(CATEGORIES.find(c => c.id === film(r.id)?.categories[0])?.label).toBe(r.category);
      if (r.director) expect(film(r.id)?.director).toBe(r.director);
    }
  });
  it('uses the eight sheet moods, each with titles', () => {
    expect(MOODS.map(m => m.label)).toEqual(['Funny', 'Feel-good', 'Gripping', 'Harrowing', 'Infuriating', 'Mind-blowing', 'Breathtaking', 'Gloriously weird']);
    for (const m of MOODS) expect(CATALOGUE.some(f => matchesFacets(f, { award: '', mood: m.id, pick: '', maker: '' }))).toBe(true);
    for (const r of SHEET) expect(EDITORIAL[r.id]?.moods.length ?? 0).toBe(r.moods?.length ?? 0);
  });
});
