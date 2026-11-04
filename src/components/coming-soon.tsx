import { useState } from 'react';
import { Play } from 'lucide-react';
import data from '@/data/coming-soon.json';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { COUNTRIES } from '@/lib/countries';
import { softClick } from '@/lib/utils';

// /coming-soon: upcoming documentaries and ones in cinemas now, from the dated snapshot `npm run coming-soon` writes.
// One list per country, each title with a trailer and a confirmed cinema or streaming date there. Visitors see their
// country's list (the same country as the streaming picker); countries without one fall back to the US.
type Title = { tmdbId: number; type: string; title: string; directors: string[]; overview: string; poster: string; backdrop?: string; trailer: string; filmId?: string };
type Dated = { key: string; date: string; where: string };
type Upcoming = Title & Dated;
const TITLES = data.titles as Record<string, Title>;
const LISTS = data.countries as Record<string, { inCinemas: Dated[]; comingSoon: Dated[] }>;
const FALLBACK = 'US';
const nameOf = (code: string) => COUNTRIES.find(([c]) => c === code)?.[1] ?? code;
const PICKABLE = COUNTRIES.filter(([c]) => LISTS[c]);
const resolve = (xs: Dated[]) => xs.flatMap(x => TITLES[x.key] ? [{ ...TITLES[x.key]!, ...x }] : []);
export const COMING_SOON_CHECKED = data.checked;

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const month = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const checkedMonth = month(data.checked);

function Card({ item, playing, onPlay, onFilm, now }: { item: Upcoming; playing: boolean; onPlay: () => void; onFilm: (id: string) => void; now?: boolean }) {
  const title = item.filmId
    ? <a href={`/film/${item.filmId}`} onClick={softClick(() => onFilm(item.filmId!))} className="hover:underline">{item.title}</a>
    : item.title;
  return <article className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="relative aspect-video bg-secondary">
      {playing
        ? <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${item.trailer}?autoplay=1`} title={`${item.title} trailer`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        : <button type="button" onClick={onPlay} aria-label={`Play the ${item.title} trailer`} className="group absolute inset-0 grid place-items-center">
            <img src={item.backdrop ?? item.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-90" />
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105"><Play className="ml-1 h-6 w-6 fill-current" /></span>
          </button>}
    </div>
    <div className="p-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{now ? 'Out now' : day(item.date)}</span>
        <span className="text-muted-foreground">{item.where}</span>
      </p>
      <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{title}</h3>
      {item.directors.length > 0 && <p className="mt-0.5 text-sm text-muted-foreground">{item.type === 'tv' ? 'Created by' : 'Directed by'} {item.directors.join(', ')}</p>}
      {item.overview && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground/85">{item.overview}</p>}
    </div>
  </article>;
}

export function ComingSoon({ onFilm, country, onCountry }: { onFilm: (id: string) => void; country: string; onCountry: (code: string) => void }) {
  const [playing, setPlaying] = useState('');
  const [view, setView] = useState<'soon' | 'now'>('soon');
  const shown = LISTS[country] ? country : FALLBACK;
  const lists = LISTS[shown]!;
  const inCinemas = resolve(lists.inCinemas), comingSoon = resolve(lists.comingSoon);
  const months = new Map<string, Upcoming[]>();
  for (const item of comingSoon) months.set(month(item.date), [...(months.get(month(item.date)) ?? []), item]);
  const grid = 'mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3';
  const pill = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/80 hover:border-primary/60'}`;
  const card = (item: Upcoming, now = false) => <Card key={item.key} item={item} now={now} playing={playing === item.key} onPlay={() => setPlaying(item.key)} onFilm={onFilm} />;
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
        <div className={grid}>{items.map(item => card(item))}</div>
      </div>)}
    </section>
    <section className={view === 'now' ? 'mt-6' : 'hidden'}>
      <h2 className="sr-only">In cinemas now</h2>
      {inCinemas.length === 0 && <p className="text-muted-foreground">No documentaries in cinemas there right now that we know of.</p>}
      <div className={grid}>{inCinemas.map(item => card(item, true))}</div>
    </section>
    <NewsletterSignup source="soon" title="Never miss a new documentary" body="Get one pick every week by email, plus the best new releases as they land." className="mt-12" />
  </div>;
}
