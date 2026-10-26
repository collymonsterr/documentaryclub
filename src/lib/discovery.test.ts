import { describe, expect, it } from 'vitest';
import { FILMS } from '@/data/films';
import { canNavigate, filterYears, matchMovie, matchesOmdb, normalizeDirector, parseIrishProviders, readTracking, selectTrailer, TRACKING_KEYS } from './discovery';

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
describe('years', () => {
  it('filters an inclusive year range', () => { expect(filterYears(FILMS,2023,2023,'all','curated').map(f => f.year)).toEqual(Array(6).fill(2023)); });
  it('filters decades without losing the 2019 exception', () => { expect(filterYears(FILMS,undefined,undefined,'2010','curated').map(f => f.id)).toEqual(['fantastic-fungi']); });
  it('sorts years ascending and descending', () => {
    expect(filterYears(FILMS,undefined,undefined,'all','oldest')[0]?.year).toBe(2019);
    expect(filterYears(FILMS,undefined,undefined,'all','newest')[0]?.year).toBe(2025);
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
