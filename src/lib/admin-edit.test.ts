import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../scripts/catalogue-csv';
import { applyEdit, trailerId } from './admin-edit';

const csv = readFileSync('data/catalogue-master.csv', 'utf8');
const row = (text: string, id: string) => parseCsv(text).find((r) => r.id === id)!;
const pj = row(csv, 'pulling-john');
const base = { id: 'pulling-john', category: pj.category, tags: pj.tags.split(', ').filter(Boolean), moods: pj.mood.split(', ').filter(Boolean), trailer: pj.trailer };

describe('admin edits', () => {
  it('reads trailer ids from links', () => {
    expect(trailerId('https://www.youtube.com/watch?v=wz8I8uR6Pto&t=3')).toBe('wz8I8uR6Pto');
    expect(trailerId('https://youtu.be/wz8I8uR6Pto')).toBe('wz8I8uR6Pto');
    expect(trailerId('wz8I8uR6Pto')).toBe('wz8I8uR6Pto');
    expect(trailerId('')).toBe('');
    expect(trailerId('https://vimeo.com/123')).toBeNull();
  });
  it('toggles a tag and touches nothing else', () => {
    const r = applyEdit(csv, { ...base, tags: base.tags.filter((t) => t !== 'editors-choice') });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(row(r.csv, 'pulling-john').tags).not.toContain('editors-choice');
    expect(r.csv.split('\r\n').filter((l, i) => l !== csv.split('\r\n')[i])).toHaveLength(1);
    expect(r.sheet).toContain('"id":"pulling-john"');
  });
  it('refuses unknown tags, categories, moods and films', () => {
    expect(applyEdit(csv, { ...base, tags: ['made-up'] }).ok).toBe(false);
    expect(applyEdit(csv, { ...base, category: 'Nope' }).ok).toBe(false);
    expect(applyEdit(csv, { ...base, moods: ['Sleepy'] }).ok).toBe(false);
    expect(applyEdit(csv, { ...base, id: 'not-a-film' }).ok).toBe(false);
    expect(applyEdit(csv, base).ok).toBe(false);
  });
  it('keeps free-on-youtube as the CSV has it', () => {
    const id = 'jiro-dreams-of-sushi', j = row(csv, id);
    const r = applyEdit(csv, { id, category: j.category, tags: [], moods: j.mood.split(', '), trailer: '' });
    expect(r.ok && row(r.csv, id).tags).toBe('free-on-youtube');
  });
});
