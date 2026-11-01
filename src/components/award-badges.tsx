import { accolades } from '@/data/discovery-facets';
import type { Film } from '@/data/films';
import { AwardIcon } from '@/components/award-icons';

export function AwardBadges({ film }: { film: Film }) {
  const awards = accolades(film);
  if (!awards.length) return null;
  return <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Awards and nominations">
    {awards.map(a => <li key={a.label} className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${a.result === 'Won' ? 'border-primary/40 bg-primary/15 text-foreground' : 'border-border text-muted-foreground'}`}>
      <AwardIcon body={a.body} />{a.label}
    </li>)}
  </ul>;
}
