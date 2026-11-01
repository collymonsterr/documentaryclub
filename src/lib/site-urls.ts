import { CATEGORIES } from '@/data/films';
import { AWARD_COPY, CATEGORY_COPY, MOOD_COPY } from '@/data/category-copy';
import { CATALOGUE, SNAPSHOT } from '@/data/catalogue';
import { AWARDS, makerIndex } from '@/data/discovery-facets';
import { TAGS } from '@/data/tags';

// Change this one value when the custom domain goes live: previews and canonical links use it.
export const SITE_ORIGIN = 'https://documentaryclub.lovable.app';
export const SITE_NAME = 'Documentary Club';

export const slugify = (text: string) => text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const categoryBySlug = new Map(CATEGORIES.map(c => [slugify(c.label), c]));
const categorySlug = new Map(CATEGORIES.map(c => [c.id as string, slugify(c.label)]));
const tagIds = new Set<string>(TAGS.map(t => t.id));
const filmIds = new Set(CATALOGUE.map(f => f.id));
let makers: { bySlug: Map<string, string>; byName: Map<string, string> } | undefined;
const makerSlugs = () => {
  if (makers) return makers;
  const names = makerIndex().map(m => m.name);
  makers = { bySlug: new Map(names.map(n => [slugify(n), n])), byName: new Map(names.map(n => [n, slugify(n)])) };
  return makers;
};

type PageSearch = { film?: string; tag?: string; cat?: string; maker?: string; mood?: string; award?: string; browse?: string };
// The one clean path for a page, or null when it is a filter combination that stays on query parameters.
export function pagePath(search: PageSearch) {
  const { tag, maker, award } = search, cat = search.cat && search.cat !== 'all' ? search.cat : '';
  if (search.film) return filmIds.has(search.film) ? `/film/${search.film}` : null;
  if ([tag, cat, maker, award].filter(Boolean).length !== 1) return [tag, cat, maker, award].some(Boolean) ? null : search.browse === 'directors' ? '/directors' : search.browse === 'awards' ? '/awards' : '/';
  if (award) { const slug = AWARDS.find(a => a.id === award)?.slug; return slug ? `/awards/${slug}` : null; }
  if (tag) return tagIds.has(tag) ? `/tags/${tag}` : null;
  if (cat) return categorySlug.has(cat) ? `/categories/${categorySlug.get(cat)}` : null;
  const slug = maker ? makerSlugs().byName.get(maker) : undefined;
  return slug ? `/directors/${slug}` : null;
}

// TanStack parses numeric-looking search values as numbers, so an ID such as "1" has to stay quoted.
const searchValue = (value: string) => (/^[\d.]+$/.test(value) ? JSON.stringify(value) : value);
const readValue = (value: string) => value.replace(/^"(.*)"$/, '$1');

// Public clean URLs are rewritten onto the home route's search params, so one page keeps owning all filtering.
export const urlRewrite = {
  input: ({ url }: { url: URL }) => {
    const [, section, slug, extra] = url.pathname.replace(/\/$/, '').split('/');
    if (!section || extra !== undefined) return undefined;
    if (section === 'tags' && !slug) { url.pathname = '/'; url.searchParams.set('tag', TAGS[0].id); url.searchParams.set('browse', 'tags'); return url; }
    if (!slug && (section === 'directors' || section === 'makers')) { url.pathname = '/'; url.searchParams.set('browse', 'directors'); return url; }
    if (!slug && section === 'awards') { url.pathname = '/'; url.searchParams.set('browse', 'awards'); return url; }
    if (!slug) return undefined;
    if (section === 'awards' && AWARDS.some(a => a.slug === slug)) { url.searchParams.set('award', AWARDS.find(a => a.slug === slug)!.id); url.searchParams.set('browse', 'awards'); }
    else if (section === 'tags' && tagIds.has(slug)) { url.searchParams.set('tag', slug); url.searchParams.set('browse', 'tags'); }
    else if (section === 'categories' && categoryBySlug.has(slug)) url.searchParams.set('cat', categoryBySlug.get(slug)!.id);
    else if (section === 'film' && filmIds.has(slug)) url.searchParams.set('film', searchValue(slug));
    else if (section === 'directors' && makerSlugs().bySlug.has(slug)) { url.searchParams.set('maker', makerSlugs().bySlug.get(slug)!); url.searchParams.set('browse', 'directors'); }
    else return undefined;
    url.pathname = '/';
    return url;
  },
  output: ({ url }: { url: URL }) => {
    if (url.pathname !== '/') return undefined;
    const get = (key: string) => readValue(url.searchParams.get(key) ?? '');
    const search = { film: get('film'), tag: get('tag'), cat: get('cat'), maker: get('maker'), award: get('award'), browse: get('browse') };
    const path = pagePath(search);
    if (!path || path === '/') return undefined;
    if (search.film) url.searchParams.delete('film');
    else {
      ['tag', 'cat', 'maker', 'award', 'browse'].forEach(key => url.searchParams.delete(key));
      if (get('q') === search.maker) url.searchParams.delete('q');
    }
    url.pathname = path;
    return url;
  },
};

