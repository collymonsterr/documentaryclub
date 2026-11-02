import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CATEGORIES } from '@/data/films';
import { CATALOGUE } from '@/data/catalogue';
import { firstSentence } from '@/lib/discovery';
import { CopyLink } from '@/components/copy-link';
import { SiteLogo } from '@/components/site-logo';
import { staticPageHead } from '@/lib/site-urls';

const kind = (m?: string) => m === 'tv' ? 'Series' : m === 'collection' ? 'Film series' : 'Film';
const years = (f: { year: number; yearEnd?: number }) => f.yearEnd ? `${f.year}–${f.yearEnd}` : String(f.year);

// Plain, crawlable catalogue page: every title under its single home category, each linking to its Spotlight view.
// Semantic HTML with anchor navigation so both people and AI crawlers can parse the structure.
export const Route = createFileRoute('/list')({
  head: () => staticPageHead('All documentaries by category', 'Every documentary in the collection, grouped by subject.', '/list'),
  component: ListPage,
});

function ListPage() {
  return <main className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
    <header className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div><SiteLogo /></div>
      <CopyLink className="ml-auto" />
      <Link to="/" search={{ film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', tag: '', browse: 'topics' }} className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"><ArrowLeft className="size-3" />Back to discovery</Link>
    </header>
    <h1 className="font-display text-2xl font-semibold">All {CATALOGUE.length} documentaries by category</h1>
    <p className="mt-1 border-b border-border pb-3 text-xs leading-relaxed text-muted-foreground">{CATALOGUE.length} curated documentary films and series, grouped by subject — every title has exactly one home category. Every title links to its full details, trailer and streaming availability.</p>
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
              <Link to="/" search={{ film: f.id, q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', tag: '', browse: 'topics' }} className="font-medium text-foreground underline-offset-2 hover:underline">{f.title}</Link>
              <span className="text-xs text-muted-foreground">{years(f)} · {kind(f.mediaType)}{f.director && <> · {f.director.split(', ').map((d, i, arr) => <span key={d}><Link to="/" search={{ film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: d, tag: '', browse: 'directors' }} className="underline-offset-2 hover:text-foreground hover:underline">{d}</Link>{i < arr.length - 1 ? ', ' : ''}</span>)}</>}</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{firstSentence(f.synopsis)}</p>
          </li>)}
        </ul>
      </section>;
    })}
  </main>;
}
