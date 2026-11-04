import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { ExternalLink, UserRound } from 'lucide-react';
import { SNAPSHOT } from '@/data/catalogue';
import { isFeatured, makerIndex } from '@/data/discovery-facets';
import profiles from '@/data/director-profiles.json';
import { DocumentaryPoster } from '@/components/documentary-poster';
import { ScrollRow } from '@/components/scroll-row';
import { slugify } from '@/lib/site-urls';

type Profile = { photo?: string; imdbId?: string; wikipedia?: string; blurb: string };
const PROFILES: Record<string, Profile> = profiles;
const base = { film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', tag: '', like: '', soon: '', browse: 'topics' } as const;
const titles = (n: number) => `${n} ${n === 1 ? 'documentary' : 'documentaries'}`;
const ProfileLink = ({ href, label }: { href: string; label: string }) =>
  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">{label}<ExternalLink className="size-3" /></a>;

function Portrait({ name }: { name: string }) {
  const photo = PROFILES[name]?.photo;
  return photo ? <img src={photo} alt={name} loading="lazy" className="size-16 shrink-0 rounded-full object-cover sm:size-20" /> :
    <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground sm:size-20"><UserRound className="size-7" /></span>;
}
function ProfileLinks({ name, children }: { name: string; children?: ReactNode }) {
  const p = PROFILES[name];
  if (!children && !p?.imdbId && !p?.wikipedia) return null;
  return <div className="mt-1.5 flex items-center gap-3">
    {children}
    {p?.imdbId && <ProfileLink href={`https://www.imdb.com/name/${p.imdbId}/`} label="IMDb" />}
    {p?.wikipedia && <ProfileLink href={p.wikipedia} label="Wikipedia" />}
  </div>;
}
// The top of a director's own page, /directors/x.
export function DirectorHeader({ name, count }: { name: string; count: number }) {
  return <div className="flex min-w-0 items-start gap-4">
    <Portrait name={name} />
    <div className="min-w-0">
      <h1 className="font-display text-2xl font-semibold">{name}</h1>
      <p className="text-sm text-muted-foreground">{titles(count)}</p>
      {PROFILES[name]?.blurb && <p className="mt-1 max-w-2xl text-sm">{PROFILES[name].blurb}</p>}
      <ProfileLinks name={name} />
    </div>
  </div>;
}

// Featured directors get a full section; everyone else stays in the compact list.
export function DirectorsList({ query }: { query: string }) {
  const hash = useLocation({ select: l => l.hash });
  useEffect(() => { if (hash) document.getElementById(hash)?.scrollIntoView(); }, [hash]);
  const every = makerIndex(), all = every.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
  const featured = all.filter(isFeatured), others = all.filter(m => !isFeatured(m)).sort((a, b) => a.name.localeCompare(b.name));
  return <div>
    <h1 className="font-display text-2xl font-semibold">Directors</h1>
    <p className="mt-1 text-sm text-muted-foreground">{every.length} filmmakers, most featured first.</p>
    {featured.map(m => {
      const p = PROFILES[m.name];
      return <section key={m.name} id={slugify(m.name)} aria-label={m.name} className="scroll-mt-44 border-b border-border py-6">
        <div className="flex items-start gap-4">
          <Portrait name={m.name} />
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold"><Link to="/" search={{ ...base, maker: m.name, browse: 'directors' }} className="hover:text-primary">{m.name}</Link></h3>
            <p className="text-sm text-muted-foreground">{titles(m.films.length)}</p>
            {p?.blurb && <p className="mt-1 max-w-2xl text-sm">{p.blurb}</p>}
            <ProfileLinks name={m.name}>
              <Link to="/" search={{ ...base, maker: m.name, browse: 'directors' }} className="text-xs text-primary underline-offset-2 hover:underline">See all</Link>
            </ProfileLinks>
          </div>
        </div>
        <ScrollRow label={`Documentaries by ${m.name}`} className="mt-4">
          {m.films.map(f => <Link key={f.id} to="/" search={{ ...base, film: f.id }} className="group w-[min(34vw,9rem)] shrink-0 sm:w-36">
            <DocumentaryPoster film={f} src={SNAPSHOT[f.id]?.poster} small />
            <span className="mt-1.5 block line-clamp-2 text-xs font-medium group-hover:text-primary">{f.title}</span>
            <span className="block text-xs text-muted-foreground">{f.year}</span>
          </Link>)}
        </ScrollRow>
      </section>;
    })}
    {!!others.length && <section className="pt-6" aria-label="More filmmakers">
      <h2 className="mb-3 font-display text-xl font-semibold">More filmmakers</h2>
      <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{others.map(m => <li key={m.name} id={slugify(m.name)} className="min-w-0 scroll-mt-44">
        <Link to="/" search={{ ...base, maker: m.name, browse: 'directors' }} className="text-sm font-medium hover:text-primary">{m.name} <span className="text-xs text-muted-foreground">· {m.films.length}</span></Link>
        <p className="mt-1 text-xs text-muted-foreground">{m.films.map((f, i) => <span key={f.id}>{i > 0 && ' · '}<Link to="/" search={{ ...base, film: f.id }} className="hover:text-foreground hover:underline">{f.title}</Link></span>)}</p>
      </li>)}</ul>
    </section>}
    {!all.length && <p className="py-10 text-center text-muted-foreground">No filmmakers found.</p>}
  </div>;
}
