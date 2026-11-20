import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './catalogue';
import type { Film } from './films';
import { DF_HOSTS, DF_ID, DF_PICKS, dfLink, dfPicksFor, isDfPick, matchPick } from './documentary-first';
import { listGroups, listHeading, pagePath, selectionFilms, urlRewrite } from '@/lib/site-urls';
import { matchesFacets } from './discovery-facets';

const film = (title: string, year: number, extra: Partial<Film> = {}) => ({ id: title, title, year, categories: [], synopsis: '', ...extra }) as unknown as Film;

describe('Documentary First guest picks', () => {
  it('matches their titles to ours without guessing', () => {
    const films = [film('Crip Camp', 2020), film('Summer of Soul', 2021), film('Fyre', 2019), film('Undefeated', 2011), film('Undefeated', 2003), film('The Jinx', 2015)];
    expect(matchPick('Crip Camp: A Disability Revolution', 2020, films)?.title).toBe('Crip Camp');
    expect(matchPick('Summer of Soul (...Or, When the Revolution Could Not Be Televised)', 2021, films)?.title).toBe('Summer of Soul');
    expect(matchPick('Senna (2010)', 2010, [film('Senna', 2010)])?.title).toBe('Senna');
    expect(matchPick('Jinx: The Life and Deaths of Robert Durst', 2015, films)?.title).toBe('The Jinx');
    expect(matchPick('Undefeated', 2011, films)?.year).toBe(2011);
    // Two films share the title and they gave no year: leave it out rather than guess.
    expect(matchPick('Undefeated', undefined, films)).toBeUndefined();
    expect(matchPick('Fyre', 2010, films)).toBeUndefined();
    expect(matchPick('Searching for Sugar Man', 2012, films)).toBeUndefined();
  });

  it('links each guest to their pick with the agreed tracking', () => {
    const url = new URL(dfLink({ title: 'Senna', guest: 'Laela Kilbourn' }));
    expect(`${url.origin}${url.pathname}`).toBe('https://documentaryfirst.com/pages/docuview-deja-view');
    expect(url.search).toContain('by=Laela%20Kilbourn');
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'Senna', by: 'Laela Kilbourn', utm_source: 'documentaryclub', utm_medium: 'referral' });
  });

  it('keeps only catalogue films and never the hosts', () => {
    const ids = new Set(CATALOGUE.map(f => f.id)), hosts = new Set(DF_HOSTS);
    expect(DF_PICKS.length).toBeGreaterThan(0);
    for (const p of DF_PICKS) {
      expect(ids.has(p.film)).toBe(true);
      expect(hosts.has(p.guest)).toBe(false);
    }
    expect(dfPicksFor('senna').map(p => p.guest)).toContain('Laela Kilbourn');
  });

  it('has its own page at /documentary-first', () => {
    expect(pagePath({ pick: DF_ID })).toBe('/documentary-first');
    const url = urlRewrite.input({ url: new URL('https://x.test/documentary-first') })!;
    expect(url.pathname).toBe('/');
    expect(url.searchParams.get('pick')).toBe(DF_ID);
    expect(urlRewrite.output({ url: new URL(`https://x.test/?pick=${DF_ID}`) })?.pathname).toBe('/documentary-first');
    // Their link back carries ?ref=documentaryfirst; it must survive the rewrite so the visit is credited.
    expect(urlRewrite.input({ url: new URL('https://x.test/documentary-first?ref=documentaryfirst') })?.searchParams.get('ref')).toBe('documentaryfirst');
    const films = selectionFilms({ pick: DF_ID });
    expect(films.length).toBe(new Set(DF_PICKS.map(p => p.film)).size);
    expect(films.every(f => isDfPick(f.id) && matchesFacets(f, { award: '', mood: '', pick: DF_ID, maker: '' }))).toBe(true);
    const heading = listHeading({ pick: DF_ID })!;
    expect(heading.title).toBe('Documentary First Guest Picks');
    expect(heading.intro).toBeTruthy();
    expect(listGroups().flatMap(g => g.items).some(i => i.path === '/documentary-first')).toBe(true);
  });
});
