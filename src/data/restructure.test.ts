import { describe, expect, it } from 'vitest';
import { CATALOGUE, SHEET, sheetId } from './catalogue';
import { CATEGORIES } from './films';
import { EDITORIAL, MOODS, matchesFacets } from './discovery-facets';
const film = (id: string) => CATALOGUE.find(f => f.id === id);
describe('catalogue sheet import', () => {
  it('uses the 16 categories (no Strange) and every title has exactly one', () => {
    expect(new Set(CATEGORIES.map(c => c.label))).toEqual(new Set(['Adventure', 'Art', 'Crime', 'Cults & Psychology', 'Drugs', 'Economics', 'Life Stories', 'Music', 'Nature', 'Politics', 'Science', 'Scams', 'Sex', 'Sport', 'Tech', 'War']));
    for (const f of CATALOGUE) { expect(f.categories).toHaveLength(1); expect(CATEGORIES.some(c => c.id === f.categories[0])).toBe(true); }
  });
  it('has 353 existing + 97 new titles and drops the 8 removed ones', () => {
    expect(CATALOGUE).toHaveLength(450);
    for (const id of ['super-high-me', 'the-culture-high', 'rolling-papers', 'daughters-of-the-cult']) expect(film(id)).toBeUndefined();
    expect(film('the-last-dance')?.mediaType).toBe('tv');
    expect(film('somm')?.tags).toEqual(['food-and-drink']);
  });
  it('applies sheet category and director to existing titles by id', () => {
    for (const r of SHEET.filter(r => r.status === 'Existing')) {
      expect(CATEGORIES.find(c => c.id === film(r.id!)?.categories[0])?.label).toBe(r.category);
      if (r.director) expect(film(r.id!)?.director).toBe(r.director);
    }
  });
  it('uses the seven sheet moods, each with titles', () => {
    expect(MOODS.map(m => m.label)).toEqual(['Funny', 'Feel-good', 'Gripping', 'Harrowing', 'Infuriating', 'Mind-blowing', 'Gloriously weird']);
    for (const m of MOODS) expect(CATALOGUE.some(f => matchesFacets(f, { award: '', mood: m.id, pick: '', maker: '' }))).toBe(true);
    for (const r of SHEET.filter(r => r.status !== 'Remove')) expect(EDITORIAL[sheetId(r)]?.moods.length ?? 0).toBe(r.moods?.length ?? 0);
  });
});
