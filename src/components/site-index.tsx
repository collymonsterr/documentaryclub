import { useRouter } from '@tanstack/react-router';
import { listGroups, routedHref } from '@/lib/site-urls';
import { softClick } from '@/lib/utils';

const GROUPS = listGroups().filter(g => g.label !== 'Directors' && g.label !== 'Awards');
// The long "If you liked…" group takes two columns, so it closes the last row instead of sitting alone beside a gap.
const WIDE = new Set(['If you liked…']);

// The footer's crawlable index of the main lists: every page links to every hub.
export function SiteIndex() {
  const router = useRouter();
  return <nav aria-label="Documentary lists" className="mt-10 grid gap-x-6 gap-y-4 border-t border-border pt-6 text-xs sm:grid-cols-2 lg:grid-cols-4">
    {GROUPS.map(g => <div key={g.label} className={WIDE.has(g.label) ? 'sm:col-span-2' : undefined}>
      <h2 className="mb-1.5 font-medium text-foreground">{g.label}</h2>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
        {g.items.map(i => <li key={i.path}><a href={i.path} className="hover:text-foreground hover:underline" onClick={softClick(() => { void router.navigate({ href: routedHref(i.path) }); window.scrollTo(0, 0); })}>{i.label}</a></li>)}
      </ul>
    </div>)}
  </nav>;
}
