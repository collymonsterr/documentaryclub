import { describe, expect, it } from 'vitest';
import { browseSelection, gallerySelection } from './discovery';

describe('Spotlight discovery navigation', () => {
  it('opens the selected category in Gallery even when the film is outside that category', () => {
    expect(gallerySelection({ film: 'man-on-wire', cat: 'sex', mood: '', award: '' }, { cat: 'war' }))
      .toEqual({ film: '', cat: 'war', mood: '', award: '' });
  });
  it('returns to Gallery when reselecting the active Spotlight category', () => {
    expect(gallerySelection({ film: 'man-on-wire', cat: 'sex' }, { cat: 'sex' }))
      .toEqual({ film: '', cat: 'sex' });
  });
  it('replaces the previous tab selection but keeps dropdown filters', () => {
    const current = { film: 'mariupol', q: 'x', list: '', cat: 'scams', award: '', mood: '', pick: '', maker: '', tag: '', like: '', soon: '', era: '2010s', browse: 'topics' };
    expect(browseSelection(current, { award: 'oscar-win', browse: 'awards' }))
      .toEqual({ film: '', q: '', list: '', cat: 'all', award: 'oscar-win', mood: '', pick: '', maker: '', tag: '', like: '', soon: '', era: '2010s', browse: 'awards' });
  });
  it('preserves conjunctive filters from the dropdown', () => {
    expect(gallerySelection({ film: 'mariupol', cat: 'war', award: 'oscar-win', mood: '' }, { mood: 'harrowing' }))
      .toEqual({ film: '', cat: 'war', award: 'oscar-win', mood: 'harrowing' });
  });
});