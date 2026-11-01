import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CATALOGUE } from '@/data/catalogue';
import { SiteLogo } from '@/components/site-logo';

const base = { film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', tag: '', browse: 'topics' } as const;
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function directorIndex() {
  const map = new Map<string, typeof CATALOGUE>();
  for (const f of CATALOGUE) for (const d of (f.director ?? '').split(', ').map(s => s.trim()).filter(Boolean)) {
    map.set(d, [...(map.get(d) ?? []), f]);
  }
  return [...map.entries()].map(([name, films]) => ({ name, films: [...films].sort((a, b) => b.year - a.year) }))
    .sort((a, b) => b.films.length - a.films.length || a.name.localeCompare(b.name));
}

export const Route = createFileRoute('/directors')({
  head: () => ({ meta: [
    { title: 'Directors — Documentary Club' },
    { name: 'description', content: 'Every director in the Documentary Club catalogue, ranked by how many of their documentaries are in the collection.' },
    { property: 'og:title', content: 'Documentary Club — directors' },
    { property: 'og:description', content: 'The filmmakers behind the catalogue, most prolific first.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: DirectorsPage,
});

function DirectorsPage() {
  const all = directorIndex();
  const multi = all.filter(d => d.films.length > 1);
  const single = all.filter(d => d.films.length === 1);
  return <main className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
    <header className="flex items-center justify-between gap-3 py-3">
      <h1><SiteLogo /></h1>
      <Link to="/makers" className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"><ArrowLeft className="size-3" />Browse Makers</Link>
    </header>
    <p className="border-b border-border pb-3 text-xs text-muted-foreground">{all.length} directors · {multi.length} with two or more titles. Click a name to filter the gallery.</p>
    <section aria-label="Most featured directors" className="mt-4 rounded-lg border border-border bg-card/40 p-4">
      <h2 className="font-display text-xl">Most featured</h2>
      <ul className="mt-3 space-y-4">
        {multi.map(d => <li key={d.name} id={slug(d.name)} className="scroll-mt-4">
          <div className="flex items-baseline gap-2">
            <Link to="/" search={{ ...base, q: d.name }} className="font-medium text-foreground underline-offset-2 hover:underline">{d.name}</Link>
            <span className="text-xs text-primary">{d.films.length}</span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {d.films.map((f, i) => <span key={f.id}><Link to="/" search={{ ...base, film: f.id }} className="underline-offset-2 hover:text-foreground hover:underline">{f.title}</Link> ({f.year}){i < d.films.length - 1 ? ' · ' : ''}</span>)}
          </p>
        </li>)}
      </ul>
    </section>
    <section aria-label="Other directors" className="mt-4 rounded-lg border border-border bg-card/40 p-4">
      <h2 className="font-display text-xl">Everyone else <span className="text-sm text-muted-foreground">· {single.length}</span></h2>
      <ul className="mt-3 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        {[...single].sort((a, b) => a.name.localeCompare(b.name)).map(d => <li key={d.name}>
          <Link to="/" search={{ ...base, q: d.name }} className="text-foreground underline-offset-2 hover:underline">{d.name}</Link>
          <span className="text-muted-foreground"> — <Link to="/" search={{ ...base, film: d.films[0]!.id }} className="underline-offset-2 hover:text-foreground hover:underline">{d.films[0]!.title}</Link></span>
        </li>)}
      </ul>
    </section>
  </main>;
}
