import { describe, expect, it } from 'vitest';
import { FILMS } from '@/data/films';
import { canNavigate, cardBadges, firstSentence, inEra, selectAnyTrailer, matchMovie, matchesOmdb, normalizeDirector, parseIrishProviders, readTracking, selectTrailer, selectYouTubeTrailer, sortByRating, TRACKING_KEYS } from './discovery';

describe('curated catalogue and tracking', () => {
  it('preserves all 17 stable IDs', () => {
    expect(FILMS.map(f => f.id)).toEqual(['beyond-utopia','fire-of-love','ibelin','skywalkers','mariupol','eternal-memory','territory','daughters','sugarcane','four-daughters','pez-outlaw','perfect-neighbor','contestant','mission','greatest-night','whakaari','fantastic-fungi']);
  });
  it('reads existing tracking arrays under their original keys', () => {
    expect(TRACKING_KEYS).toEqual({shortlist:'dc-shortlist',watched:'dc-watched'});
    localStorage.setItem('dc-shortlist', '["ibelin","mission"]');
    localStorage.setItem('dc-watched', '["daughters"]');
    expect([...readTracking(localStorage, TRACKING_KEYS.shortlist)]).toEqual(['ibelin','mission']);
    expect([...readTracking(localStorage, TRACKING_KEYS.watched)]).toEqual(['daughters']);
    localStorage.clear();
  });
});
describe('eras and rating sort', () => {
  it('pre-2000 includes 1999 and excludes 2000', () => { expect(inEra(1999, 'pre2000')).toBe(true); expect(inEra(2000, 'pre2000')).toBe(false); });
  it('recent covers the last two years and decades are inclusive', () => {
    expect(inEra(2025, 'recent', 2026)).toBe(true); expect(inEra(2024, 'recent', 2026)).toBe(true); expect(inEra(2023, 'recent', 2026)).toBe(false);
    expect(inEra(2010, '2010s')).toBe(true); expect(inEra(2019, '2010s')).toBe(true); expect(inEra(2020, '2010s')).toBe(false);
    expect(inEra(1999, '2000s')).toBe(false); expect(inEra(2019, 'all')).toBe(true);
  });
  it('sorts by rating with unrated titles last', () => {
    const snap = { a: { omdb: { imdb: 7.1 } }, b: { omdb: { imdb: 8.4 } }, c: {} };
    expect(sortByRating([{ id: 'a' }, { id: 'b' }, { id: 'c' }], snap, 'imdb').map(f => f.id)).toEqual(['b', 'a', 'c']);
  });
  it('firstSentence keeps only the opening sentence', () => {
    expect(firstSentence('One two. Three four. Five.')).toBe('One two.');
    expect(firstSentence('No terminator here')).toBe('No terminator here');
  });
  it('accepts only title-verified YouTube trailers', () => {
    const items = [
      { id: { videoId: 'abc12345678' }, snippet: { title: 'Time | Official Trailer | Prime Video' } },
      { id: { videoId: 'zzz99999999' }, snippet: { title: 'Time review - is it worth watching?' } },
      { id: { videoId: 'bad' }, snippet: { title: 'Time Official Trailer' } },
    ];
    expect(selectYouTubeTrailer('Time', [], items)).toBe('abc12345678');
    expect(selectYouTubeTrailer('Time', [], items.slice(1))).toBeUndefined();
    expect(selectYouTubeTrailer('Meru', [], items)).toBeUndefined();
  });
});
describe('safe TMDB selection', () => {
  it('recognizes the verified Pez Outlaw director credit without weakening other identities', () => {
    const pez = FILMS.find(f => f.id === 'pez-outlaw');
    const other = FILMS.find(f => f.id === 'mission');
    if (!pez || !other) throw Error('Missing fixture');
    expect(normalizeDirector(pez, 'Amy Storkel')).toBe(normalizeDirector(pez, 'Amy Bandlien Storkel'));
    expect(normalizeDirector(other, 'Amy Storkel')).not.toBe(normalizeDirector(other, 'Amy Bandlien Storkel'));
    const data = {Response:'True',imdbID:'tt17660740',Type:'movie',Title:pez.title,Year:'2022',Genre:'Documentary',Director:'Amy Bandlien Storkel, Bryan Storkel'};
    expect(matchesOmdb(pez, data)).toBe(true);
    expect(matchesOmdb(pez, {...data, Director:'Amy Bandlien Storkel, Wrong director'})).toBe(false);
  });
  const film = FILMS.find(f => f.id === 'mission');
  it('requires exact title, year and documentary identity', () => {
    if (!film) throw Error('Missing fixture');
    expect(matchMovie(film, [{ id: 1,title:'The Mission',release_date:'1986-01-01',genre_ids:[99] },{id:2,title:'The Mission',release_date:'2023-01-01',genre_ids:[18]},{id:3,title:'The Mission',release_date:'2023-01-01',genre_ids:[99]}])?.id).toBe(3);
  });
  it('rejects ambiguous exact matches', () => {
    if (!film) throw Error('Missing fixture');
    expect(matchMovie(film,[1,2].map(id => ({id,title:film.title,release_date:'2023-01-01',genre_ids:[99]})))).toBeUndefined();
  });
  it('only embeds official YouTube trailers', () => {
    expect(selectTrailer({results:[{site:'YouTube',type:'Trailer',official:false,key:'abcdefghijk'},{site:'YouTube',type:'Teaser',official:true,key:'abcdefghijk'}]})).toBeUndefined();
    expect(selectTrailer({results:[{site:'YouTube',type:'Trailer',official:true,key:'abcdefghijk'}]})).toBe('abcdefghijk');
    expect(selectTrailer({results:[{site:'YouTube',type:'Trailer',official:true,key:'bad'}]})).toBeUndefined();
  });
});
describe('Irish provider rules', () => {
  it('never uses US availability as Irish availability', () => { expect(parseIrishProviders({results:{US:{flatrate:[{provider_id:8,provider_name:'Netflix'}]}}}).known).toBe(false); });
  it('distinguishes subscriptions from rental/purchase and highlights subscription brands', () => {
    const parsed = parseIrishProviders({results:{IE:{flatrate:[{provider_id:8,provider_name:'Netflix'},{provider_id:9,provider_name:'Amazon Prime Video'}],rent:[{provider_id:10,provider_name:'Amazon Video'}],buy:[{provider_id:2,provider_name:'Apple TV'}]}}});
    expect(parsed.flatrate.map(p => [p.name,p.highlighted])).toEqual([['Netflix',true],['Amazon Prime Video',true]]);
    expect(parsed.rent.map(p => p.name)).toEqual(['Amazon Video']);
    expect(parsed.buy.map(p => p.name)).toEqual(['Apple TV']);
  });
  it('treats empty provider data as unknown, not unavailable', () => { expect(parseIrishProviders({results:{IE:{}}}).known).toBe(false); });
});
describe('Spotlight keyboard guard', () => {
  it('ignores fields and contenteditable', () => {
    for (const tag of ['input','textarea','select']) expect(canNavigate(document.createElement(tag),false)).toBe(false);
    const editable = document.createElement('div'); editable.setAttribute('contenteditable','true'); expect(canNavigate(editable,false)).toBe(false);
  });
  it('ignores open dialogs but permits normal browsing', () => { expect(canNavigate(document.body,true)).toBe(false); expect(canNavigate(document.body,false)).toBe(true); });
});

