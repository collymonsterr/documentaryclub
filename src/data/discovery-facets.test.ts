import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './catalogue';
import { EDITORIAL, accolades, topAwards, discoveryShelves, makerIndex, matchesFacets, formatCommitment, moreFromDirector, moreLikeThis, rankFilms, seededRandom, wonAward, youtubePlaysIn } from './discovery-facets';
const film = (id: string) => { const f = CATALOGUE.find(f => f.id === id); if (!f) throw new Error(id); return f; };
describe('evidence-led discovery', () => {
  it('distinguishes Academy wins from nominations', () => {
    expect(accolades(film('mariupol')).some(a => a.body === 'oscar' && a.result === 'Won')).toBe(true);
    expect(accolades(film('fire-of-love')).some(a => a.body === 'oscar' && a.result === 'Nominated')).toBe(true);
    expect(accolades(film('fire-of-love')).some(a => a.body === 'oscar' && a.result === 'Won')).toBe(false);
  });
  it('orders wins by prestige, then nominations, and caps cards at three bodies', () => {
    const f = { ...film('skywalkers'), awards: ['Oscar Nominee – Best Documentary Feature 2020', 'Sundance Grand Jury Prize 2019', 'Sundance Audience Award 2019', "Cannes L'Œil d'or 2019", 'BAFTA Winner – Best Documentary 2020', 'Some Regional Prize 2019'] };
    expect(accolades(f).map(a => a.label)).toEqual(['BAFTA Winner – Best Documentary 2020', "Cannes L'Œil d'or 2019", 'Sundance Grand Jury Prize 2019', 'Sundance Audience Award 2019', 'Some Regional Prize 2019', 'Oscar Nominee – Best Documentary Feature 2020']);
    expect(topAwards(f).map(a => a.body)).toEqual(['bafta', 'cannes', 'sundance']);
  });
  it("shows only the CSV's dated labels, never IMDb's award summary", () => {
    expect(accolades({ ...film('skywalkers'), awards: [] })).toEqual([]);
    expect(CATALOGUE.flatMap(accolades).every(a => /\b\d{4}$/.test(a.label))).toBe(true);
  });
  it('drops the BAFTAs IMDb credited to the wrong category', () => {
    for (const id of ['man-on-wire', 'the-imposter', 'touching-the-void']) expect(accolades(film(id)).some(a => a.body === 'bafta')).toBe(false);
  });
  it('combines mood, pick, award and maker with AND', () => {
    expect(matchesFacets(film('pez-outlaw'), { award: '', mood: 'funny', pick: '', maker: '' })).toBe(true);
    expect(matchesFacets(film('pez-outlaw'), { award: 'oscar', mood: 'funny', pick: '', maker: '' })).toBe(false);
    expect(matchesFacets(film('free-solo'), { award: '', mood: 'gripping', pick: '', maker: 'Jimmy Chin' })).toBe(true);
    expect(matchesFacets(film('free-solo'), { award: '', mood: 'gripping', pick: '', maker: 'Werner Herzog' })).toBe(false);
  });
  it('hides shelves with fewer than three titles', () => {
    expect(discoveryShelves([film('pez-outlaw'), film('winnebago-man')])).toEqual([]);
    expect(discoveryShelves([film('pez-outlaw'), film('winnebago-man'), film('best-worst-movie')]).find(s => s.id === 'funny')?.films).toHaveLength(3);
  });
  it('great makers have at least three unique titles', () => {
    const jimmy = makerIndex().find(m => m.name === 'Jimmy Chin');
    expect(jimmy?.films).toHaveLength(4);
    expect(matchesFacets(film('free-solo'), { award: '', mood: '', pick: 'makers', maker: '' })).toBe(true);
  });
  it('editorial tags refer only to actual catalogue IDs', () => {
    for (const id of Object.keys(EDITORIAL)) expect(CATALOGUE.some(f => f.id === id)).toBe(true);
  });
  it('shows film runtime and series commitment without treating collections as films', () => {
    expect(formatCommitment(film('free-solo'), 100)).toBe('1h 40m');
    expect(formatCommitment({ ...film('free-solo'), mediaType: 'tv', episodes: 6 }, 45)).toBe('Series · 6 episodes · 45 min / ep');
    expect(formatCommitment({ ...film('free-solo'), mediaType: 'collection', parts: ['One', 'Two', 'Three'] })).toBe('3 films');
  });
  it('fills the film page rows: the director first, then shared tags, never repeating a title', () => {
    const grizzly = film('grizzly-man'), director = moreFromDirector(grizzly);
    expect(director?.name).toBe('Werner Herzog');
    expect(director?.films.some(f => f.id === 'grizzly-man')).toBe(false);
    const shown = new Set(director?.films.map(f => f.id));
    const like = moreLikeThis(grizzly, shown, () => 0.5);
    expect(like).toHaveLength(8);
    expect(like.some(f => f.id === 'grizzly-man' || shown.has(f.id))).toBe(false);
    const sharesTopic = (f: typeof grizzly) => f.categories.some(c => grizzly.categories.includes(c)) || (f.tags ?? []).some(t => grizzly.tags?.includes(t));
    expect(like.every(sharesTopic)).toBe(true);
    expect(moreFromDirector({ ...grizzly, director: 'Nobody Else' })).toBeUndefined();
  });
});

describe('ranked lists and stable related titles', () => {
  it('puts Editor\'s Choice ahead of an unrated title and is repeatable', () => {
    const pick = CATALOGUE.find(f => f.tags?.includes('editors-choice'))!, plain = CATALOGUE.find(f => !f.tags?.length && f.id !== pick.id)!;
    expect(rankFilms([plain, pick])[0]).toBe(pick);
    expect(rankFilms(CATALOGUE).map(f => f.id)).toEqual(rankFilms([...CATALOGUE].reverse()).map(f => f.id));
  });
  it('gives the same "More like this" for the same film on every render', () => {
    const f = film('grizzly-man');
    expect(moreLikeThis(f, new Set(), seededRandom(f.id)).map(x => x.id)).toEqual(moreLikeThis(f, new Set(), seededRandom(f.id)).map(x => x.id));
  });
});

describe('Free on YouTube page', () => {
  it('hides a link only where we know it is blocked', () => {
    expect(youtubePlaysIn({ youtubeRegions: ['US'] }, 'IE')).toBe(false);
    expect(youtubePlaysIn({ youtubeRegions: ['US'] }, 'US')).toBe(true);
    expect(youtubePlaysIn({}, 'GB')).toBe(true);
    expect(youtubePlaysIn({ youtubeRegions: ['US'] }, 'DE')).toBe(true);
  });
  it('counts wins, not nominations, as award winners', () => {
    expect(CATALOGUE.filter(wonAward).every(f => accolades(f).some(a => a.result === 'Won'))).toBe(true);
    expect(CATALOGUE.some(f => accolades(f).length > 0 && !wonAward(f))).toBe(true);
  });
});
