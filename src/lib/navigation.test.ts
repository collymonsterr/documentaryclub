import { describe, expect, it } from 'vitest';
import { gallerySelection } from './discovery';

describe('Spotlight discovery navigation', () => {
  it('opens the selected category in Gallery even when the film is outside that category', () => {
    expect(gallerySelection({ film: 'man-on-wire', cat: 'sex', mood: '', award: '' }, { cat: 'war' }))
      .toEqual({ film: '', cat: 'war', mood: '', award: '' });
  });
  it('returns to Gallery when reselecting the active Spotlight category', () => {
    expect(gallerySelection({ film: 'man-on-wire', cat: 'sex' }, { cat: 'sex' }))
      .toEqual({ film: '', cat: 'sex' });
  });
  it('preserves conjunctive filters when choosing a discovery chip', () => {
    expect(gallerySelection({ film: 'mariupol', cat: 'war', award: 'oscar-win', mood: '' }, { mood: 'harrowing' }))
      .toEqual({ film: '', cat: 'war', award: 'oscar-win', mood: 'harrowing' });
  });
});