import type { Film } from '@/data/films';
import { trailerLink } from '@/data/films';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink } from 'lucide-react';

// Inline theatre player: the YouTube iframe mounts only after the user presses play.
export function TrailerPlayer({ film, trailer, backdrop, playing, onPlay }: { film: Film; trailer?: string | undefined; backdrop?: string | undefined; playing: boolean; onPlay: () => void }) {
  if (!trailer) return <div className="mt-6"><Button asChild variant="outline"><a href={trailerLink(film)} target="_blank" rel="noreferrer"><ExternalLink />Search YouTube for trailer</a></Button></div>;
  return <section aria-label="Trailer" className="mt-6">
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-card">
      {playing ? <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${trailer}?autoplay=1`} title={`${film.title} official trailer`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> :
        <button type="button" onClick={onPlay} aria-label={`Play ${film.title} trailer`} className="group absolute inset-0 grid place-items-center">
          {backdrop && <img src={backdrop} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105"><Play className="ml-1 h-7 w-7 fill-current" /></span>
          <span className="absolute bottom-3 left-4 text-sm font-medium">Watch trailer</span>
        </button>}
    </div>
  </section>;
}
