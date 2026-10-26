import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, Grid2X2, Maximize2, ExternalLink, Award } from 'lucide-react';
import { CATEGORIES, FILMS, justWatchLink, type Category } from '@/data/films';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentaryPoster } from '@/components/documentary-poster';
import { TrailerModal } from '@/components/trailer-modal';
import { useTracking } from '@/hooks/use-tracking';
import { canNavigate, filterYears, overviewSentences, TRACKING_KEYS, type Provider } from '@/lib/discovery';
import { getTmdbCatalogue } from '@/lib/tmdb.functions';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Documentary Club — Discover extraordinary true stories' },
    { name: 'description', content: 'Explore 17 curated documentaries, documented festival awards, official trailers and streaming availability in Ireland.' },
    { property: 'og:title', content: 'Documentary Club — Extraordinary true stories' },
    { property: 'og:description', content: 'Discover curated documentaries in Spotlight or Gallery, save your favourites and find Irish streaming options.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Index,
});
type Filter = 'all' | Category | 'shortlist' | 'watched' | 'awards';
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
  const [view, setView] = useState<'spotlight' | 'gallery'>('spotlight');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState(FILMS[0]?.id ?? '');
  const [shortlist, toggleShort] = useTracking(TRACKING_KEYS.shortlist);
  const [watched, toggleWatched] = useTracking(TRACKING_KEYS.watched);
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [decade, setDecade] = useState('all'); const [sort, setSort] = useState('curated');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [backdrop, setBackdrop] = useState<number | null>(null);
  const fetchCatalogue = useServerFn(getTmdbCatalogue);
  // Optional enrichment must never block the curated, zero-login first screen.
  const enrichment = useQuery({ queryKey: ['tmdb-catalogue'], queryFn: () => fetchCatalogue(), staleTime: 6 * 60 * 60_000, retry: false });
  const list = useMemo(() => filterYears(FILMS.filter(f => filter === 'all' ? true : filter === 'shortlist' ? shortlist.has(f.id) : filter === 'watched' ? watched.has(f.id) : filter === 'awards' ? f.awards.length > 0 : f.categories.includes(filter)), from ? Number(from) : undefined, to ? Number(to) : undefined, decade, sort), [filter, shortlist, watched, from, to, decade, sort]);
  const film = list.find(f => f.id === selectedId) ?? list[0];
  const idx = list.findIndex(f => f.id === film?.id);
  const extra = film ? enrichment.data?.[film.id] : undefined;
  const backdropUrl = backdrop === null ? undefined : extra?.backdrops[backdrop];
  const go = useCallback((direction: number) => {
    if (!list.length) return;
    const next = list[(Math.max(idx, 0) + direction + list.length) % list.length];
    if (next) setSelectedId(next.id);
  }, [list, idx]);
  useEffect(() => { setBackdrop(null); }, [film?.id]);
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
  const filters: { id: Filter; label: string }[] = [{ id: 'all', label: 'All films' }, ...CATEGORIES, { id: 'awards', label: 'Awards & nominees' }, { id: 'shortlist', label: `Shortlist · ${shortlist.size}` }, { id: 'watched', label: `Watched · ${watched.size}` }];
  return <main className="discovery-shell mx-auto max-w-6xl px-4 pb-5 sm:px-6">
    {backdropUrl && <div className="scene-background" aria-hidden="true"><img src={backdropUrl} alt="" onError={() => setBackdrop(null)} /></div>}
    <header className="flex items-center justify-between gap-3 py-3"><h1 className="font-display text-2xl sm:text-3xl">Documentary <em className="text-primary">Club</em></h1><span className="hidden text-xs text-muted-foreground sm:block">Extraordinary true stories</span></header>
    <div className="grid grid-cols-2 gap-1 border-y border-border py-1" role="group" aria-label="Browsing view">
      <Button size="sm" variant={view === 'spotlight' ? 'secondary' : 'ghost'} aria-pressed={view === 'spotlight'} onClick={() => setView('spotlight')}><Maximize2 />Spotlight</Button>
      <Button size="sm" variant={view === 'gallery' ? 'secondary' : 'ghost'} aria-pressed={view === 'gallery'} onClick={() => setView('gallery')}><Grid2X2 />Gallery</Button>
    </div>
    <nav aria-label="Documentary categories" className="flex gap-1 overflow-x-auto py-2 no-scrollbar">{filters.map(f => <Button key={f.id} size="sm" variant={filter === f.id ? 'default' : 'ghost'} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Button>)}</nav>
    <div className="mb-4 flex flex-wrap items-end gap-2 border-b border-border pb-3">
      <label className="text-xs text-muted-foreground">From<Input aria-label="From year" type="number" min="1900" max="2100" placeholder="Any" value={from} onChange={e => setFrom(e.target.value)} className="mt-1 h-8 w-24" /></label>
      <label className="text-xs text-muted-foreground">To<Input aria-label="To year" type="number" min="1900" max="2100" placeholder="Any" value={to} onChange={e => setTo(e.target.value)} className="mt-1 h-8 w-24" /></label>
      <label className="text-xs text-muted-foreground">Decade<select aria-label="Decade" className="discovery-select" value={decade} onChange={e => setDecade(e.target.value)}><option value="all">All decades</option><option value="2010">2010s</option><option value="2020">2020s</option></select></label>
      <label className="text-xs text-muted-foreground">Order<select aria-label="Year sorting" className="discovery-select" value={sort} onChange={e => setSort(e.target.value)}><option value="curated">Curated</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <span className="ml-auto self-end pb-2 text-xs text-muted-foreground">{list.length} films</span>
    </div>
    {!film ? <div className="py-16 text-center"><p className="text-muted-foreground">No films in this selection.</p><Button variant="ghost" className="mt-3" onClick={() => { setFilter('all'); setFrom(''); setTo(''); setDecade('all'); }}>Clear filters</Button></div> : view === 'gallery' ?
      <section aria-label="Film gallery" className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">{list.map(f => <div key={f.id} className="min-w-0"><Button variant="ghost" aria-label={`Open ${f.title}`} className="h-auto w-full p-0" onClick={() => { setSelectedId(f.id); setView('spotlight'); }}><DocumentaryPoster film={f} src={enrichment.data?.[f.id]?.poster} small /></Button><h2 className="mt-2 text-sm font-medium leading-snug">{f.title}</h2><p className="mt-1 text-xs text-muted-foreground">{f.year}{watched.has(f.id) ? ' · Watched' : shortlist.has(f.id) ? ' · Shortlisted' : ''}</p>{f.awards.length > 0 && <p className="mt-1 flex items-center gap-1 text-xs text-accent-foreground"><Award className="size-3" />Awards & nominations</p>}</div>)}</section> : <>
      <section aria-label="Selected documentary" className="spotlight-grid" onTouchStart={e => { if (!canNavigate(e.target, trailerOpen)) return; const t = e.touches[0]; if (t) touch.current = { x: t.clientX, y: t.clientY }; }} onTouchEnd={e => { const t = e.changedTouches[0], start = touch.current; touch.current = null; if (t && start && !trailerOpen && Math.abs(t.clientX - start.x) > 60 && Math.abs(t.clientX - start.x) > Math.abs(t.clientY - start.y)) go(t.clientX < start.x ? 1 : -1); }}>
        <div className="spotlight-poster"><DocumentaryPoster film={film} src={extra?.poster} /></div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium uppercase text-primary">{film.genre}</p><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Previous film" onClick={() => go(-1)}><ArrowLeft /></Button><span className="min-w-10 text-center text-xs text-muted-foreground">{idx + 1}/{list.length}</span><Button variant="ghost" size="icon" aria-label="Next film" onClick={() => go(1)}><ArrowRight /></Button></div></div>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">{film.title}</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{film.year} · {film.director}{(extra?.runtime ?? film.minutes) ? ` · ${extra?.runtime ?? film.minutes} min` : ''}</p>
          <p className="mt-2 text-xs text-accent-foreground">{extra?.rating !== undefined ? `TMDB user rating ${extra.rating.toFixed(1)}/10 · ${extra.votes?.toLocaleString()} votes` : 'TMDB rating not available'}</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{extra?.overview ? overviewSentences(extra.overview) : `${film.synopsis} ${NOTES[film.id] ?? ''}`}</p>
          {!!film.awards.length && <ul className="mt-3 space-y-1">{film.awards.map(a => <li key={a} className="flex gap-2 text-xs leading-relaxed text-accent-foreground"><Award className="mt-0.5 size-3 shrink-0" />{a}</li>)}</ul>}
          <div className="mt-4 flex flex-wrap gap-2"><TrailerModal film={film} trailer={extra?.trailer} open={trailerOpen} onOpenChange={setTrailerOpen} /><Button variant="outline" aria-pressed={shortlist.has(film.id)} onClick={() => toggleShort(film.id)}><Bookmark className={shortlist.has(film.id) ? 'fill-primary text-primary' : ''} />{shortlist.has(film.id) ? 'Shortlisted' : 'Shortlist'}</Button><Button variant="outline" aria-pressed={watched.has(film.id)} onClick={() => toggleWatched(film.id)}><Check />{watched.has(film.id) ? 'Watched' : 'Mark watched'}</Button></div>
          <div className="mt-4 border-t border-border pt-3"><h3 className="mb-2 text-xs font-semibold">Watch in Ireland</h3>{!extra?.providers.known && <p className="mb-2 text-xs text-muted-foreground">Availability unknown — check JustWatch.</p>}<div className="space-y-1"><Providers label="Subscription" items={extra?.providers.flatrate ?? []} subscription /><Providers label="Rent" items={extra?.providers.rent ?? []} /><Providers label="Buy" items={extra?.providers.buy ?? []} /></div><Button asChild variant="link" size="sm" className="mt-1 h-auto px-0"><a href={extra?.providers.link ?? justWatchLink(film)} target="_blank" rel="noreferrer">{extra?.providers.link ? 'Check Irish availability' : 'Search JustWatch Ireland'}<ExternalLink /></a></Button></div>
          {!!extra?.backdrops.length && <div className="mt-3 flex items-center gap-2"><span className="text-xs text-muted-foreground">Scene</span><Button variant="ghost" size="sm" aria-pressed={backdrop === null} onClick={() => setBackdrop(null)}>None</Button>{extra.backdrops.map((url, i) => <Button variant="ghost" key={url} aria-label={`Backdrop ${i + 1}`} aria-pressed={backdrop === i} className={`h-8 w-14 overflow-hidden p-0 ${backdrop === i ? 'ring-2 ring-primary' : ''}`} onClick={() => setBackdrop(i)}><img src={url} alt="" className="h-full w-full object-cover" loading="lazy" /></Button>)}</div>}
        </div>
      </section>
      <div ref={rail} aria-label="Film thumbnails" className="relative mt-4 flex gap-2 overflow-x-auto py-1 no-scrollbar">{list.map(f => <Button key={f.id} variant="ghost" aria-label={`Select ${f.title}`} aria-pressed={film.id === f.id} className={`h-auto w-12 shrink-0 p-0 sm:w-14 ${film.id === f.id ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'}`} onClick={() => setSelectedId(f.id)}><DocumentaryPoster film={f} src={enrichment.data?.[f.id]?.poster} small /></Button>)}</div>
    </>}
    <footer className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground"><span>17 curated true stories.</span><a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="underline">Film data & images: TMDB</a><a href="https://www.justwatch.com/ie" target="_blank" rel="noreferrer" className="underline">Availability: JustWatch</a><span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>{enrichment.isFetching && <span role="status">Loading film details…</span>}{(enrichment.isError || extra?.status === 'unavailable') && <span>Live film data temporarily unavailable.</span>}</footer>
  </main>;
}
