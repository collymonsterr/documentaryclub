import { useState } from 'react';
import { Play } from 'lucide-react';
import data from '@/data/coming-soon.json';
import { NewsletterSignup } from '@/components/newsletter-signup';
import { softClick } from '@/lib/utils';

// /coming-soon: upcoming documentaries and ones in cinemas now, from the dated snapshot `npm run coming-soon` writes.
// Only titles with a trailer and a confirmed cinema or streaming date in Ireland, the UK or the US are in it.
type Upcoming = (typeof data.comingSoon)[number] & { filmId?: string; backdrop?: string };
export const COMING_SOON_CHECKED = data.checked;
export const comingSoonCount = data.comingSoon.length + data.inCinemas.length;

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

export function ComingSoon({ onFilm }: { onFilm: (id: string) => void }) {
  const [playing, setPlaying] = useState('');
  const months = new Map<string, Upcoming[]>();
  for (const item of data.comingSoon as Upcoming[]) months.set(month(item.date), [...(months.get(month(item.date)) ?? []), item]);
  const grid = 'mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3';
  return <div>
    <h1 className="font-display text-3xl font-semibold">Upcoming Documentaries</h1>
    <p className="mt-3 max-w-2xl leading-relaxed text-foreground/90">New documentaries heading to cinemas and streaming in Ireland, the UK and the US, with their trailers. Only films with a confirmed release date are listed, and the list is checked every month (last checked {checkedMonth}).</p>
    {data.inCinemas.length > 0 && <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold">In cinemas now</h2>
      <div className={grid}>{(data.inCinemas as Upcoming[]).map(item => <Card key={item.tmdbId} item={item} now playing={playing === `n${item.tmdbId}`} onPlay={() => setPlaying(`n${item.tmdbId}`)} onFilm={onFilm} />)}</div>
    </section>}
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">Coming soon</h2>
      {[...months].map(([name, items]) => <div key={name} className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">{name}</h3>
        <div className={grid}>{items.map(item => <Card key={item.tmdbId} item={item} playing={playing === `s${item.tmdbId}`} onPlay={() => setPlaying(`s${item.tmdbId}`)} onFilm={onFilm} />)}</div>
      </div>)}
    </section>
    <NewsletterSignup source="soon" title="Never miss a new documentary" body="Get one pick every week by email, plus the best new releases as they land." className="mt-12" />
  </div>;
}
