import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Play } from 'lucide-react';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { COUNTRIES } from '@/lib/countries';
import { softClick } from '@/lib/utils';
import { UPCOMING_CHECKED, UPCOMING_FALLBACK, UPCOMING_LISTS, UPCOMING_TITLES, resolveUpcoming, upcomingDates, upcomingKey, type Upcoming } from '@/data/upcoming';

// /coming-soon: upcoming documentaries and ones in cinemas now, from the dated snapshot `npm run coming-soon` writes.
// One list per country, each title with a trailer and a confirmed cinema or streaming date there. Visitors see their
// country's list (the same country as the streaming picker); countries without one fall back to the US.
// Each title also has its own page, /coming-soon/{slug}, with the trailer, more detail and its date in every country.
const nameOf = (code: string) => COUNTRIES.find(([c]) => c === code)?.[1] ?? code;
const PICKABLE = COUNTRIES.filter(([c]) => UPCOMING_LISTS[c]);
export const COMING_SOON_CHECKED = UPCOMING_CHECKED;

const at = (d: string) => new Date(`${d}T12:00:00Z`);
const day = (d: string) => at(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const fullDay = (d: string) => at(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const month = (d: string) => at(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const checkedMonth = month(UPCOMING_CHECKED);
const hours = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
const pagePathOf = (slug: string) => `/coming-soon/${slug}`;

function Trailer({ item, playing, onPlay, large }: { item: Upcoming; playing: boolean; onPlay: () => void; large?: boolean }) {
  const still = large && item.backdrop ? item.backdrop.replace('/w780/', '/w1280/') : item.backdrop ?? item.poster;
  return <div className="relative aspect-video bg-secondary">
    {playing
      ? <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${item.trailer}?autoplay=1`} title={`${item.title} trailer`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      : <button type="button" onClick={onPlay} aria-label={`Play the ${item.title} trailer`} className="group absolute inset-0 grid place-items-center">
          <img src={still} alt="" loading={large ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90" />
          <span className={`relative grid place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105 ${large ? 'h-20 w-20' : 'h-14 w-14'}`}><Play className={`ml-1 fill-current ${large ? 'h-8 w-8' : 'h-6 w-6'}`} /></span>
        </button>}
  </div>;
}

// The trailer plays in place; the rest of the card opens the title's own page.
function Card({ item, playing, onPlay, onOpen, now }: { item: Upcoming; playing: boolean; onPlay: () => void; onOpen: (slug: string) => void; now: boolean }) {
  return <article className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50">
    <Trailer item={item} playing={playing} onPlay={onPlay} />
    <div className="relative p-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{now ? 'Out now' : day(item.date)}</span>
        <span className="text-muted-foreground">{item.where}</span>
      </p>
      <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
        <a href={pagePathOf(item.slug)} onClick={softClick(() => onOpen(item.slug))} className="after:absolute after:inset-0 hover:underline">{item.title}</a>
      </h3>
      {item.directors.length > 0 && <p className="mt-0.5 text-sm text-muted-foreground">{item.type === 'tv' ? 'Created by' : 'Directed by'} {item.directors.join(', ')}</p>}
      {item.overview && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground/85">{item.overview}</p>}
      <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">More info<ArrowRight className="size-4" aria-hidden /></p>
    </div>
  </article>;
}

const GRID = 'mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3';

type Nav = { country: string; onCountry: (code: string) => void; onOpen: (slug: string) => void };

export function ComingSoon({ country, onCountry, onOpen }: Nav) {
  const [playing, setPlaying] = useState('');
  const [view, setView] = useState<'soon' | 'now'>('soon');
  const shown = UPCOMING_LISTS[country] ? country : UPCOMING_FALLBACK;
  const lists = UPCOMING_LISTS[shown]!;
  const inCinemas = resolveUpcoming(lists.inCinemas), comingSoon = resolveUpcoming(lists.comingSoon);
  const months = new Map<string, Upcoming[]>();
  for (const item of comingSoon) months.set(month(item.date), [...(months.get(month(item.date)) ?? []), item]);
  const pill = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/80 hover:border-primary/60'}`;
  const card = (item: Upcoming, now = false) => <Card key={item.key} item={item} now={now} playing={playing === item.key} onPlay={() => setPlaying(item.key)} onOpen={onOpen} />;
  return <div>
    <h1 className="font-display text-3xl font-semibold">Upcoming Documentaries</h1>
    <p className="mt-3 max-w-2xl leading-relaxed text-foreground/90">New documentaries heading to cinemas and streaming, with their trailers. Only films with a confirmed release date are listed, and the list is checked every month (last checked {checkedMonth}).</p>
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <label className="flex items-center gap-2 text-muted-foreground">Release dates for
        <select value={shown} onChange={e => onCountry(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1 font-semibold text-foreground">
          {PICKABLE.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </label>
      {shown !== country && <span className="text-muted-foreground">No confirmed dates for {nameOf(country)} yet, so these are the US ones.</span>}
    </div>
    <div className="mt-5 flex gap-2" role="group" aria-label="Show">
      <button type="button" aria-pressed={view === 'soon'} onClick={() => { setView('soon'); setPlaying(''); }} className={pill(view === 'soon')}>Coming soon ({comingSoon.length})</button>
      <button type="button" aria-pressed={view === 'now'} onClick={() => { setView('now'); setPlaying(''); }} className={pill(view === 'now')}>In cinemas now ({inCinemas.length})</button>
    </div>
    {/* Both lists are server-rendered; the switch only hides one. */}
    <section className={view === 'soon' ? 'mt-6' : 'hidden'}>
      <h2 className="sr-only">Coming soon</h2>
      {comingSoon.length === 0 && <p className="text-muted-foreground">Nothing confirmed for the next six months yet.</p>}
      {[...months].map(([name, items]) => <div key={name} className="mt-6 first:mt-0">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">{name}</h3>
        <div className={GRID}>{items.map(item => card(item))}</div>
      </div>)}
    </section>
    <section className={view === 'now' ? 'mt-6' : 'hidden'}>
      <h2 className="sr-only">In cinemas now</h2>
      {inCinemas.length === 0 && <p className="text-muted-foreground">No documentaries in cinemas there right now that we know of.</p>}
      <div className={GRID}>{inCinemas.map(item => card(item, true))}</div>
    </section>
    <NewsletterSignup source="soon" title="Never miss a new documentary" body="Get one pick every week by email, plus the best new releases as they land." className="mt-12" />
  </div>;
}

// One upcoming title's page: the trailer, everything TMDB knows about it, and its date in every country we track.
export function UpcomingPage({ slug, country, onOpen, onBack, onFilm }: Nav & { slug: string; onBack: () => void; onFilm: (id: string) => void }) {
  const [playing, setPlaying] = useState('');
  const key = upcomingKey(slug) ?? '';
  useEffect(() => { setPlaying(''); window.scrollTo(0, 0); }, [slug]);
  const title = UPCOMING_TITLES[key];
  if (!title) return null;
  const dates = upcomingDates(key).sort((a, b) => Number(b.now) - Number(a.now) || a.date.localeCompare(b.date) || nameOf(a.country).localeCompare(nameOf(b.country)));
  const mine = dates.find(d => d.country === country);
  const item: Upcoming = { ...title, key, date: mine?.date ?? dates[0]?.date ?? '', where: mine?.where ?? '' };
  // More from the visitor's list (or the US one), coming soon first.
  const lists = UPCOMING_LISTS[country] ?? UPCOMING_LISTS[UPCOMING_FALLBACK]!;
  const more = [...resolveUpcoming(lists.comingSoon).map(x => ({ x, now: false })), ...resolveUpcoming(lists.inCinemas).map(x => ({ x, now: true }))].filter(({ x }) => x.key !== key).slice(0, 6);
  const meta = [title.type === 'tv' ? 'Documentary series' : 'Documentary', ...(title.genres ?? []), title.runtime ? hours(title.runtime) : '', title.network ?? ''].filter(Boolean);
  const facts: [string, string][] = [
    ...(title.directors.length ? [[title.type === 'tv' ? 'Created by' : 'Directed by', title.directors.join(', ')] as [string, string]] : []),
    ...(title.featuring?.length ? [['Featuring', title.featuring.join(', ')] as [string, string]] : []),
    ...(title.originalTitle ? [['Original title', title.originalTitle] as [string, string]] : []),
    ...(title.language ? [['Language', title.language] as [string, string]] : []),
    ...(title.madeIn?.length ? [['Made in', title.madeIn.join(', ')] as [string, string]] : []),
  ];
  return <div>
    <a href="/coming-soon" onClick={softClick(onBack)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden />Coming soon</a>
    <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div className="overflow-hidden rounded-lg border border-border"><Trailer item={item} large playing={playing === key} onPlay={() => setPlaying(key)} /></div>
        <h1 className="mt-6 font-display text-3xl font-semibold leading-tight sm:text-4xl">{title.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{meta.join(' · ')}</p>
        {title.tagline && <p className="mt-4 font-display text-lg italic text-foreground/85">{title.tagline}</p>}
        {title.overview && <p className="mt-4 max-w-2xl leading-relaxed text-foreground/90">{title.overview}</p>}
        {facts.length > 0 && <dl className="mt-6 grid max-w-2xl gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
          {facts.map(([label, value]) => <div key={label} className="contents"><dt className="text-muted-foreground">{label}</dt><dd className="text-foreground/90">{value}</dd></div>)}
        </dl>}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          {title.filmId && <a href={`/film/${title.filmId}`} onClick={softClick(() => onFilm(title.filmId!))} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-primary-foreground hover:opacity-90">See it in the collection<ArrowRight className="size-4" aria-hidden /></a>}
          <a href={`https://www.youtube.com/watch?v=${title.trailer}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 font-medium hover:border-primary/60">Trailer on YouTube<ExternalLink className="size-4" aria-hidden /></a>
          {title.imdbId && <a href={`https://www.imdb.com/title/${title.imdbId}/`} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 font-medium hover:border-primary/60">IMDb<ExternalLink className="size-4" aria-hidden /></a>}
        </div>
      </div>
      <aside className="h-fit rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-xl font-semibold">Release dates</h2>
        {mine
          ? <div className="mt-3 rounded-md bg-primary/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{nameOf(country)}</p>
              <p className="mt-1 font-semibold">{mine.now ? `Out now (since ${day(mine.date)})` : fullDay(mine.date)}</p>
              <p className="text-sm text-muted-foreground">{mine.where}</p>
            </div>
          : <p className="mt-3 text-sm text-muted-foreground">No confirmed date for {nameOf(country)} yet.</p>}
        {dates.filter(d => d.country !== country).length > 0 && <ul className="mt-4 divide-y divide-border text-sm">
          {dates.filter(d => d.country !== country).map(d => <li key={d.country} className="flex items-baseline justify-between gap-3 py-2">
            <span>{nameOf(d.country)}<span className="block text-xs text-muted-foreground">{d.where}</span></span>
            <span className="shrink-0 font-medium">{d.now ? 'Out now' : day(d.date)}</span>
          </li>)}
        </ul>}
        <p className="mt-4 text-xs text-muted-foreground">Confirmed cinema and streaming dates from TMDB, checked {checkedMonth}.</p>
      </aside>
    </div>
    {more.length > 0 && <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold">More coming soon</h2>
      <div className={GRID}>{more.map(({ x, now }) => <Card key={x.key} item={x} now={now} playing={playing === x.key} onPlay={() => setPlaying(x.key)} onOpen={onOpen} />)}</div>
    </section>}
    <NewsletterSignup source="soon" title="Never miss a new documentary" body="Get one pick every week by email, plus the best new releases as they land." className="mt-12" />
  </div>;
}
