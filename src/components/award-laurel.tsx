import { accolades } from '@/data/discovery-facets';
import type { Film } from '@/data/films';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AwardLaurel({ film }: { film: Film }) {
  const awards = accolades(film);
  if (!awards.length) return null;
  const won = awards.some(a => a.result === 'Won');
  return <TooltipProvider><Tooltip><TooltipTrigger asChild>
    <span tabIndex={0} aria-label={awards.map(a => `${a.label} · ${a.result}`).join('; ')} className={`absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full border bg-background/95 ${won ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'}`}>
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="size-6">
        <path d="M14 27C5 24 3 15 8 6M18 27C27 24 29 15 24 6" stroke="currentColor" strokeWidth="1.4" />
        <g fill={won ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.1">
          <path d="M7 9C3 8 3 5 4 3C8 4 9 6 7 9ZM6 15C2 14 1 11 2 9C6 10 8 12 6 15ZM8 21C3 22 1 19 1 17C6 16 8 18 8 21ZM12 25C8 28 5 26 4 24C8 21 11 22 12 25ZM25 9C29 8 29 5 28 3C24 4 23 6 25 9ZM26 15C30 14 31 11 30 9C26 10 24 12 26 15ZM24 21C29 22 31 19 31 17C26 16 24 18 24 21ZM20 25C24 28 27 26 28 24C24 21 21 22 20 25Z" />
        </g>
      </svg>
    </span>
  </TooltipTrigger><TooltipContent className="max-w-64">{awards.map(a => <p key={a.label}>{a.label} · {a.result}</p>)}</TooltipContent></Tooltip></TooltipProvider>;
}