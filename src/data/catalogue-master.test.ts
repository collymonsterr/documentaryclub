import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { noteHints, parseCsv, serializeCsv, sheetJson, validate } from '../../scripts/catalogue-csv';
import { CATALOGUE } from './catalogue';
import { CATEGORIES } from './films';
import { MOODS, matchesFacets } from './discovery-facets';
import { TAGS, cardTags, orderedTags, tagLabel } from './tags';

const text = readFileSync('data/catalogue-master.csv', 'utf8'), rows = parseCsv(text);
const facets = { award: '', mood: '', pick: '', maker: '' };
describe('master CSV', () => {
  it('generates the site sheet (run npm run sync-catalogue after editing the CSV)', () => {
    expect(readFileSync('src/data/catalogue-sheet.json', 'utf8')).toBe(sheetJson(rows));
  });
  it('round-trips byte for byte, including quoted commas', () => {
    expect(serializeCsv(rows)).toBe(text);
    expect(parseCsv('id,title,year,type,category,tags,mood,director,tmdb_id,imdb_id,status,notes\nx,"A, ""B""",2000,Film,Crime,"a, b",,,,,new,\n')[0]).toMatchObject({ title: 'A, "B"', tags: 'a, b' });
  });
  it('only uses approved tags, moods and categories', () => {
    expect(validate(rows, { tags: TAGS.map(t => t.id), moods: MOODS.map(m => m.label), categories: CATEGORIES.map(c => c.label) })).toEqual([]);
    expect(validate([{ ...rows[0]!, tags: 'made-up' }], { tags: [], moods: MOODS.map(m => m.label), categories: CATEGORIES.map(c => c.label) })).toEqual([`${rows[0]!.title}: unknown tag "made-up"`]);
  });
  it('applies editorial fields and tags from the CSV', () => {
    for (const r of rows.filter(r => r.status === 'live')) {
      const f = CATALOGUE.find(c => c.id === r.id);
      expect([f?.title, String(f?.year), String(f?.tmdbId ?? ''), f?.imdbId ?? '']).toEqual([r.title, r.year, r.tmdb_id, r.imdb_id]);
    }
  });
  it('reads import instructions from notes', () => {
    expect(noteHints('Also titled "1: Life on the Limit"').aliases).toEqual(['1: Life on the Limit']);
    expect(noteHints('check runtime, drop if under 60 min').minRuntime).toBe(60);
    expect(noteHints('Use 2013 restored version if TMDB lists both').preferYear).toBe(2013);
  });
});
describe('tags', () => {
  it('filters the catalogue by tag', () => {
    expect(CATALOGUE.filter(f => matchesFacets(f, { ...facets, tag: 'wine' })).map(f => f.id)).toContain('somm');
    expect(matchesFacets(CATALOGUE[0]!, { ...facets, tag: '' })).toBe(true);
  });
  it("puts Editor's Choice first and limits cards to two", () => {
    expect(cardTags(['ocean', 'essential', 'wine', 'editors-choice'])).toEqual(['editors-choice', 'essential']);
    expect(orderedTags(['ocean', 'wine', 'editors-choice'])).toHaveLength(3);
  });
  it('ignores tags outside the approved list', () => {
    expect(orderedTags(['made-up', 'ocean'])).toEqual(['ocean']);
    expect(tagLabel('free-on-youtube')).toBe('Free on YouTube');
  });
});
