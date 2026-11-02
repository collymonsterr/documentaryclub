import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CATALOGUE, SNAPSHOT } from '@/data/catalogue';
import { DocumentaryPoster } from '@/components/documentary-poster';
import { SiteLogo } from '@/components/site-logo';
import { listGroups, routedHref, selectionFilms, staticPageHead } from '@/lib/site-urls';
import { breadcrumbs } from '@/lib/structured-data';
import { softClick } from '@/lib/utils';

const GROUPS = listGroups();
const SEARCH = { film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', tag: '', browse: 'topics' };
// The hub for every ranked list, so each one is a click from one page and the sitemap.
export const Route = createFileRoute('/best')({
  head: () => staticPageHead('The Best Documentary Lists', `Every ranked list in the collection, by subject, mood, topic and director, drawn from ${CATALOGUE.length} hand-picked documentaries.`, '/best', { jsonLd: [breadcrumbs([['Home', '/'], ['Best documentary lists', '/best']])] }),
  component: BestPage,
});

function BestPage() {
  const router = useRouter();
  const go = (path: string) => softClick(() => { void router.navigate({ href: routedHref(path) }); });
  return <main className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
    <header className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div><SiteLogo /></div>
      <Link to="/" search={SEARCH} className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"><ArrowLeft className="size-3" />Back to discovery</Link>
    </header>
    <h1 className="mt-4 font-display text-3xl font-semibold">The best documentary lists</h1>
    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Every list here comes from the same {CATALOGUE.length} hand-picked documentaries, ranked by my own favourites first and then by what IMDb and Rotten Tomatoes audiences and critics make of them.</p>
    {GROUPS.map(g => <section key={g.label} aria-label={g.label} className="mt-8">
      <h2 className="mb-3 font-display text-xl font-semibold">{g.label}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {g.items.map(i => {
          const top = selectionFilms(i.search).slice(0, 3);
          return <li key={i.path}>
            <a href={i.path} onClick={go(i.path)} className="group flex items-center gap-3 rounded-lg border border-border bg-card/40 p-3 hover:border-primary">
              {!!top.length && <span className="flex shrink-0 -space-x-4">{top.map(f => <span key={f.id} className="w-10"><DocumentaryPoster film={f} src={SNAPSHOT[f.id]?.poster} small /></span>)}</span>}
              <span className="min-w-0">
                <span className="block text-sm font-medium group-hover:text-primary">{i.title}</span>
                <span className="block text-xs text-muted-foreground">{i.count} documentaries</span>
              </span>
            </a>
          </li>;
        })}
      </ul>
    </section>)}
  </main>;
}
