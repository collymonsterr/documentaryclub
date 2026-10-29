import { describe, expect, it } from 'vitest';
import { BATCH3_RAW } from './import-batch3';
import { CATALOGUE, MANIFEST3 } from './catalogue';
import { CATEGORIES } from './films';

const entry = (title: string) => MANIFEST3.entries.find(e => e.input.title === title);
describe('third batch (Sex & Drugs) reconciliation', () => {
  it('counts 56 inputs: 1 existing (Fantastic Fungi), 53 resolved, 2 pending', () => {
    expect(BATCH3_RAW).toHaveLength(56);
    expect(MANIFEST3.entries).toHaveLength(56);
    const n = (s: string) => MANIFEST3.entries.filter(e => e.status === s).length;
    expect(n('existing-match')).toBe(1);
    expect(n('resolved')).toBe(53);
    expect(n('pending-not-found')).toBe(2);
    expect(CATALOGUE).toHaveLength(361);
    expect(new Set(CATALOGUE.map(f => f.id)).size).toBe(361);
  });
  it('keeps a single Fantastic Fungi, now in Nature', () => {
    expect(entry('Fantastic Fungi')?.status).toBe('existing-match');
    const fungi = CATALOGUE.filter(f => f.id === 'fantastic-fungi');
    expect(fungi).toHaveLength(1);
    expect(fungi[0]?.categories).toEqual(['nature']);
  });
  it('every imported batch-3 title lives in Drugs or Sex (Amy moves to Music)', () => {
    const ids = MANIFEST3.entries.filter(e => e.status === 'resolved' || e.status.startsWith('pending')).map(e => e.id);
    for (const id of ids) expect(['drugs', 'sex', 'music']).toContain(CATALOGUE.find(f => f.id === id)?.categories[0]);
  });
  it('resolves evidence-pinned identities and series formats', () => {
    expect(entry("Cocaine Cowboys II: Hustlin' with the Godmother")?.chosen).toMatchObject({ tmdbId: 26769, canonicalTitle: 'Cocaine Cowboys 2' });
    expect(entry('Countdown to Death: Pablo Escobar')?.chosen?.canonicalTitle).toBe('Pablo Escobar: Countdown to Death');
    expect(entry('The Last Narc')?.chosen?.mediaType).toBe('tv');
    expect(entry('How to Change Your Mind')?.chosen?.mediaType).toBe('tv');
    expect(entry("Hamilton's Pharmacopeia")?.chosen?.mediaType).toBe('tv');
  });
  it('keeps titles with no database record visible as pending', () => {
    expect(entry('Guys and Dolls')?.status).toBe('pending-not-found');
    expect(entry('Love Me')?.status).toBe('pending-not-found');
    expect(CATALOGUE.find(f => f.id === 'guys-and-dolls')?.pending).toBe(true);
    expect(CATALOGUE.find(f => f.id === 'love-me')?.pending).toBe(true);
  });
  it('splits the former Sex & Drugs titles into Drugs and Sex', () => {
    expect(CATEGORIES.some(c => c.id === 'drugs') && CATEGORIES.some(c => c.id === 'sex')).toBe(true);
    expect(CATALOGUE.filter(f => f.categories[0] === 'drugs' || f.categories[0] === 'sex').length).toBe(54);
  });
});
