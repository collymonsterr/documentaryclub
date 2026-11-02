import { describe, expect, it } from 'vitest';
import { filmDescription, listGroups, listHeading, pagePath, selectionFilms, slugify, urlRewrite } from './site-urls';
import { CATALOGUE } from '@/data/catalogue';
import { LIKE_PAGES } from '@/data/like-pages';

const input = (path: string) => urlRewrite.input({ url: new URL(`https://x.test${path}`) });
const output = (path: string) => urlRewrite.output({ url: new URL(`https://x.test${path}`) });
describe('browse headings', () => {
  it('heads every single selection and steps aside for combinations', () => {
    expect(listHeading({ mood: 'funny', cat: 'all' })?.title).toBe(`The ${listHeading({ mood: 'funny' })!.count} Best Funny Documentaries`);
    expect(listHeading({ award: 'oscar' })?.title).toBe('Oscar Documentaries');
    expect(pagePath({ award: 'sundance' })).toBe('/awards/sundance');
    expect(pagePath({ browse: 'awards' })).toBe('/awards');
    expect(listHeading({ mood: 'funny', cat: 'scams' })).toBeNull();
  });
});
describe('ranked list pages', () => {
  it('numbers subject and mood lists, but not picks, directors or awards', () => {
    const scams = listHeading({ cat: 'scams' })!;
    expect(scams.title).toBe(`The ${scams.count} Best Scam Documentaries`);
    expect(listHeading({ tag: 'editors-choice' })?.best).toBe(false);
    expect(listHeading({ maker: 'Werner Herzog' })?.seoTitle).toBe('Werner Herzog Documentaries, Ranked');
    expect(listHeading({ award: 'oscar' })?.ranked).toBe(false);
  });
  it('keeps thin lists out of the index and the hubs', () => {
    expect(listHeading({ tag: 'free-on-youtube' })?.indexable).toBe(false);
    const paths = listGroups().flatMap(g => g.items.map(i => i.path));
    expect(paths).toContain('/moods/funny');
    expect(paths).not.toContain('/tags/free-on-youtube');
    expect(selectionFilms({ mood: 'funny' }).length).toBe(listHeading({ mood: 'funny' })?.count);
  });
  it('leads film descriptions with our own facts', () => {
    const senna = CATALOGUE.find(f => f.id === 'senna')!;
    expect(filmDescription(senna)).toMatch(/^Asif Kapadia's 2010 documentary\. BAFTA Winner.* · IMDb \d\.\d, RT \d+%\. /);
  });
});
describe('documentaries like X', () => {
  it('routes, titles and lists each page from its own picks', () => {
    expect(input('/documentaries-like/tiger-king')?.search).toBe('?like=tiger-king');
    expect(output('/?like=tiger-king')?.pathname).toBe('/documentaries-like/tiger-king');
    expect(input('/documentaries-like/senna-nope')).toBeUndefined();
    const h = listHeading({ like: 'tiger-king' })!;
    expect(h.title).toBe(`${h.count} Documentaries Like Tiger King`);
    expect(selectionFilms({ like: 'tiger-king' })[0]?.id).toBe('tickled');
  });
  it('only names titles that are in the catalogue', () => {
    const ids = new Set(CATALOGUE.map(f => f.id));
    for (const [id, page] of Object.entries(LIKE_PAGES)) for (const x of [id, ...(page.add ?? []), ...(page.drop ?? [])]) expect(ids.has(x), `${id}: ${x}`).toBe(true);
  });
});
describe('clean URLs', () => {
  it('maps public paths onto home filters', () => {
    expect(input('/tags/wine')?.search).toBe('?tag=wine&browse=tags');
    expect(input('/categories/food')?.search).toBe('?cat=food');
    expect(input('/directors/errol-morris')?.searchParams.get('maker')).toBe('Errol Morris');
    expect(input('/film/1')?.searchParams.get('film')).toBe('"1"');
    expect(input('/moods/feel-good')?.search).toBe('?mood=feelgood&browse=moods');
    expect(output('/?mood=feelgood&browse=moods')?.pathname).toBe('/moods/feel-good');
  });
  it('serves the Directors page from the home route', () => {
    expect(input('/directors')?.search).toBe('?browse=directors');
    expect(input('/makers')?.search).toBe('?browse=directors');
    expect(output('/?browse=directors')?.pathname).toBe('/directors');
  });
  it('leaves unknown paths alone so they 404', () => {
    for (const path of ['/tags/nope', '/categories/nope', '/directors/nope', '/film/nope', '/tags/wine/extra', '/nope', '/list']) expect(input(path)).toBeUndefined();
  });
  it('turns home filters back into clean paths', () => {
    expect(output('/?tag=wine&browse=tags')?.pathname).toBe('/tags/wine');
    expect(output('/?cat=food')?.pathname).toBe('/categories/food');
    expect(output('/?film=%221%22')?.pathname).toBe('/film/1');
    expect(output('/?maker=Errol+Morris&q=Errol+Morris&browse=directors')?.href).toBe('https://x.test/directors/errol-morris');
  });
  it('keeps combined filters on query parameters', () => {
    expect(pagePath({ tag: 'wine', cat: 'food' })).toBeNull();
    expect(output('/?tag=wine&cat=food')).toBeUndefined();
  });
  it('makes lowercase hyphenated slugs', () => { expect(slugify('Cults & Psychology')).toBe('cults-psychology'); expect(slugify('Werner Herzog')).toBe('werner-herzog'); });
});
