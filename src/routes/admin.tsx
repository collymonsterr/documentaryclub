import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { ExternalLink, Film as FilmIcon, Pencil, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminStats } from '@/components/admin-stats';
import { SimplePage } from '@/components/simple-page';
import { SNAPSHOT } from '@/data/catalogue';
import { CATEGORIES } from '@/data/films';
import { MOODS } from '@/data/discovery-facets';
import { loadCloud } from '@/hooks/use-cloud-sync';
import { ADMIN_TAGS, trailerId, type AdminEdit, type AdminFilm } from '@/lib/admin-edit';
import { loadAdmin, saveFilm } from '@/lib/admin.functions';
import { staticPageHead } from '@/lib/site-urls';
import { excludeThisDevice } from '@/lib/stats-client';
import { cn } from '@/lib/utils';

// The owner's editing page: Editor's Choice, tags, category, moods and trailers. Saves go to GitHub as commits on main,
// which sync to Lovable; they reach the live site at the next publish. Not linked from anywhere, noindex, and every
// call is checked on the server against the owner's Google account.
export const Route = createFileRoute('/admin')({
  head: () => staticPageHead('Admin', 'Editing page for the site owner.', '/admin', { noindex: true }),
  component: Admin,
});

const LOVABLE = 'https://lovable.dev/projects/0a664d3a-65d9-43f6-9549-8ea0ef11bc3e';
const PAGE = 60;
type Cloud = Awaited<ReturnType<typeof loadCloud>>;
type Filter = 'all' | 'editors-choice' | 'no-trailer';
const hasTrailer = (f: AdminFilm) => Boolean(f.trailer || SNAPSHOT[f.id]?.trailer);

