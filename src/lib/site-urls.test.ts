import { describe, expect, it } from 'vitest';
import { listHeading, pagePath, slugify, urlRewrite } from './site-urls';

const input = (path: string) => urlRewrite.input({ url: new URL(`https://x.test${path}`) });
const output = (path: string) => urlRewrite.output({ url: new URL(`https://x.test${path}`) });
describe('browse headings', () => {
  it('heads every single selection and steps aside for combinations', () => {
    expect(listHeading({ mood: 'funny', cat: 'all' })?.title).toBe('Funny Documentaries');
    expect(listHeading({ award: 'oscar-win' })?.title).toBe('Academy Award Winners');
    expect(listHeading({ mood: 'funny', cat: 'scams' })).toBeNull();
  });
});
describe('clean URLs', () => {
  it('maps public paths onto home filters', () => {
    expect(input('/tags/wine')?.search).toBe('?tag=wine&browse=tags');
    expect(input('/categories/food')?.search).toBe('?cat=food');
    expect(input('/directors/errol-morris')?.searchParams.get('maker')).toBe('Errol Morris');
    expect(input('/film/1')?.searchParams.get('film')).toBe('"1"');
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