const firstSentences = (text: string, max = 180) => (text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, '')}…`);
export function listHeading(search: PageSearch) {
  const cat = search.cat && search.cat !== 'all' ? search.cat : '';
  if ([search.tag, cat, search.maker, search.mood, search.award].filter(Boolean).length !== 1) return null;
  const copied = search.mood ? MOOD_COPY[search.mood] : search.award ? AWARD_COPY[search.award] : undefined;
  if (search.mood || search.award) return copied ? { ...copied, image: undefined } : null;
  const tag = TAGS.find(t => t.id === search.tag);
  if (tag) return { title: tag.title, description: tag.description, image: `/og/tags-${tag.id}.jpg` };
  if (search.maker) return makerSlugs().byName.has(search.maker) ? { title: `Documentaries by ${search.maker}`, description: `The ${search.maker} documentaries in the collection.`, image: undefined } : null;
  const copy = CATEGORY_COPY[cat as keyof typeof CATEGORY_COPY];
  return copy ? { ...copy, image: `/og/categories-${categorySlug.get(cat)}.jpg` } : null;
}
const countLabel = (n: number) => `${n} ${n === 1 ? 'documentary' : 'documentaries'}`;
export const documentaryCount = countLabel;

function previewFor(search: PageSearch) {
  const film = search.film ? CATALOGUE.find(f => f.id === search.film) : undefined;
  if (film) {
    const snap = SNAPSHOT[film.id];
    return { title: `${film.title} (${film.year})`, description: firstSentences(snap?.overview ?? film.synopsis), image: snap?.backdrops?.[0] ?? snap?.poster };
  }
  if (search.browse === 'directors' && !search.maker) return { title: 'Directors', description: 'The documentary filmmakers in the collection, with every title linked.', image: undefined };
  if (search.browse === 'awards' && !search.award) return { title: 'Awards', description: 'Oscar, BAFTA, Emmy, Sundance, Tribeca, IDA and Cannes winners in the collection.', image: undefined };
  const heading = listHeading(search);
  if (heading?.image) return heading;
  if (heading) {
    const top = !search.maker ? undefined : CATALOGUE.filter(f => f.director.split(', ').includes(search.maker!)).find(f => SNAPSHOT[f.id]?.backdrops?.length);
    return { ...heading, image: top ? SNAPSHOT[top.id]?.backdrops?.[0] : undefined };
  }
  return { title: 'A personal collection of documentaries', description: `${CATALOGUE.length} documentaries worth your time, with trailers, ratings and where to watch them.`, image: undefined };
}
const absolute = (path: string) => (path.startsWith('http') ? path : `${SITE_ORIGIN}${path}`);
// Absolute, server-rendered tags: WhatsApp, LinkedIn and Reddit read these without running any JavaScript.
export function previewHead(preview: { title: string; description: string; image?: string | undefined }, path: string | null) {
  const title = `${preview.title} — ${SITE_NAME}`, image = absolute(preview.image ?? '/og/default.jpg');
  const url = path ? absolute(path) : undefined;
  return {
    meta: [
      { title }, { name: 'description', content: preview.description },
      { property: 'og:site_name', content: SITE_NAME }, { property: 'og:title', content: title }, { property: 'og:description', content: preview.description },
      { property: 'og:type', content: 'website' }, { property: 'og:image', content: image }, ...(url ? [{ property: 'og:url', content: url }] : []),
      { name: 'twitter:card', content: 'summary_large_image' }, { name: 'twitter:title', content: title }, { name: 'twitter:description', content: preview.description }, { name: 'twitter:image', content: image },
    ],
    links: url ? [{ rel: 'canonical', href: url }] : [],
  };
}
export const pageHead = (search: PageSearch) => previewHead(previewFor(search), pagePath(search));
export const staticPageHead = (title: string, description: string, path: string) => previewHead({ title, description }, path);
