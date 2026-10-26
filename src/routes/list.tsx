import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CATEGORIES } from '@/data/films';
import { CATALOGUE } from '@/data/catalogue';
import { overviewSentences } from '@/lib/discovery';

const kind = (m?: string) => m === 'tv' ? 'Series' : m === 'collection' ? 'Film series' : 'Film';
const years = (f: { year: number; yearEnd?: number }) => f.yearEnd ? `${f.year}–${f.yearEnd}` : String(f.year);

// Plain, crawlable catalogue page: every title grouped by category, each linking to its Spotlight view.
// Titles with multiple subject tags appear under each of their categories.
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
      <h1 className="font-display text-2xl sm:text-3xl">Documentary <em className="text-primary">Club</em></h1>
      <Link to="/" search={{ film: '', q: '', list: '' }} className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"><ArrowLeft className="size-3" />Back to discovery</Link>
    </header>
    <p className="border-b border-border pb-3 text-xs leading-relaxed text-muted-foreground">{CATALOGUE.length} curated documentary films and series, grouped by subject — every title has exactly one home category. Every title links to its full details, trailer and Irish streaming availability.</p>
    {CATEGORIES.map(c => {
      const films = CATALOGUE.filter(f => f.categories.includes(c.id)).sort((a, b) => a.title.localeCompare(b.title));
      return <section key={c.id} aria-label={c.label} className="mt-6">
        <h2 className="font-display text-xl">{c.label} <span className="text-sm text-muted-foreground">· {films.length}</span></h2>
        <ul className="mt-2 space-y-3">
          {films.map(f => <li key={f.id}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link to="/" search={{ film: f.id, q: '', list: '' }} className="font-medium text-foreground underline-offset-2 hover:underline">{f.title}</Link>
              <span className="text-xs text-muted-foreground">{years(f)} · {kind(f.mediaType)}{f.director ? ` · ${f.director}` : ''}</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{overviewSentences(f.synopsis)}</p>
          </li>)}
        </ul>
      </section>;
    })}
  </main>;
}
