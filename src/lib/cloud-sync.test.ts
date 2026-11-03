import { describe, expect, it } from 'vitest';
import { fromDoc, mergeFirst, sameLists } from './cloud-sync';

describe('account sync', () => {
  it('keeps everything from both devices on first sign-in', () => {
    const merged = mergeFirst({ shortlist: ['a', 'b'], watched: ['c'] }, { shortlist: ['b', 'd'], watched: ['e'] });
    expect(merged.shortlist.sort()).toEqual(['a', 'b', 'd']);
    expect(merged.watched.sort()).toEqual(['c', 'e']);
  });
  it('drops a film from Saved when either side has watched it', () => {
    expect(mergeFirst({ shortlist: ['a'], watched: [] }, { shortlist: [], watched: ['a'] })).toEqual({ shortlist: [], watched: ['a'] });
  });
  it('ignores junk in the stored record', () => {
    expect(fromDoc({ shortlist: ['a', 3, 'a'], watched: 'x' })).toEqual({ shortlist: ['a'], watched: [] });
    expect(fromDoc(undefined)).toEqual({ shortlist: [], watched: [] });
  });
  it('compares lists regardless of order', () => {
    expect(sameLists({ shortlist: ['a', 'b'], watched: [] }, { shortlist: ['b', 'a'], watched: [] })).toBe(true);
    expect(sameLists({ shortlist: ['a'], watched: [] }, { shortlist: [], watched: ['a'] })).toBe(false);
  });
});
