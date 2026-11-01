import type { ReactNode } from 'react';
import { awardFor, topAwards } from '@/data/discovery-facets';
import { awardColor, type AwardBody } from '@/data/award-bodies';
import type { Film } from '@/data/films';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Simple generic shapes, deliberately not the organisations' logos.
const GLYPHS: Record<AwardBody, ReactNode> = {
  oscar: <><path fill="currentColor" d="m8 1.5 1.5 3.2 3.5.4-2.6 2.4.7 3.4L8 9.7l-3.1 1.7.7-3.4L3 5.1l3.5-.4z" /><path stroke="currentColor" strokeWidth="1.5" d="M4.5 14h7" /></>,
  bafta: <><path stroke="currentColor" strokeWidth="1.4" d="M3 3c3 1.2 7 1.2 10 0v5c0 3-2.2 5.5-5 6-2.8-.5-5-3-5-6z" /><path fill="currentColor" d="M5 6.5h2.2v1.3H5zM8.8 6.5H11v1.3H8.8z" /></>,
  emmy: <><circle cx="8" cy="8" r="1.8" fill="currentColor" /><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" strokeWidth="1.3" transform="rotate(35 8 8)" /><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" strokeWidth="1.3" transform="rotate(-35 8 8)" /></>,
  cannes: <><path stroke="currentColor" strokeWidth="1.4" d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" /><circle cx="8" cy="8" r="2" fill="currentColor" /></>,
  sundance: <><path fill="currentColor" d="M3.5 11a4.5 4.5 0 0 1 9 0z" /><path stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" d="M1 13.5h14M8 2.5v1.8M2.7 5.2 4 6.5M13.3 5.2 12 6.5" /></>,
  tribeca: <><rect x="2" y="3" width="12" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><path stroke="currentColor" strokeWidth="1.4" d="M5 3v10M11 3v10M2 8h3M11 8h3" /></>,
  ida: <><rect x="1.5" y="4.5" width="9" height="7.5" rx="1.2" fill="currentColor" /><path fill="currentColor" d="m11.5 7.5 3-2v5.5l-3-2z" /></>,
  other: <><circle cx="8" cy="6" r="4.3" stroke="currentColor" strokeWidth="1.4" /><path stroke="currentColor" strokeWidth="1.4" d="M6 10l-1 4.5L8 13l3 1.5-1-4.5" /></>,
};
export const AwardIcon = ({ body, className = 'size-3.5' }: { body: AwardBody; className?: string }) =>
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`shrink-0 ${className}`} style={{ color: awardColor(body) }}>{GLYPHS[body]}</svg>;

// Solid ring for a win, dashed for a nomination.
export function AwardIcons({ film }: { film: Film }) {
  const top = topAwards(film);
  if (!top.length) return null;
  const summary = top.map(a => a.label);
  return <TooltipProvider><Tooltip><TooltipTrigger asChild>
    <span tabIndex={0} aria-label={summary.join('; ')} className="absolute bottom-2 left-2 flex gap-1">
      {top.map(a => <span key={a.body} className={`flex size-7 items-center justify-center rounded-full border bg-background/95 ${a.result === 'Won' ? '' : 'border-dashed'}`} style={{ borderColor: awardColor(a.body) }}>
        <AwardIcon body={a.body} className="size-4" />
      </span>)}
    </span>
  </TooltipTrigger><TooltipContent className="max-w-64">{summary.map(l => <p key={l}>{l}</p>)}</TooltipContent></Tooltip></TooltipProvider>;
}

// Gold ring for a win, silver for a nomination, then the one award that earned the film its place in this list.
export function AwardCaption({ film, body }: { film: Film; body: AwardBody }) {
  const award = awardFor(film, body);
  if (!award) return null;
  return <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-4 text-muted-foreground">
    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${award.result === 'Won' ? 'border-[#f4c430]' : 'border-dashed border-[#c0c0c0]'}`}><AwardIcon body={body} className="size-3" /></span>
    <span className="min-w-0 line-clamp-2" title={award.label}>{award.label.replace(' – Best Documentary Feature', '')}</span>
  </p>;
}
