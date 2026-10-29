import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { makerIndex } from '@/data/discovery-facets';
import { SNAPSHOT } from '@/data/catalogue';
import { DocumentaryPoster } from '@/components/documentary-poster';
import { SiteLogo } from '@/components/site-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const base = { film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', browse: 'topics' } as const;
export const Route = createFileRoute('/makers')({
  head: () => ({ meta: [
    { title: 'Directors — Documentary Club' },
    { name: 'description', content: 'Explore the documentary filmmakers in our collection, with prolific directors first and every available title linked.' },
    { property: 'og:title', content: 'Directors — Documentary Club' },
    { property: 'og:description', content: 'Find your next documentary through the filmmakers behind the collection.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: MakersPage,
});
function MakersPage() {
  const [query, setQuery] = useState('');
  const all = makerIndex().filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
  const featured = all.filter(m => m.films.length >= 3), others = all.filter(m => m.films.length < 3);
  return <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
    <header className="flex items-center justify-between gap-2 py-3"><SiteLogo /><Button asChild size="sm" variant="ghost"><Link to="/" search={base}><ArrowLeft />Gallery</Link></Button></header>
    <div className="flex flex-wrap items-end justify-between gap-4 border-y border-border py-5"><div><h1 className="font-display text-3xl font-semibold">Directors</h1><p className="mt-1 text-sm text-muted-foreground">{makerIndex().length} filmmakers · {makerIndex().filter(m => m.films.length >= 3).length} with three or more titles</p></div><Input type="search" aria-label="Search directors" placeholder="Find a director" value={query} onChange={e => setQuery(e.target.value)} className="w-full sm:w-64" /></div>
    {!!featured.length && <section className="py-6" aria-label="Most featured makers"><h2 className="mb-4 font-display text-xl font-semibold">Most featured</h2><div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">{featured.map(m => <article key={m.name} className="min-w-0 border-b border-border pb-5">
      <Link to="/" search={{ ...base, maker: m.name }} className="group block"><div className="grid grid-cols-3 gap-1">{m.films.slice(0, 3).map(f => <DocumentaryPoster key={f.id} film={f} src={SNAPSHOT[f.id]?.poster} small />)}</div><div className="mt-3 flex items-center justify-between gap-2"><h3 className="text-lg font-semibold group-hover:text-primary">{m.name}</h3><span className="text-xs text-primary">{m.films.length} titles <ArrowRight className="inline size-3" /></span></div></Link>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{m.films.map(f => <li key={f.id}><Link to="/" search={{ ...base, film: f.id }} className="hover:text-foreground hover:underline">{f.title}</Link> <span>({f.year})</span></li>)}</ul>
    </article>)}</div></section>}
    {!!others.length && <section className="border-t border-border pt-5" aria-label="More filmmakers"><h2 className="mb-3 font-display text-xl font-semibold">More filmmakers</h2><ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{[...others].sort((a, b) => a.name.localeCompare(b.name)).map(m => <li key={m.name} className="min-w-0"><Link to="/" search={{ ...base, maker: m.name }} className="text-sm font-medium hover:text-primary">{m.name} <span className="text-xs text-muted-foreground">· {m.films.length}</span></Link><p className="mt-1 text-xs text-muted-foreground">{m.films.map((f, i) => <span key={f.id}>{i > 0 && ' · '}<Link to="/" search={{ ...base, film: f.id }} className="hover:text-foreground hover:underline">{f.title}</Link></span>)}</p></li>)}</ul></section>}
    {!all.length && <p className="py-10 text-center text-muted-foreground">No filmmakers found.</p>}
  </main>;
}