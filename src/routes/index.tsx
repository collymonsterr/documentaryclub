import { createFileRoute, Link, stripSearchParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, Check, Grid2X2, Maximize2, ExternalLink, Shuffle, Award, SlidersHorizontal, Link2 } from 'lucide-react';
import { CATEGORIES, justWatchLink, type Category } from '@/data/films';
import { CATALOGUE, SNAPSHOT, searchCatalogue } from '@/data/catalogue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DocumentaryPoster } from '@/components/documentary-poster';
import { SiteLogo } from '@/components/site-logo';
import { TrailerModal } from '@/components/trailer-modal';
import { useTracking } from '@/hooks/use-tracking';
import { canNavigate, cardBadges, inEra, orderFilms, shuffleIds, sortByRating, overviewSentences, TRACKING_KEYS, type Era, type Provider } from '@/lib/discovery';
import { getIrishProviders } from '@/lib/tmdb.functions';
const PAGE = 36;
const kind = (m?: string) => m === 'tv' ? 'Series' : m === 'collection' ? 'Film series' : 'Film';
const years = (f: { year: number; yearEnd?: number }) => f.yearEnd ? `${f.year}–${f.yearEnd}` : String(f.year);
const ERAS: [Era, string][] = [['all', 'All eras'], ['recent', 'Recent'], ['2020s', '2020s'], ['2010s', '2010s'], ['2000s', '2000s'], ['pre2000', 'Pre-2000']];