describe('gallery card badges', () => {
  it('prefers sourced IMDb and Rotten Tomatoes over TMDB', () => {
    expect(cardBadges({ tmdbRating: 7.5, omdb: { imdb: 8.12, rottenTomatoes: 95 } })).toEqual(['IMDb 8.1', 'RT 95%']);
  });
  it('falls back to TMDB when OMDb scores are missing', () => {
    expect(cardBadges({ tmdbRating: 7.24 })).toEqual(['TMDB 7.2']);
  });
  it('stays empty when no ratings exist', () => {
    expect(cardBadges({})).toEqual([]);
    expect(cardBadges(undefined)).toEqual([]);
  });
});

describe('trailer backfill tiers', () => {
  const yt = (type: string, official: boolean, key: string) => ({ site: 'YouTube', type, official, key });
  it('still prefers an official trailer over everything else', () => {
    expect(selectAnyTrailer({ results: [yt('Teaser', true, 'aaaaaaaaaaa'), yt('Trailer', false, 'bbbbbbbbbbb'), yt('Trailer', true, 'ccccccccccc')] })).toBe('ccccccccccc');
  });
  it('accepts a non-official trailer when no official one exists', () => {
    expect(selectAnyTrailer({ results: [yt('Teaser', true, 'aaaaaaaaaaa'), yt('Trailer', false, 'bbbbbbbbbbb')] })).toBe('bbbbbbbbbbb');
  });
  it('falls back to teasers and rejects invalid keys', () => {
    expect(selectAnyTrailer({ results: [yt('Teaser', false, 'ddddddddddd'), yt('Teaser', true, 'eeeeeeeeeee')] })).toBe('eeeeeeeeeee');
    expect(selectAnyTrailer({ results: [yt('Trailer', true, 'bad'), { site: 'Vimeo', type: 'Trailer', official: true, key: 'fffffffffff' }] })).toBeUndefined();
  });
});

import { applyBackup, parseBackup } from './discovery';
describe('saved/watched backup', () => {
  const ids = new Set(['a', 'b', 'c']);
  it('drops unknown ids and rejects junk', () => {
    expect(parseBackup('{"saved":["a","zzz",3],"watched":["b"]}', ids)).toEqual({ saved: ['a'], watched: ['b'] });
    expect(parseBackup('not json', ids)).toBeNull();
    expect(parseBackup('{"foo":1}', ids)).toBeNull();
  });
  it('merge keeps both lists; watched removes from saved', () => {
    expect(applyBackup({ saved: ['a', 'c'], watched: [] }, { saved: [], watched: ['c'] }, 'merge')).toEqual({ saved: ['a'], watched: ['c'] });
  });
  it('replace discards current lists', () => {
    expect(applyBackup({ saved: ['a'], watched: ['b'] }, { saved: ['c'], watched: [] }, 'replace')).toEqual({ saved: ['c'], watched: [] });
  });
});
