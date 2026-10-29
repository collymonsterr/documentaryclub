import { Award } from 'lucide-react';
import { accolades } from '@/data/discovery-facets';
import type { Film } from '@/data/films';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AwardBadges({ film }: { film: Film }) {
  const awards = accolades(film);
  if (!awards.length) return null;
  return <TooltipProvider><div className="mt-3 flex flex-wrap gap-1.5" aria-label="Awards and nominations">
    {awards.map(a => <Tooltip key={a.label}><TooltipTrigger asChild>
      <span tabIndex={0} className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${a.result === 'Won' ? 'border-primary/40 bg-primary/15 text-primary' : 'border-primary/40 text-accent-foreground'}`}>
        <Award className="size-3" />{a.facet.startsWith('oscar') ? 'Academy Award' : a.facet.startsWith('sundance') ? 'Sundance' : a.label.split(' — ')[0]} · {a.result}
      </span></TooltipTrigger><TooltipContent className="max-w-72"><p>{a.label} ({a.result}) · {a.source}</p></TooltipContent></Tooltip>)}
  </div></TooltipProvider>;
}