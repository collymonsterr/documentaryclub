import { describe, expect, it } from 'vitest';
import { BATCH2_RAW } from './import-batch2';
import { CATALOGUE, MANIFEST2, searchCatalogue } from './catalogue';
import { FILMS } from './films';
import { inEra } from '@/lib/discovery';

const entry = (title: string, source = 'attachment') => MANIFEST2.entries.find(e => e.input.title === title && e.input.source === source);
describe('second batch reconciliation', () => {
  it('counts 290 attachment + 52 inline inputs: 48 in-batch duplicates, 136 existing, 158 new', () => {
    expect(BATCH2_RAW.filter(r => r.source === 'attachment')).toHaveLength(290);
    expect(BATCH2_RAW.filter(r => r.source === 'inline')).toHaveLength(52);
    expect(MANIFEST2.entries).toHaveLength(342);
    const n = (s: string) => MANIFEST2.entries.filter(e => e.status === s).length;
    expect(n('duplicate-in-batch')).toBe(48);
    expect(n('existing-match') + n('existing-match-verified')).toBe(136);
    expect(n('resolved') + MANIFEST2.entries.filter(e => e.status.startsWith('pending')).length).toBe(158);
    expect(CATALOGUE).toHaveLength(487);
  });
  it('merges alternate titles, escaped punctuation and differing years into existing IDs', () => {
    expect(entry('McMillions', 'inline')?.id).toBe('mcmillions');
    expect(CATALOGUE.filter(f => f.id === 'mcmillions')).toHaveLength(1);
    expect(entry('Love Has Won: The Cult of Mother God', 'inline')?.id).toBe('love-has-won');
    expect(entry('Going Clear: Scientology and the Prison of Belief', 'inline')?.id).toBe('going-clear');
    expect(entry('The King of Kong: A Fistful of Quarters', 'inline')?.id).toBe('the-king-of-kong');
    expect(entry("Don't F**k with Cats")?.status).toBe('existing-match');
    expect(entry('Abducted in Plain Sight', 'inline')?.status).toMatch(/duplicate|existing/);
    expect(CATALOGUE.filter(f => /abducted in plain sight/i.test(f.title))).toHaveLength(1);
  });
  it('keeps the original 17 first with unchanged IDs and awards (categories follow the restructure)', () => {
    expect(CATALOGUE.slice(0, 17).map(f => [f.id, f.awards])).toEqual(FILMS.map(f => [f.id, f.awards]));
  });
  it('represents Up as one British documentary collection, not Pixar Up', () => {
    const up = CATALOGUE.find(f => f.id === 'up-series');
    expect(up).toMatchObject({ mediaType: 'collection', year: 1964, yearEnd: 2019 });
    expect(up?.parts).toHaveLength(9);
    expect(up?.parts).not.toContain('70 Up');
  });
  it('resolves evidence-pinned identities', () => {
    expect(entry('The Push')?.chosen).toMatchObject({ tmdbId: 377319, canonicalTitle: 'Derren Brown: Pushed to the Edge' });
    expect(entry('The Endurance')?.chosen).toMatchObject({ tmdbId: 947763, year: 2024 });
    expect(entry('The Puppet Master: Hunting the Ultimate Conman')?.chosen).toMatchObject({ mediaType: 'tv', year: 2022 });
  });
  it('Before 2000 includes 1999 and excludes 2000', () => {
    expect(inEra(1999, 'pre2000')).toBe(true);
    expect(inEra(2000, 'pre2000')).toBe(false);
    const pre = CATALOGUE.filter(f => inEra(f.year, 'pre2000'));
    expect(pre.some(f => f.id === 'kon-tiki')).toBe(true);
    expect(pre.some(f => f.id === 'dark-days')).toBe(false);
  });
  it('tags arts titles and counts collection as series in type filter', () => {
    expect(searchCatalogue(CATALOGUE, 'up series', 'tv').map(f => f.id)).toContain('up-series');
  });
});
