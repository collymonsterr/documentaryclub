import { useState } from 'react';
import type { Film } from '@/data/films';

export function DocumentaryPoster({ film, src, small = false }: { film: Film; src?: string | undefined; small?: boolean }) {
  const [failed, setFailed] = useState<string>();
  return <div className="film-poster">
    {src && failed !== src ? <img src={src} alt={`${film.title} poster`} loading={small ? 'lazy' : 'eager'} onError={() => setFailed(src)} className="h-full w-full object-cover" /> :
      <div className={`flex h-full flex-col justify-between whitespace-normal bg-secondary text-left ${small ? 'p-1 text-[8px]' : 'p-3 text-base'}`}>
        <span className="text-muted-foreground">{film.year}{!small && ' / DOCUMENTARY'}</span>
        <span className={`font-display leading-tight break-words ${small ? 'text-[9px]' : 'text-3xl'}`}>{film.title}</span>
        {!small && <span className="text-xs text-muted-foreground">Poster not available</span>}
      </div>}
  </div>;
}
