import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CATEGORIES } from '@/data/films';
import { CATALOGUE } from '@/data/catalogue';
import { firstSentence } from '@/lib/discovery';
import { SiteLogo } from '@/components/site-logo';

const kind = (m?: string) => m === 'tv' ? 'Series' : m === 'collection' ? 'Film series' : 'Film';
const years = (f: { year: number; yearEnd?: number }) => f.yearEnd ? `${f.year}–${f.yearEnd}` : String(f.year);

// Plain, crawlable catalogue page: every title under its single home category, each linking to its Spotlight view.
// Semantic HTML with anchor navigation so both people and AI crawlers can parse the structure.
export const Route = createFileRoute('/list')({
  head: () => ({ meta: [
    { title: `All ${CATALOGUE.length} documentaries by category — Documentary Club` },
    { name: 'description', content: 'The complete Documentary Club catalogue: curated documentary films and series grouped by category, with years, formats, summaries and direct links to each title.' },
    { property: 'og:title', content: 'Documentary Club — full catalogue by category' },
    { property: 'og:description', content: 'Browse every curated documentary film and series by category.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: ListPage,
});

function ListPage() {
  return <main className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
    <header className="flex items-center justify-between gap-3 py-3">
      <h1><SiteLogo /></h1>
      <Link to="/" search={{ film: '', q: '', list: '' }} className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"><ArrowLeft className="size-3" />Back to discovery</Link>
    </header>
    <p className="border-b border-border pb-3 text-xs leading-relaxed text-muted-foreground">{CATALOGUE.length} curated documentary films and series, grouped by subject — every title has exactly one home category. Every title links to its full details, trailer and Irish streaming availability.</p>
    <nav aria-label="Jump to category" className="sticky top-0 z-10 -mx-4 flex flex-wrap gap-x-3 gap-y-1 border-b border-border bg-background px-4 py-2 text-xs sm:-mx-6 sm:px-6">
      {CATEGORIES.map(c => <a key={c.id} href={`#${c.id}`} className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">{c.label}</a>)}
    </nav>
    {CATEGORIES.map(c => {
      const films = CATALOGUE.filter(f => f.categories.includes(c.id)).sort((a, b) => a.title.localeCompare(b.title));
      return <section key={c.id} id={c.id} aria-label={c.label} className="mt-4 scroll-mt-24 rounded-lg border border-border bg-card/40 p-4">
        <h2 className="font-display text-xl">{c.label} <span className="text-sm text-muted-foreground">· {films.length}</span></h2>
        <ul className="mt-2 space-y-3">
          {films.map(f => <li key={f.id}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link to="/" search={{ film: f.id, q: '', list: '' }} className="font-medium text-foreground underline-offset-2 hover:underline">{f.title}</Link>
              <span className="text-xs text-muted-foreground">{years(f)} · {kind(f.mediaType)}{f.director && <> · {f.director.split(', ').map((d, i, arr) => <span key={d}><Link to="/" search={{ film: '', q: d, list: '' }} className="underline-offset-2 hover:text-foreground hover:underline">{d}</Link>{i < arr.length - 1 ? ', ' : ''}</span>)}</>}</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{firstSentence(f.synopsis)}</p>
          </li>)}
        </ul>
      </section>;
    })}
  </main>;
}
