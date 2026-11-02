import { CATEGORIES, type Category, type Film } from '@/data/films';
import { AWARD_COPY, CATEGORY_COPY, MOOD_COPY } from '@/data/category-copy';
import { CATALOGUE, SNAPSHOT } from '@/data/catalogue';
import { AWARDS, EDITORIAL, MOODS, accolades, byAward, credits, documentariesLike, isFeatured, makerIndex, rankFilms, topAwards } from '@/data/discovery-facets';
import { LIKE_PAGES } from '@/data/like-pages';
import { LIST_INTROS } from '@/data/list-intros';
import { PICK_TAGS, TAGS } from '@/data/tags';
import { breadcrumbs, filmSchema, itemList, siteSchema } from '@/lib/structured-data';
import profiles from '@/data/director-profiles.json';

// Change this one value when the custom domain goes live: previews and canonical links use it.
export const SITE_ORIGIN = 'https://documentaryclub.fyi';
export const SITE_NAME = 'Documentary Club';

export const slugify = (text: string) => text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const categoryBySlug = new Map(CATEGORIES.map(c => [slugify(c.label), c]));
const categorySlug = new Map(CATEGORIES.map(c => [c.id as string, slugify(c.label)]));
const tagIds = new Set<string>(TAGS.map(t => t.id));
// Renamed tags, so shared links keep working.
const OLD_TAGS: Record<string, string> = { 'on-netflix': 'netflix-original' };
const filmIds = new Set(CATALOGUE.map(f => f.id));
export const moodSlug = (id: string) => slugify(MOODS.find(m => m.id === id)?.label ?? '');
const moodBySlug = new Map<string, string>(MOODS.map(m => [slugify(m.label), m.id]));
let makers: { bySlug: Map<string, string>; byName: Map<string, string> } | undefined;
const makerSlugs = () => {
  if (makers) return makers;
  const names = makerIndex().map(m => m.name);
  makers = { bySlug: new Map(names.map(n => [slugify(n), n])), byName: new Map(names.map(n => [n, slugify(n)])) };
  return makers;
};

type PageSearch = { film?: string; tag?: string; cat?: string; maker?: string; mood?: string; award?: string; like?: string; browse?: string };
// The one clean path for a page, or null when it is a filter combination that stays on query parameters.
export function pagePath(search: PageSearch) {
  const { tag, maker, award, mood, like } = search, cat = search.cat && search.cat !== 'all' ? search.cat : '';
  if (search.film) return filmIds.has(search.film) ? `/film/${search.film}` : null;
  if ([tag, cat, maker, award, mood, like].filter(Boolean).length !== 1) return [tag, cat, maker, award, mood, like].some(Boolean) ? null : search.browse === 'directors' ? '/directors' : search.browse === 'awards' ? '/awards' : search.browse === 'about' ? '/about' : '/';
  if (mood) return moodSlug(mood) ? `/moods/${moodSlug(mood)}` : null;
  if (like) return LIKE_PAGES[like] ? `/documentaries-like/${like}` : null;
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
    if (!slug && section === 'about') { url.pathname = '/'; url.searchParams.set('browse', 'about'); return url; }
    if (!slug && section === 'awards') { url.pathname = '/'; url.searchParams.set('browse', 'awards'); return url; }
    if (!slug && section === 'moods') { url.pathname = '/'; url.searchParams.set('mood', MOODS[0].id); url.searchParams.set('browse', 'moods'); return url; }
    if (!slug) return undefined;
    if (section === 'awards' && AWARDS.some(a => a.slug === slug)) { url.searchParams.set('award', AWARDS.find(a => a.slug === slug)!.id); url.searchParams.set('browse', 'awards'); }
    else if (section === 'documentaries-like' && LIKE_PAGES[slug]) url.searchParams.set('like', slug);
    else if (section === 'moods' && moodBySlug.has(slug)) { url.searchParams.set('mood', moodBySlug.get(slug)!); url.searchParams.set('browse', 'moods'); }
    else if (section === 'tags' && (tagIds.has(slug) || OLD_TAGS[slug])) { url.searchParams.set('tag', OLD_TAGS[slug] ?? slug); url.searchParams.set('browse', 'tags'); }
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
    const search = { film: get('film'), tag: get('tag'), cat: get('cat'), maker: get('maker'), award: get('award'), mood: get('mood'), like: get('like'), browse: get('browse') };
    const path = pagePath(search);
    if (!path || path === '/') return undefined;
    if (search.film) url.searchParams.delete('film');
    else {
      ['tag', 'cat', 'maker', 'award', 'mood', 'like', 'browse'].forEach(key => url.searchParams.delete(key));
      if (get('q') === search.maker) url.searchParams.delete('q');
    }
    url.pathname = path;
    return url;
  },
};

