import { accolades } from '@/data/discovery-facets';
import type { Film } from '@/data/films';
import { AwardIcon } from '@/components/award-icons';
import { pagePath } from '@/lib/site-urls';
import { softClick } from '@/lib/utils';

// Each label links to its award's page, as a real link so search engines follow it.
export function AwardBadges({ film, onAward }: { film: Film; onAward: (body: string) => void }) {
  const awards = accolades(film);
  if (!awards.length) return null;
  return <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Awards and nominations">
    {awards.map(a => {
      const style = `inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${a.result === 'Won' ? 'border-primary/40 bg-primary/15 text-foreground' : 'border-border text-muted-foreground'}`;
      const href = pagePath({ award: a.body });
      return <li key={a.label}>
        {href
          ? <a href={href} className={`${style} hover:border-primary`} onClick={softClick(() => onAward(a.body))}><AwardIcon body={a.body} />{a.label}</a>
          : <span className={style}><AwardIcon body={a.body} />{a.label}</span>}
      </li>;
    })}
  </ul>;
}