function Admin() {
  const load = useServerFn(loadAdmin), save = useServerFn(saveFilm);
  const [cloud, setCloud] = useState<Cloud | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [films, setFilms] = useState<AdminFilm[] | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean; saved?: boolean } | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [cat, setCat] = useState('');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [editing, setEditing] = useState('');
  const [busy, setBusy] = useState('');
  // Stats or film editing; remembered on this device.
  const [view, setViewState] = useState<'stats' | 'films'>('stats');
  useEffect(() => { try { if (localStorage.getItem('dc-admin-view') === 'films') setViewState('films'); } catch { /* storage blocked */ } }, []);
  const setView = (v: 'stats' | 'films') => { setViewState(v); try { localStorage.setItem('dc-admin-view', v); } catch { /* storage blocked */ } };

  // Firebase loads on arrival so the Google popup can open straight from the tap (iPhone and iPad block it otherwise).
  useEffect(() => {
    let off = () => {};
    loadCloud().then((c) => { setCloud(c); off = c.auth.onAuthStateChanged(c.authInstance, setUser); }, () => setMessage({ text: "Sign-in isn't available right now.", error: true }));
    return () => off();
  }, []);
  useEffect(() => {
    if (!user) { setFilms(null); return; }
    // The owner's own browsing shouldn't show up in the site counts.
    excludeThisDevice();
    user.getIdToken().then((token) => load({ data: { token } })).then((r) => {
      if (r.ok) setFilms(r.films); else setMessage({ text: r.reason, error: true });
    }, () => setMessage({ text: "Couldn't load the catalogue.", error: true }));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = () => cloud && cloud.auth.signInWithPopup(cloud.authInstance, new cloud.auth.GoogleAuthProvider()).catch(() => {});
  const submit = async (edit: AdminEdit) => {
    if (!user) return false;
    setBusy(edit.id);
    setMessage(null);
    const r = await save({ data: { token: await user.getIdToken(), edit } }).catch(() => ({ ok: false as const, reason: 'Saving failed. Check your connection.' }));
    setBusy('');
    if (!r.ok) { setMessage({ text: r.reason, error: true }); return false; }
    const trailer = trailerId(edit.trailer) ?? '';
    setFilms((fs) => fs?.map((f) => (f.id === edit.id ? { ...f, category: edit.category, tags: edit.tags, moods: edit.moods, trailer } : f)) ?? null);
    setMessage({ text: `Saved ${r.summary}.`, saved: true });
    return true;
  };
  const toggleTag = (f: AdminFilm, tag: string) => submit({ id: f.id, category: f.category, moods: f.moods, trailer: f.trailer, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (films ?? []).filter((f) =>
      (filter === 'all' || (filter === 'no-trailer' ? !hasTrailer(f) : f.tags.includes(filter))) &&
      (!cat || f.category === cat) && (!q || f.title.toLowerCase().includes(q)));
  }, [films, filter, cat, query]);
  useEffect(() => setShown(PAGE), [filter, cat, query]);
  const count = (fl: Filter) => (films ?? []).filter((f) => (fl === 'no-trailer' ? !hasTrailer(f) : fl === 'all' || f.tags.includes(fl))).length;

  return <SimplePage title="Admin" wide>
    {user === undefined ? <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      : !user ? <div className="mt-4 space-y-3 text-sm">
        <p className="text-muted-foreground">Sign in with the site owner's Google account to edit the catalogue.</p>
        <Button onClick={signIn} disabled={!cloud}>{cloud ? 'Sign in with Google' : 'Loading…'}</Button>
      </div>
      : <>
        <p className="mt-2 text-sm text-muted-foreground">Signed in as {user.email}. <button className="underline underline-offset-4" onClick={() => cloud?.auth.signOut(cloud.authInstance)}>Sign out</button></p>
        {message && <div role="status" className={cn('sticky top-2 z-10 mt-4 rounded-lg border px-3 py-2 text-sm shadow-sm', message.error ? 'border-destructive/50 bg-background text-destructive' : 'border-primary/40 bg-background')}>
          {message.text}{message.saved && <> It goes live when you <a href={LOVABLE} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4">publish on Lovable <ExternalLink className="inline size-3" /></a> (a minute after saving).</>}
        </div>}
        <div className="mt-4 flex gap-2 border-b border-border pb-3">
          {(['stats', 'films'] as const).map((v) => <Button key={v} size="sm" variant={view === v ? 'default' : 'ghost'} aria-pressed={view === v} onClick={() => setView(v)}>{v === 'stats' ? 'Stats' : 'Edit films'}</Button>)}
        </div>
        {view === 'stats' ? cloud && <AdminStats cloud={cloud} user={user} />
        : !films ? (!message?.error && <p className="mt-4 text-sm text-muted-foreground">Loading the catalogue…</p>) : <>
          <div className="mt-5 flex flex-wrap gap-2">
            {([['all', 'All'], ['editors-choice', "Editor's Choice"], ['no-trailer', 'No trailer']] as const).map(([id, label]) =>
              <Button key={id} size="sm" variant={filter === id ? 'default' : 'outline'} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label} <span className="opacity-70">{count(id)}</span></Button>)}
          </div>
          <div className="mt-3 flex gap-2">
            <Input type="search" placeholder="Search titles" aria-label="Search titles" value={query} onChange={(e) => setQuery(e.target.value)} className="h-9 min-w-0 flex-1" />
            <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
            </select>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{list.length} titles</p>
          <ul className="mt-2 space-y-2">
            {list.slice(0, shown).map((f) => <li key={f.id} className="rounded-lg border border-border bg-card/40 p-3">
              <div className="flex gap-3">
                {SNAPSHOT[f.id]?.poster ? <img src={SNAPSHOT[f.id]!.poster} alt="" loading="lazy" className="h-[72px] w-12 shrink-0 rounded object-cover" /> : <div className="h-[72px] w-12 shrink-0 rounded bg-muted" />}
                <div className="min-w-0 flex-1">
                  <a href={`/film/${f.id}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">{f.title}</a>
                  <span className="text-sm text-muted-foreground"> {f.year} · {f.category}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{[...f.moods, ...f.tags.map((t) => ADMIN_TAGS.find((x) => x.id === t)?.label ?? (t === 'free-on-youtube' ? 'Free on YouTube' : t))].join(' · ')}{!hasTrailer(f) && <span className="text-destructive"> · No trailer</span>}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant={f.tags.includes('editors-choice') ? 'default' : 'outline'} aria-pressed={f.tags.includes('editors-choice')} disabled={busy === f.id} onClick={() => toggleTag(f, 'editors-choice')}>
                      <Star className={f.tags.includes('editors-choice') ? 'fill-current' : ''} />Editor's Choice
                    </Button>
                    <Button size="sm" variant="ghost" aria-expanded={editing === f.id} onClick={() => setEditing(editing === f.id ? '' : f.id)}><Pencil />Edit</Button>
                  </div>
                </div>
              </div>
              {editing === f.id && <EditFilm film={f} busy={busy === f.id} onCancel={() => setEditing('')} onSave={async (edit) => { if (await submit(edit)) setEditing(''); }} />}
            </li>)}
          </ul>
          {shown < list.length && <Button className="mt-4" variant="outline" onClick={() => setShown((n) => n + PAGE)}>Show more</Button>}
        </>}
      </>}
  </SimplePage>;
}

function Chips({ options, selected, onToggle }: { options: { id: string; label: string }[]; selected: string[]; onToggle: (id: string) => void }) {
  return <div className="flex flex-wrap gap-1.5">
    {options.map((o) => <button key={o.id} type="button" aria-pressed={selected.includes(o.id)} onClick={() => onToggle(o.id)}
      className={cn('rounded-full border px-2.5 py-1 text-xs', selected.includes(o.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary')}>{o.label}</button>)}
  </div>;
}

function EditFilm({ film, busy, onSave, onCancel }: { film: AdminFilm; busy: boolean; onSave: (edit: AdminEdit) => void; onCancel: () => void }) {
  const [category, setCategory] = useState(film.category);
  const [tags, setTags] = useState(film.tags);
  const [moods, setMoods] = useState(film.moods);
  const [trailer, setTrailer] = useState(film.trailer);
  const toggle = (set: (fn: (xs: string[]) => string[]) => void) => (id: string) => set((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const id = trailerId(trailer);
  const current = SNAPSHOT[film.id]?.trailer;
  return <form className="mt-3 space-y-4 border-t border-border pt-3 text-sm" onSubmit={(e) => { e.preventDefault(); onSave({ id: film.id, category, tags, moods, trailer }); }}>
    <label className="block"><span className="mb-1 block font-medium">Category</span>
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2">
        {CATEGORIES.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
      </select>
    </label>
    <div><span className="mb-1 block font-medium">Moods</span><Chips options={MOODS.map((m) => ({ id: m.label, label: m.label }))} selected={moods} onToggle={toggle(setMoods)} /></div>
    <div><span className="mb-1 block font-medium">Tags</span><Chips options={ADMIN_TAGS.map((t) => ({ id: t.id, label: t.label }))} selected={tags} onToggle={toggle(setTags)} />
      {film.tags.includes('free-on-youtube') && <p className="mt-1 text-xs text-muted-foreground">Free on YouTube follows the film's YouTube link, so it stays as it is.</p>}</div>
    <label className="block"><span className="mb-1 block font-medium">Trailer (YouTube link)</span>
      <Input value={trailer} onChange={(e) => setTrailer(e.target.value)} placeholder={current ? `Using TMDB's: ${current}` : 'Paste a YouTube link'} className="h-9" />
      {id === null ? <span className="mt-1 block text-xs text-destructive">That isn't a YouTube link.</span>
        : (id || current) && <a href={`https://www.youtube.com/watch?v=${id || current}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4"><FilmIcon className="size-3" />Check this trailer</a>}
      <span className="mt-1 block text-xs text-muted-foreground">Leave empty to use TMDB's trailer.</span>
    </label>
    <div className="flex gap-2">
      <Button type="submit" size="sm" disabled={busy || id === null}>{busy ? 'Saving…' : 'Save'}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
    </div>
  </form>;
}
