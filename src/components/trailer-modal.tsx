import type { Film } from '@/data/films';
import { trailerLink } from '@/data/films';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Play, ExternalLink } from 'lucide-react';

export function TrailerModal({ film, trailer, open, onOpenChange }: { film: Film; trailer?: string | undefined; open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild><Button><Play />Trailer</Button></DialogTrigger>
    <DialogContent className="w-[calc(100%-2rem)] max-w-3xl max-h-[90dvh] overflow-y-auto rounded-lg p-4 sm:p-6">
      <DialogTitle className="pr-6 leading-normal">{film.title} — trailer</DialogTitle>
      <DialogDescription>{trailer ? 'Trailer listed by TMDB.' : 'No verified trailer is available for inline playback.'}</DialogDescription>
      {open && trailer ? <div className="aspect-video"><iframe className="h-full w-full rounded-md" src={`https://www.youtube-nocookie.com/embed/${trailer}?autoplay=1`} title={`${film.title} official trailer`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div> : null}
      <Button asChild variant="outline" className="justify-self-start"><a href={trailer ? `https://www.youtube.com/watch?v=${trailer}` : trailerLink(film)} target="_blank" rel="noreferrer"><ExternalLink />{trailer ? 'Open on YouTube' : 'Search YouTube for trailer'}</a></Button>
    </DialogContent>
  </Dialog>;
}