const firstSentences = (text: string, max = 180) => (text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, '')}…`);
// A page under eight titles is too thin to index.
export const MIN_LIST = 8;
const pickTags = new Set<string>(PICK_TAGS.map(t => t.id));
// The titles one single-selection page lists, in the page's own order: winners first for awards, ranked for everything else.
export function selectionFilms(search: PageSearch): Film[] {
  const cat = search.cat && search.cat !== 'all' ? search.cat : '';
  const liked = search.like && LIKE_PAGES[search.like] ? CATALOGUE.find(f => f.id === search.like) : undefined;
  if (liked) return documentariesLike(liked);
  if (search.award) return byAward(CATALOGUE.filter(f => accolades(f).some(a => a.body === search.award)), search.award);
  if (cat) return rankFilms(CATALOGUE.filter(f => f.categories.includes(cat as Category)));
  if (search.maker) return rankFilms(CATALOGUE.filter(f => credits(f).includes(search.maker!)));
  if (search.tag) return rankFilms(CATALOGUE.filter(f => f.tags?.includes(search.tag!)));
  return rankFilms(CATALOGUE.filter(f => !!search.mood && EDITORIAL[f.id]?.moods.includes(search.mood) === true));
}
export function listHeading(search: PageSearch) {
  const cat = search.cat && search.cat !== 'all' ? search.cat : '';
  if ([search.tag, cat, search.maker, search.mood, search.award, search.like].filter(Boolean).length !== 1) return null;
  if (search.like) return likeHeading(search.like);
  const base = baseHeading(search, cat);
  if (!base) return null;
  const key = search.tag ? `tag:${search.tag}` : cat ? `cat:${cat}` : search.mood ? `mood:${search.mood}` : search.maker ? `maker:${search.maker}` : `award:${search.award}`;
  const count = selectionFilms(search).length, ranked = !search.award;
  // Numbered "The 22 Best …" titles for subjects and moods; picks, directors and awards keep their own names.
  const best = ranked && !search.maker && !pickTags.has(search.tag ?? '') && count >= MIN_LIST;
  const featured = !!search.maker && isFeatured({ name: search.maker, films: selectionFilms(search) });
  return {
    ...base, key, count, ranked, best,
    title: best ? `The ${count} Best ${base.title}` : base.title,
    seoTitle: search.maker ? `${search.maker} Documentaries, Ranked` : undefined,
    intro: LIST_INTROS[key],
    indexable: search.maker ? featured : count >= MIN_LIST,
  };
}
// "12 Documentaries Like Tiger King": numbered like the ranked lists, but never "Best".
function likeHeading(id: string) {
  const film = CATALOGUE.find(f => f.id === id), page = LIKE_PAGES[id];
  if (!film || !page) return null;
  const count = documentariesLike(film).length, snap = SNAPSHOT[film.id];
  return {
    title: `${count} Documentaries Like ${film.title}`, seoTitle: `${count} Documentaries Like ${film.title} to Watch Next`,
    description: `If you liked ${film.title}, these are the ones to watch next.`, image: snap?.backdrops?.[0] ?? snap?.poster,
    key: `like:${id}`, count, ranked: true, best: false, intro: page.intro, indexable: count >= MIN_LIST, film,
  };
}
function baseHeading(search: PageSearch, cat: string) {
  const copied = search.mood ? MOOD_COPY[search.mood] : search.award ? AWARD_COPY[search.award] : undefined;
  if (search.mood || search.award) return copied ? { ...copied, image: undefined } : null;
  const tag = TAGS.find(t => t.id === search.tag);
  if (tag) return { title: tag.title, description: tag.description, image: `/og/tags-${tag.id}.jpg` };
  if (search.maker) return makerSlugs().byName.has(search.maker) ? { title: `Documentaries by ${search.maker}`, description: (profiles as Record<string, { blurb?: string }>)[search.maker]?.blurb ?? `The ${search.maker} documentaries in the collection.`, image: undefined } : null;
  const copy = CATEGORY_COPY[cat as keyof typeof CATEGORY_COPY];
  return copy ? { ...copy, image: `/og/categories-${categorySlug.get(cat)}.jpg` } : null;
}
const countLabel = (n: number) => `${n} ${n === 1 ? 'documentary' : 'documentaries'}`;
export const documentaryCount = countLabel;

type Preview = { title: string; description: string; image?: string | undefined; seoTitle?: string | undefined; noindex?: boolean; jsonLd?: object[] };
const names = (list: string[]) => list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : list[0] ?? '';
// Our own summary leads (director, year, best award, scores), so the description isn't the synopsis every other site copies.
export function filmDescription(film: Film) {
  const o = SNAPSHOT[film.id]?.omdb, award = topAwards(film, 1)[0]?.label;
  const scores = [o?.imdb !== undefined ? `IMDb ${o.imdb.toFixed(1)}` : '', o?.rottenTomatoes !== undefined ? `RT ${o.rottenTomatoes}%` : ''].filter(Boolean).join(', ');
  const directors = film.director ? film.director.split(', ').slice(0, 2) : [];
  const what = `${film.year} documentary${film.mediaType === 'tv' ? ' series' : ''}`;
  const lead = `${directors.length ? `${names(directors)}'s ${what}` : `A ${what}`}${award ? `. ${award}` : ''}${scores ? ` · ${scores}` : ''}.`;
  return `${lead} ${firstSentences(SNAPSHOT[film.id]?.overview ?? film.synopsis, Math.max(80, 230 - lead.length))}`;
}
const categoryCrumb = (film: Film): [string, string] | undefined => {
  const cat = film.categories[0], path = cat ? pagePath({ cat }) : null;
  return cat && path ? [CATEGORY_COPY[cat]?.title ?? cat, path] : undefined;
};
function previewFor(search: PageSearch): Preview {
  const film = search.film ? CATALOGUE.find(f => f.id === search.film) : undefined;
  if (film) {
    const snap = SNAPSHOT[film.id], crumb = categoryCrumb(film);
    return {
      title: `${film.title} (${film.year})`, seoTitle: `${film.title} (${film.year}): Trailer, Ratings & Where to Watch`,
      description: filmDescription(film), image: snap?.backdrops?.[0] ?? snap?.poster,
      jsonLd: [filmSchema(film), breadcrumbs([['Home', '/'], ...(crumb ? [crumb] : []), [film.title, `/film/${film.id}`]])],
    };
  }
  if (search.browse === 'directors' && !search.maker) return { title: 'Directors', seoTitle: 'Great Documentary Directors', description: 'The documentary filmmakers in the collection, with every title linked.', image: undefined };
  if (search.browse === 'about') return { title: 'About', description: 'A personal collection of documentaries worth your time, built in Ireland.', image: undefined };
  if (search.browse === 'awards' && !search.award) return { title: 'Awards', seoTitle: 'Award-winning Documentaries', description: 'Oscar, BAFTA, Emmy, Sundance, Tribeca, IDA and Cannes winners in the collection.', image: undefined };
  const heading = listHeading(search);
  if (heading) {
    const path = pagePath(search) ?? '/', films = selectionFilms(search);
    const top = heading.image || !search.maker ? undefined : films.find(f => SNAPSHOT[f.id]?.backdrops?.length);
    const liked = 'film' in heading ? heading.film : undefined;
    const parent: [string, string][] = search.maker ? [['Directors', '/directors']] : search.award ? [['Awards', '/awards']] : liked ? [[liked.title, `/film/${liked.id}`]] : [];
    return {
      title: heading.title, seoTitle: heading.seoTitle, noindex: !heading.indexable,
      // The top three by name make each list's description its own.
      description: `${heading.description} ${heading.ranked ? 'Top picks' : 'Including'}: ${names(films.slice(0, 3).map(f => f.title))}.`,
      image: heading.image ?? (top ? SNAPSHOT[top.id]?.backdrops?.[0] : undefined),
      jsonLd: [itemList(heading.seoTitle ?? heading.title, films), breadcrumbs([['Home', '/'], ...parent, [heading.seoTitle ?? heading.title, path]])],
    };
  }
  return { title: 'Extraordinary true stories', seoTitle: 'Extraordinary True Stories: The Best Documentaries to Watch', description: `${CATALOGUE.length} documentaries worth your time, with trailers, ratings and where to watch them.`, image: undefined, jsonLd: siteSchema() };
}
const absolute = (path: string) => (path.startsWith('http') ? path : `${SITE_ORIGIN}${path}`);
// Absolute, server-rendered tags: WhatsApp, LinkedIn and Reddit read these without running any JavaScript.
export function previewHead(preview: Preview, path: string | null) {
  const title = `${preview.title} — ${SITE_NAME}`, image = absolute(preview.image ?? '/og/default.jpg');
  const url = path ? absolute(path) : undefined;
  return {
    meta: [
      { title: `${preview.seoTitle ?? preview.title} — ${SITE_NAME}` }, { name: 'description', content: preview.description },
      ...(preview.noindex ? [{ name: 'robots', content: 'noindex, follow' }] : []),
      { property: 'og:site_name', content: SITE_NAME }, { property: 'og:title', content: title }, { property: 'og:description', content: preview.description },
      { property: 'og:type', content: 'website' }, { property: 'og:image', content: image }, ...(url ? [{ property: 'og:url', content: url }] : []),
      { name: 'twitter:card', content: 'summary_large_image' }, { name: 'twitter:title', content: title }, { name: 'twitter:description', content: preview.description }, { name: 'twitter:image', content: image },
      // TanStack renders this meta form as a JSON-LD script; its types only know HTML meta attributes.
      ...(preview.jsonLd ?? []).map(data => ({ 'script:ld+json': data }) as unknown as { name: string; content: string }),
    ],
    links: url ? [{ rel: 'canonical', href: url }] : [],
  };
}
export const pageHead = (search: PageSearch) => previewHead(previewFor(search), pagePath(search));
export const staticPageHead = (title: string, description: string, path: string, extra: Partial<Preview> = {}) => previewHead({ title, description, ...extra }, path);

// Every indexable list page, grouped as the /best hub, the footer index and the sitemap show them.
export function listGroups() {
  const page = (search: PageSearch) => {
    const heading = listHeading(search), path = pagePath(search);
    return heading?.indexable && path ? { title: heading.seoTitle ?? heading.title, label: '', path, count: heading.count, search } : undefined;
  };
  const group = (label: string, items: { search: PageSearch; label: string }[]) => ({
    label, items: items.map(i => { const p = page(i.search); return p && { ...p, label: i.label }; }).filter(<T,>(x: T | undefined): x is T => !!x),
  });
  return [
    group('By subject', CATEGORIES.map(c => ({ search: { cat: c.id }, label: c.label }))),
    group('By mood', MOODS.map(m => ({ search: { mood: m.id }, label: m.label }))),
    group('Topics', TAGS.filter(t => t.group === 'topics').map(t => ({ search: { tag: t.id }, label: t.label }))),
    group('Picks', PICK_TAGS.map(t => ({ search: { tag: t.id }, label: t.label }))),
    group('If you liked…', Object.keys(LIKE_PAGES).map(id => ({ search: { like: id }, label: CATALOGUE.find(f => f.id === id)?.title ?? id }))),
    group('Directors', makerIndex().filter(isFeatured).map(m => ({ search: { maker: m.name }, label: m.name }))),
    group('Awards', AWARDS.map(a => ({ search: { award: a.id }, label: a.label }))),
  ].filter(g => g.items.length);
}
// In-app navigation to a clean path: the router's href navigation skips the input rewrite, so hand it the query form.
export const routedHref = (path: string) => {
  const url = urlRewrite.input({ url: new URL(path, SITE_ORIGIN) });
  return url ? `${url.pathname}${url.search}` : path;
};
