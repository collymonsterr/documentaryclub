import { Link } from '@tanstack/react-router';
import { SNAPSHOT } from '@/data/catalogue';
import { AWARDS, awardFor, byAward } from '@/data/discovery-facets';
import type { AwardBody } from '@/data/award-bodies';
import type { Film } from '@/data/films';
import { AwardCaption, AwardIcon } from '@/components/award-icons';
import { DocumentaryPoster } from '@/components/documentary-poster';
import { ScrollRow } from '@/components/scroll-row';
import { Button } from '@/components/ui/button';
import { softClick } from '@/lib/utils';
import { documentaryCount } from '@/lib/site-urls';

const base = { film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', tag: '', browse: 'topics' } as const;
const ROW = 12;

// One row per award, led by winners; rows under three titles stay behind their pill.
export function AwardsList({ films, onSeeAll }: { films: Film[]; onSeeAll: (award: string) => void }) {
  const rows = AWARDS.map(a => ({ ...a, films: byAward(films.filter(f => awardFor(f, a.id)), a.id) })).filter(r => r.films.length >= 3);
  return <div>
    <h1 className="font-display text-2xl font-semibold">Awards</h1>
    <p className="mt-1 text-sm text-muted-foreground">Award winners and Oscar nominees from the collection.</p>
    {rows.map(r => <section key={r.id} aria-label={r.label} className="border-b border-border py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AwardIcon body={r.id as AwardBody} className="size-5" />
          <h3 className="font-display text-xl font-semibold">{r.label}</h3>
          <span className="text-sm text-muted-foreground">{documentaryCount(r.films.length)}</span>
        </div>
        <Button asChild variant="link" size="sm" className="h-auto shrink-0 p-0">
          <Link to="/" search={{ ...base, award: r.id, browse: 'awards' }} onClick={softClick(() => onSeeAll(r.id))}>See all</Link>
        </Button>
      </div>
      <ScrollRow label={`${r.label} documentaries`} className="mt-4">
        {r.films.slice(0, ROW).map(f => <Link key={f.id} to="/" search={{ ...base, film: f.id }} className="group w-[min(34vw,9rem)] shrink-0 sm:w-36">
          <DocumentaryPoster film={f} src={SNAPSHOT[f.id]?.poster} small />
          <span className="mt-1.5 block line-clamp-2 text-xs font-medium group-hover:text-primary">{f.title}</span>
          <AwardCaption film={f} body={r.id as AwardBody} />
        </Link>)}
      </ScrollRow>
    </section>)}
    {!rows.length && <p className="py-10 text-center text-muted-foreground">No award winners in this selection.</p>}
  </div>;
}