// Shareable state lives in the URL: ?film= opens Spotlight, ?list=shortlist|watched, ?q= search, plus cat/era/type/sort filters.
const searchDefaults = { film: '', q: '', list: '', cat: 'all', era: 'all', type: 'all', sort: 'random' };
const text = (value: unknown, fallback = '') => typeof value === 'string' && value ? value : fallback;
const SORTS = ['random', 'curated', 'newest', 'oldest', 'imdb', 'rt'];

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({ film: text(search['film']), q: text(search['q']), list: text(search['list']), cat: text(search['cat'], 'all'), era: text(search['era'], 'all'), type: text(search['type'], 'all'), sort: text(search['sort'], 'random') }),
  search: { middlewares: [stripSearchParams(searchDefaults)] },
  head: () => ({ meta: [
    { title: 'Documentary Club — Discover extraordinary true stories' },
    { name: 'description', content: `Explore ${CATALOGUE.length} curated documentary films and series, documented festival awards, official trailers and streaming availability in Ireland.` },
    { property: 'og:title', content: 'Documentary Club — Extraordinary true stories' },
    { property: 'og:description', content: 'Discover curated documentaries in Spotlight or Gallery, save your favourites and find Irish streaming options.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Index,
});
type Filter = 'all' | Category | 'awards';
const NOTES: Record<string, string> = {
  'beyond-utopia': 'The escape unfolds through an underground network, with the family’s safety at stake at every border.',
  'fire-of-love': 'Their extraordinary archive brings a shared life of scientific discovery into view.',
  ibelin: 'His online friendships reveal a side of their son they never knew.',
  skywalkers: 'Trust becomes as precarious as the climb itself.',
  mariupol: 'Their footage preserves a firsthand record of the siege.',
  'eternal-memory': 'Their daily routines become an intimate portrait of love and memory.',
  territory: 'Indigenous voices and cameras shape this account of resistance.',
  daughters: 'The preparations reveal the emotional distance between prison and home.',
  sugarcane: 'Survivors and families confront the enduring consequences of the residential school system.',
  'four-daughters': 'Reenactment becomes a way to explore grief, memory and family bonds.',
  'pez-outlaw': 'A colourful collecting obsession turns into an unlikely international caper.',
  'perfect-neighbor': 'The recordings reveal how everyday tensions can become deadly.',
  contestant: 'The experiment raises unsettling questions about entertainment and consent.',
  mission: 'The film examines the beliefs behind his fatal expedition.',
  'greatest-night': 'The film revisits the collaboration behind the charity single.',
  whakaari: 'Survivor accounts place human choices at the centre of the disaster.',
  'fantastic-fungi': 'The film explores the relationship between fungi, forests and people.',
};
function Providers({ label, items, subscription = false }: { label: string; items: Provider[]; subscription?: boolean }) {
  if (!items.length) return null;
  return <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs"><span className="text-muted-foreground">{label}</span>{items.map(p => <span key={p.id} className={subscription && p.highlighted ? 'font-semibold text-primary' : 'text-foreground'}>{p.name}</span>)}</div>;
}
function Index() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/' });
  const view = search.film ? 'spotlight' : 'gallery';
  const listFilter = search.list === 'shortlist' || search.list === 'watched' ? search.list : '';
  const [order, setOrder] = useState<string[] | null>(null);
  useEffect(() => { setOrder(shuffleIds(CATALOGUE.map(f => f.id))); }, []);
  // Return anchor: clicked/visible card ID plus its viewport offset, restored after layout (no timers).
  const anchor = useRef<{ id: string; offset: number } | null>(null); const restore = useRef(false);
  const saveAnchor = (id?: string) => {
    const cards = [...document.querySelectorAll<HTMLElement>('[data-film-card]')];
    const el = (id && cards.find(c => c.dataset['filmCard'] === id)) || cards.find(c => c.getBoundingClientRect().bottom > 0);
    anchor.current = el ? { id: el.dataset['filmCard']!, offset: el.getBoundingClientRect().top } : null;
  };
  const setFilm = (id: string) => navigate({ search: prev => ({ ...prev, film: id }) });
  const openSpotlight = (id?: string) => { if (view === 'gallery') saveAnchor(id); const target = id ?? search.film; if (target) setFilm(target); };
  const backToGallery = () => { if (view === 'gallery') return; restore.current = true; navigate({ search: prev => ({ ...prev, film: '' }) }); };
  useLayoutEffect(() => {
    if (view === 'spotlight') { document.getElementById('spotlight-top')?.scrollIntoView({ block: 'start' }); return; }
    if (!restore.current) return; restore.current = false;
    const apply = () => { const a = anchor.current; const el = a && document.querySelector<HTMLElement>(`[data-film-card="${CSS.escape(a.id)}"]`);
      if (el && a) window.scrollBy(0, el.getBoundingClientRect().top - a.offset); else window.scrollTo(0, 0); };
    apply(); const r = requestAnimationFrame(apply); return () => cancelAnimationFrame(r);
  }, [view]);
  const reshuffle = () => { setOrder(shuffleIds(CATALOGUE.map(f => f.id))); setSort('random'); setShown(PAGE); window.scrollTo(0, 0); };
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState(search.q);
  useEffect(() => { setQuery(search.q); }, [search.q]);
  const updateQuery = (value: string) => { setQuery(value); navigate({ search: prev => ({ ...prev, q: value }), replace: true }); };
  const [type, setType] = useState<'all' | 'movie' | 'tv'>('all'); const [shown, setShown] = useState(PAGE);
  const [shortlist, toggleShort] = useTracking(TRACKING_KEYS.shortlist);
  const [watched, toggleWatched] = useTracking(TRACKING_KEYS.watched);
  const [era, setEra] = useState<Era>('all'); const [sort, setSort] = useState('random');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [backdrop, setBackdrop] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fetchProviders = useServerFn(getIrishProviders);
  const list = useMemo(() => {
    const base = listFilter === 'shortlist' ? CATALOGUE.filter(f => shortlist.has(f.id)) : listFilter === 'watched' ? CATALOGUE.filter(f => watched.has(f.id)) : CATALOGUE;
    const filtered = searchCatalogue(sort === 'random' ? orderFilms(base, order) : base, query, type).filter(f => inEra(f.year, era)).filter(f => filter === 'all' ? true : filter === 'awards' ? f.awards.length > 0 : f.categories.includes(filter));
    if (sort === 'imdb' || sort === 'rt') return sortByRating(filtered, SNAPSHOT, sort === 'imdb' ? 'imdb' : 'rottenTomatoes');
    if (sort === 'newest') return [...filtered].sort((a, b) => b.year - a.year);
    if (sort === 'oldest') return [...filtered].sort((a, b) => a.year - b.year);
    return filtered;
  }, [filter, listFilter, shortlist, watched, sort, query, type, era, order]);
  useEffect(() => { setShown(PAGE); }, [filter, listFilter, query, type, sort, era]);
  // A shared link may name a film outside the current filters; show it anyway.
  const film = list.find(f => f.id === search.film) ?? CATALOGUE.find(f => f.id === search.film) ?? list[0];
  const idx = list.findIndex(f => f.id === film?.id);
  // Baseline metadata ships in the snapshot; only Irish availability is fetched live, for the selected title.
  const providers = useQuery({ queryKey: ['ie-providers', film?.id], queryFn: () => fetchProviders({ data: { id: film?.id ?? '' } }), enabled: Boolean(film?.tmdbId) && film?.mediaType !== 'collection', staleTime: 6 * 60 * 60_000, retry: false });
  const snap = film ? SNAPSHOT[film.id] : undefined;
  const extra = snap ? { ...snap, rating: snap.tmdbRating, providers: providers.data } : undefined;
  const backdropUrl = backdrop === null ? undefined : extra?.backdrops?.[backdrop];
  const go = useCallback((direction: number) => {
    if (!list.length) return;
    const next = list[(Math.max(idx, 0) + direction + list.length) % list.length];
    if (next) setFilm(next.id);
  }, [list, idx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setBackdrop(null); setCopied(false); }, [film?.id]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (view !== 'spotlight' || !canNavigate(e.target, trailerOpen) || document.querySelector('[role="dialog"]')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  }, [go, view, trailerOpen]);
  const rail = useRef<HTMLDivElement>(null); const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const container = rail.current; const active = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (container && active) container.scrollTo({ left: active.offsetLeft - container.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2, behavior: 'smooth' });
  }, [film?.id, view]);
  const share = async () => {
    if (!film) return;
    const url = `${window.location.origin}/?film=${film.id}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt('Copy this link', url); }
  };
  const toggleList = (which: 'shortlist' | 'watched') => navigate({ search: prev => ({ ...prev, list: prev.list === which ? '' : which }) });
  // Director links: open the gallery filtered to everything we have by that filmmaker.
  const searchDirector = (name: string) => { setFilter('all'); setEra('all'); setQuery(name); navigate({ search: prev => ({ ...prev, film: '', q: name, list: '' }) }); };
  const clearFilters = () => { setFilter('all'); setEra('all'); setType('all'); setSort('random'); updateQuery(''); if (listFilter) navigate({ search: prev => ({ ...prev, list: '' }) }); };
  const activeFilters = [type !== 'all', sort !== 'random', era !== 'all', listFilter === 'watched'].filter(Boolean).length;
  const filters: { id: Filter; label: string }[] = [{ id: 'all', label: 'All' }, ...CATEGORIES, { id: 'awards', label: 'Awards & nominees' }];
  return <main className="discovery-shell mx-auto max-w-6xl px-4 pb-5 sm:px-6">
    {backdropUrl && <div className="scene-background" aria-hidden="true"><img src={backdropUrl} alt="" onError={() => setBackdrop(null)} /></div>}
    <header className="flex items-center justify-between gap-3 py-3"><h1><SiteLogo /></h1><span className="hidden text-xs text-muted-foreground sm:block">Extraordinary true stories</span></header>
    <div className="grid grid-cols-3 gap-1 border-y border-border py-1" role="group" aria-label="Browsing view">
      <Button size="sm" variant={view === 'spotlight' ? 'secondary' : 'ghost'} aria-pressed={view === 'spotlight'} onClick={() => openSpotlight()}><Maximize2 />Spotlight</Button>
      <Button size="sm" variant={view === 'gallery' ? 'secondary' : 'ghost'} aria-pressed={view === 'gallery'} onClick={backToGallery}><Grid2X2 />Gallery</Button>
      <Button size="sm" variant={listFilter === 'shortlist' ? 'secondary' : 'ghost'} aria-pressed={listFilter === 'shortlist'} onClick={() => toggleList('shortlist')}><Heart className={listFilter === 'shortlist' ? 'fill-red-500 text-red-500' : ''} />Saved<span className="text-xs opacity-70">{shortlist.size}</span></Button>
    </div>
    <nav aria-label="Documentary categories" className="flex gap-1 overflow-x-auto pt-2 no-scrollbar sm:flex-wrap sm:overflow-visible">{filters.map(f => <Button key={f.id} size="sm" variant={filter === f.id ? 'default' : 'ghost'} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Button>)}</nav>
    <div className="mb-4 flex flex-wrap items-end gap-2 border-b border-border pb-3">
      <label className="min-w-40 flex-1 text-xs text-muted-foreground">Search<Input aria-label="Search title, alias or director" type="search" placeholder="Title, alias or director" value={query} onChange={e => updateQuery(e.target.value)} className="mt-1 h-8" /></label>
      <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
        <PopoverTrigger asChild><Button size="sm" variant="outline" className="self-end" aria-label="More filters"><SlidersHorizontal />Filters{activeFilters > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{activeFilters}</span>}</Button></PopoverTrigger>
        <PopoverContent align="end" className="w-72">
          <div className="space-y-3">
            <label className="block text-xs text-muted-foreground">Type<select aria-label="Film or series" className="discovery-select mt-1 w-full" value={type} onChange={e => setType(e.target.value as 'all' | 'movie' | 'tv')}><option value="all">Films & series</option><option value="movie">Films</option><option value="tv">Series</option></select></label>
            <label className="block text-xs text-muted-foreground">Order<select aria-label="Sort order" className="discovery-select mt-1 w-full" value={sort} onChange={e => setSort(e.target.value)}><option value="random">Shuffled</option><option value="curated">Curated</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="imdb">Top IMDb</option><option value="rt">Top Rotten Tomatoes</option></select></label>
            <label className="block text-xs text-muted-foreground">Era<select aria-label="Era" className="discovery-select mt-1 w-full" value={era} onChange={e => setEra(e.target.value as Era)}>{ERAS.map(([id, label]) => <option key={id} value={id}>{id === 'recent' ? 'Recent (last 2 years)' : label}</option>)}</select></label>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant={listFilter === 'watched' ? 'default' : 'outline'} aria-pressed={listFilter === 'watched'} onClick={() => toggleList('watched')}><Check />Watched · {watched.size}</Button>
              <Button size="sm" variant="outline" onClick={reshuffle}><Shuffle />Shuffle</Button>
            </div>
            {activeFilters > 0 && <Button size="sm" variant="ghost" className="w-full" onClick={clearFilters}>Clear filters</Button>}
          </div>
        </PopoverContent>
      </Popover>
      <span className="ml-auto self-end pb-2 text-xs text-muted-foreground">{list.length} titles</span>
    </div>
    {listFilter && <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{listFilter === 'shortlist' ? 'Your saved films' : 'Watched'}</span><Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => toggleList(listFilter)}>Show everything</Button></p>}
    {!film ? <div className="py-16 text-center"><p className="text-muted-foreground">No films in this selection.</p><Button variant="ghost" className="mt-3" onClick={clearFilters}>Clear filters</Button></div> : view === 'gallery' ?
      <><section aria-label="Film gallery" className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">{list.slice(0, shown).map(f => { const badges = cardBadges(SNAPSHOT[f.id]); return <div key={f.id} data-film-card={f.id} className="min-w-0">
        <div className="group relative">
          <Button variant="ghost" aria-label={`Open ${f.title}`} className="h-auto w-full p-0" onClick={() => openSpotlight(f.id)}><DocumentaryPoster film={f} src={SNAPSHOT[f.id]?.poster} small /></Button>
          {(badges.length > 0 || f.awards.length > 0) && <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-0.5 rounded-lg bg-gradient-to-t from-background/95 via-background/40 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            {badges.map(b => <span key={b} className="text-[10px] font-medium leading-tight text-foreground">{b}</span>)}
            {f.awards.length > 0 && <span className="flex items-center gap-1 text-[10px] leading-tight text-accent-foreground"><Award className="size-3" />Awards & nominations</span>}
          </div>}
        </div>
        <h2 className="mt-2 text-sm font-medium leading-snug">{f.title}</h2><p className="mt-1 text-xs text-muted-foreground">{years(f)} · {kind(f.mediaType)}{f.pending ? ' · Pending' : ''}{watched.has(f.id) ? ' · Watched' : shortlist.has(f.id) ? ' · Saved' : ''}</p>
      </div>; })}</section>{shown < list.length && <div className="mt-6 text-center"><Button variant="outline" onClick={() => setShown(n => n + PAGE)}>Show more · {list.length - shown} left</Button></div>}</> : <>
      <section id="spotlight-top" aria-label="Selected documentary" className="spotlight-grid" onTouchStart={e => { if (!canNavigate(e.target, trailerOpen)) return; const t = e.touches[0]; if (t) touch.current = { x: t.clientX, y: t.clientY }; }} onTouchEnd={e => { const t = e.changedTouches[0], start = touch.current; touch.current = null; if (t && start && !trailerOpen && Math.abs(t.clientX - start.x) > 60 && Math.abs(t.clientX - start.x) > Math.abs(t.clientY - start.y)) go(t.clientX < start.x ? 1 : -1); }}>
        <div className="spotlight-poster"><DocumentaryPoster film={film} src={extra?.poster} /></div>
        <div className="min-w-0">
          <Button size="sm" variant="ghost" className="-ml-2 w-fit" onClick={backToGallery}><ArrowLeft />Back to Gallery</Button><div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-xs font-medium uppercase text-primary"><span className="rounded-sm border border-primary/40 px-1.5 py-0.5">{kind(film.mediaType)}</span>{film.genre}{film.pending && <span className="text-muted-foreground">· Identity pending</span>}</p><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Previous film" onClick={() => go(-1)}><ArrowLeft /></Button><span className="min-w-10 text-center text-xs text-muted-foreground">{idx >= 0 ? `${idx + 1}/${list.length}` : ''}</span><Button variant="ghost" size="icon" aria-label="Next film" onClick={() => go(1)}><ArrowRight /></Button></div></div>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">{film.title}</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{years(film)}{film.director && <> · {film.director.split(', ').map((d, i, arr) => <span key={d}><button type="button" title={`See all catalogue titles by ${d}`} className="underline-offset-2 hover:text-foreground hover:underline" onClick={() => searchDirector(d)}>{d}</button>{i < arr.length - 1 ? ', ' : ''}</span>)}</>}{film.episodes ? ` · ${film.episodes} episodes` : ''}{(extra?.runtime ?? film.minutes) ? ` · ${extra?.runtime ?? film.minutes} min${film.mediaType === 'tv' ? ' per episode' : ''}` : ''}</p>{!!film.aliases?.length && <p className="mt-1 text-xs text-muted-foreground">Also known as {film.aliases.join(', ')}</p>}{!!film.parts?.length && <p className="mt-1 text-xs text-muted-foreground">{film.parts.length} films: {film.parts.join(', ')}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-accent-foreground">{extra?.rating !== undefined && <span>TMDB {extra.rating.toFixed(1)}/10 · {extra.votes?.toLocaleString()} votes</span>}{extra?.omdb?.imdb !== undefined && <span>IMDb {extra.omdb.imdb.toFixed(1)}/10</span>}{extra?.omdb?.rottenTomatoes !== undefined && <span>Rotten Tomatoes {extra.omdb.rottenTomatoes}%</span>}</div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{extra?.overview ? overviewSentences(`${extra.overview}${(extra.overview.match(/[.!?](?:\s|$)/g)?.length ?? 0) < 2 ? ` ${NOTES[film.id] ?? ''}` : ''}`) : `${film.synopsis} ${NOTES[film.id] ?? ''}`}</p>
          {!!film.awards.length && <ul className="mt-3 space-y-1">{film.awards.map(a => <li key={a} className="flex gap-2 text-xs leading-relaxed text-accent-foreground"><Award className="mt-0.5 size-3 shrink-0" />{a}</li>)}</ul>}
          {extra?.omdb?.awards && <p className="mt-2 text-xs leading-relaxed text-muted-foreground"><span className="font-medium">OMDb awards: </span>{extra.omdb.awards}</p>}
          <div className="mt-4 flex flex-wrap gap-2"><TrailerModal film={film} trailer={extra?.trailer} open={trailerOpen} onOpenChange={setTrailerOpen} /><Button variant="outline" aria-pressed={shortlist.has(film.id)} onClick={() => toggleShort(film.id)}><Heart className={shortlist.has(film.id) ? 'fill-red-500 text-red-500' : ''} />{shortlist.has(film.id) ? 'Saved' : 'Save'}</Button><Button variant="outline" aria-pressed={watched.has(film.id)} onClick={() => toggleWatched(film.id)}><Check />{watched.has(film.id) ? 'Watched' : 'Mark watched'}</Button><Button variant="outline" onClick={share}><Link2 />{copied ? 'Link copied' : 'Share'}</Button></div>
          <div className="mt-4 border-t border-border pt-3"><h3 className="mb-2 text-xs font-semibold">Watch in Ireland</h3>{providers.isFetching ? <p className="mb-2 text-xs text-muted-foreground" role="status">Checking Irish availability…</p> : !extra?.providers?.known && <p className="mb-2 text-xs text-muted-foreground">Availability unknown — check JustWatch.</p>}<div className="space-y-1"><Providers label="Subscription" items={extra?.providers?.flatrate ?? []} subscription /><Providers label="Rent" items={extra?.providers?.rent ?? []} /><Providers label="Buy" items={extra?.providers?.buy ?? []} /></div><Button asChild variant="link" size="sm" className="mt-1 h-auto px-0"><a href={extra?.providers?.link ?? justWatchLink(film)} target="_blank" rel="noreferrer">{extra?.providers?.link ? 'Check Irish availability' : 'Search JustWatch Ireland'}<ExternalLink /></a></Button></div>
          {!!extra?.backdrops?.length && <div className="mt-3 flex items-center gap-2"><span className="text-xs text-muted-foreground">Scene</span><Button variant="ghost" size="sm" aria-pressed={backdrop === null} onClick={() => setBackdrop(null)}>None</Button>{extra.backdrops.map((url, i) => <Button variant="ghost" key={url} aria-label={`Backdrop ${i + 1}`} aria-pressed={backdrop === i} className={`h-8 w-14 overflow-hidden p-0 ${backdrop === i ? 'ring-2 ring-primary' : ''}`} onClick={() => setBackdrop(i)}><img src={url} alt="" className="h-full w-full object-cover" loading="lazy" /></Button>)}</div>}
        </div>
      </section>
      <div ref={rail} aria-label="Film thumbnails" className="relative mt-4 flex gap-2 overflow-x-auto py-1 no-scrollbar">{list.map(f => <Button key={f.id} variant="ghost" aria-label={`Select ${f.title}`} aria-pressed={film.id === f.id} className={`h-auto w-12 shrink-0 p-0 sm:w-14 ${film.id === f.id ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'}`} onClick={() => setFilm(f.id)}><DocumentaryPoster film={f} src={SNAPSHOT[f.id]?.poster} small /></Button>)}</div>
    </>}
    <footer className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground"><span>{CATALOGUE.length} curated true stories.</span><Link to="/list" className="underline">All titles by category</Link><a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="underline">Film data & images: TMDB</a><a href="https://www.justwatch.com/ie" target="_blank" rel="noreferrer" className="underline">Availability: JustWatch</a><a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer" className="underline">IMDb & Rotten Tomatoes: OMDb</a><span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>{providers.isError && <span>Live availability temporarily unavailable.</span>}</footer>
  </main>;
}
