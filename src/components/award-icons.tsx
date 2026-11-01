import type { ReactNode } from 'react';
import { topAwards } from '@/data/discovery-facets';
import { awardColor, type AwardBody } from '@/data/award-bodies';
import type { Film } from '@/data/films';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Simple generic shapes, deliberately not the organisations' logos.
const GLYPHS: Record<AwardBody, ReactNode> = {
  oscar: <><path fill="currentColor" d="m8 1.5 1.5 3.2 3.5.4-2.6 2.4.7 3.4L8 9.7l-3.1 1.7.7-3.4L3 5.1l3.5-.4z" /><path stroke="currentColor" strokeWidth="1.5" d="M4.5 14h7" /></>,
  bafta: <><path stroke="currentColor" strokeWidth="1.4" d="M3 3c3 1.2 7 1.2 10 0v5c0 3-2.2 5.5-5 6-2.8-.5-5-3-5-6z" /><path fill="currentColor" d="M5 6.5h2.2v1.3H5zM8.8 6.5H11v1.3H8.8z" /></>,
  emmy: <><circle cx="8" cy="8" r="1.8" fill="currentColor" /><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" strokeWidth="1.3" transform="rotate(35 8 8)" /><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" strokeWidth="1.3" transform="rotate(-35 8 8)" /></>,
  cannes: <><path stroke="currentColor" strokeWidth="1.4" d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" /><circle cx="8" cy="8" r="2" fill="currentColor" /></>,
  berlin: <><circle cx="3.8" cy="4" r="2" fill="currentColor" /><circle cx="12.2" cy="4" r="2" fill="currentColor" /><circle cx="8" cy="8.8" r="5.3" fill="currentColor" /><circle cx="8" cy="10.3" r="1.1" fill="#1a1512" /></>,
  sundance: <><path fill="currentColor" d="M3.5 11a4.5 4.5 0 0 1 9 0z" /><path stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" d="M1 13.5h14M8 2.5v1.8M2.7 5.2 4 6.5M13.3 5.2 12 6.5" /></>,
  tiff: <><rect x="2" y="3" width="12" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><path stroke="currentColor" strokeWidth="1.4" d="M5 3v10M11 3v10M2 8h3M11 8h3" /></>,
  ida: <><rect x="1.5" y="4.5" width="9" height="7.5" rx="1.2" fill="currentColor" /><path fill="currentColor" d="m11.5 7.5 3-2v5.5l-3-2z" /></>,
  critics: <path fill="currentColor" d="M2.5 3h11a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H7l-3 2.5v-2.5H2.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />,
  peabody: <><circle cx="8" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="6" r="1.7" fill="currentColor" /><path fill="currentColor" d="m5.5 10 -1.2 4.5L8 12.7l3.7 1.8L10.5 10z" /></>,
  dga: <path fill="currentColor" d="M2 6.5v3h2l1.2 4h1.6l-.8-4h1L13 12.5v-9L7 6.5zM14 6.5v3a1.5 1.5 0 0 0 0-3Z" />,
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
