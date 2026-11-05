import { useServerFn } from '@tanstack/react-start';
import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { CATALOGUE, SNAPSHOT } from '@/data/catalogue';
import type { loadCloud } from '@/hooks/use-cloud-sync';
import { kitStats } from '@/lib/stats.functions';
import { dayRange, statDay, summarise, type Metric, type StatDoc, type Summary } from '@/lib/stats';
import { cn } from '@/lib/utils';

// The owner's Stats tab on /admin: anonymous site counts (Firestore stats/*), accounts (users/*, owner-readable)
// and email subscribers (Kit, summarised on the server). Reads only; nothing here changes data.
type Cloud = Awaited<ReturnType<typeof loadCloud>>;
type Kit = { total: number; active: number; byDay: Record<string, number>; byState: Record<string, number>; bySource: Record<string, number> };
type Accounts = { total: number; activeInRange: number; saved: { k: string; n: number }[]; watched: { k: string; n: number }[] };
const RANGES = [7, 30, 90] as const;
const TITLES = new Map(CATALOGUE.map((f) => [f.id, f.title]));
const GA = 'https://analytics.google.com/analytics/web/#/a414317970p561815501/reports/intelligenthome';
const LOVABLE = 'https://lovable.dev/projects/0a664d3a-65d9-43f6-9549-8ea0ef11bc3e?view=more&subview=newAnalytics';
const FILM_COLUMNS: { m: Metric; label: string }[] = [
  { m: 'view', label: 'Views' }, { m: 'save', label: 'Saves' }, { m: 'watched', label: 'Watched' }, { m: 'trailer', label: 'Trailers' },
  { m: 'youtube', label: 'YouTube' }, { m: 'netflix', label: 'Netflix' }, { m: 'share', label: 'Shares' }, { m: 'surprise', label: 'Surprise' },
];
const CHARTS: { id: string; label: string }[] = [
  { id: 'visit', label: 'Visits' }, { id: 'view', label: 'Film views' }, { id: 'save', label: 'Saves' }, { id: 'trailer', label: 'Trailers' },
  { id: 'kit', label: 'Email signups' }, { id: 'account', label: 'New accounts' },
];
const countries = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; } })();
const fmt = (n: number | undefined) => (n ?? 0).toLocaleString('en-IE');
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });

export function AdminStats({ cloud, user }: { cloud: Cloud; user: User }) {
  const fetchKit = useServerFn(kitStats);
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<Accounts | null>(null);
  const [kit, setKit] = useState<Kit | { error: string } | null>(null);
  const [error, setError] = useState('');
  const [chart, setChart] = useState('visit');
  const [sortBy, setSortBy] = useState<Metric>('view');
  const [reload, setReload] = useState(0);
  const to = statDay(), from = statDay(new Date(Date.now() - (days - 1) * 86_400_000));

  useEffect(() => {
    let live = true;
    setError('');
    const { store, db } = cloud;
    store.getDocs(store.query(store.collection(db, 'stats'), store.where('d', '>=', from))).then((snap) => {
      if (live) setSummary(summarise(snap.docs.map((d) => d.data() as StatDoc), from, to));
    }, () => live && setError("Couldn't read the site counts. Check the Firestore rules allow the owner to read stats."));
    store.getDocs(store.collection(db, 'users')).then((snap) => {
      if (!live) return;
      const saved = new Map<string, number>(), watched = new Map<string, number>();
      let active = 0;
      const since = Date.parse(`${from}T00:00:00Z`);
      for (const doc of snap.docs) {
        const data = doc.data() as { shortlist?: string[]; watched?: string[]; updatedAt?: { toMillis?: () => number } };
        for (const id of data.shortlist ?? []) saved.set(id, (saved.get(id) ?? 0) + 1);
        for (const id of data.watched ?? []) watched.set(id, (watched.get(id) ?? 0) + 1);
        if ((data.updatedAt?.toMillis?.() ?? 0) >= since) active++;
      }
      const top = (m: Map<string, number>) => [...m].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n).slice(0, 10);
      setAccounts({ total: snap.size, activeInRange: active, saved: top(saved), watched: top(watched) });
    }, () => live && setAccounts(null));
    return () => { live = false; };
  }, [cloud, from, to, reload]);
  useEffect(() => {
    let live = true;
    user.getIdToken().then((token) => fetchKit({ data: { token } })).then(
      (r) => live && setKit(r.ok ? r : { error: r.reason }),
      () => live && setKit({ error: "Couldn't reach Kit." }));
    return () => { live = false; };
  }, [user, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const kitInRange = kit && !('error' in kit) ? dayRange(from, to).reduce((n, d) => n + (kit.byDay[d] ?? 0), 0) : undefined;
  const series = useMemo(() => {
    if (!summary) return [];
    const values = chart === 'kit' ? summary.days.map((d) => (kit && !('error' in kit) ? kit.byDay[d] ?? 0 : 0)) : summary.daily[chart as Metric] ?? summary.days.map(() => 0);
    return summary.days.map((d, i) => ({ day: shortDay(d), value: values[i] ?? 0 }));
  }, [summary, chart, kit]);
  const films = useMemo(() => {
    if (!summary) return [];
    const rows = new Map<string, Partial<Record<Metric, number>>>();
    for (const { m } of FILM_COLUMNS) for (const { k, n } of summary.top[m] ?? []) (rows.get(k) ?? rows.set(k, {}).get(k)!)[m] = n;
    return [...rows].filter(([id]) => TITLES.has(id)).sort(([, a], [, b]) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0) || (b.view ?? 0) - (a.view ?? 0)).slice(0, 25);
  }, [summary, sortBy]);
  const t = summary?.totals ?? {};
  const config = { value: { label: CHARTS.find((c) => c.id === chart)?.label ?? '', color: 'var(--primary)' } } satisfies ChartConfig;

  return <div className="mt-5 space-y-8 text-sm">
    <div className="flex flex-wrap items-center gap-2">
      {RANGES.map((r) => <Button key={r} size="sm" variant={days === r ? 'default' : 'outline'} aria-pressed={days === r} onClick={() => setDays(r)}>Last {r} days</Button>)}
      <Button size="sm" variant="ghost" onClick={() => setReload((n) => n + 1)}><RefreshCw />Refresh</Button>
    </div>
    {error && <p className="text-destructive">{error}</p>}

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Tile label="Visits" value={fmt(t.visit)} note={`${fmt(t.page)} page views`} />
      <Tile label="Film page views" value={fmt(t.view)} note={`${fmt(summary?.top.view?.length)} different films`} />
      <Tile label="Saves" value={fmt(t.save)} note={`${fmt(t.watched)} marked watched`} />
      <Tile label="Trailer plays" value={fmt(t.trailer)} note={`${fmt((t.youtube ?? 0) + (t.netflix ?? 0))} clicks to YouTube/Netflix`} />
      <Tile label="Email subscribers" value={kit && !('error' in kit) ? fmt(kit.active) : kit ? '–' : '…'}
        note={kit && 'error' in kit ? kit.error : kitInRange !== undefined ? `+${fmt(kitInRange)} signed up in ${days} days` : ''} />
      <Tile label="Accounts" value={accounts ? fmt(accounts.total) : '…'} note={accounts ? `+${fmt(t.account)} new · ${fmt(accounts.activeInRange)} active in ${days} days` : ''} />
    </div>

    <section>
      <div className="flex flex-wrap gap-1.5">
        {CHARTS.map((c) => <button key={c.id} type="button" aria-pressed={chart === c.id} onClick={() => setChart(c.id)}
          className={cn('rounded-full border px-2.5 py-1 text-xs', chart === c.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary')}>{c.label}</button>)}
      </div>
      <ChartContainer config={config} className="mt-3 aspect-auto h-56 w-full lg:h-72">
        <BarChart data={series} margin={{ left: -20, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={3} />
        </BarChart>
      </ChartContainer>
    </section>

    <section>
      <h2 className="text-base font-semibold">Films</h2>
      <p className="text-xs text-muted-foreground">Tap a column to sort. Counts are for the last {days} days.</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead><tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-2 pr-2 font-medium">Film</th>
            {FILM_COLUMNS.map((c) => <th key={c.m} className="px-1 py-2 text-right font-medium">
              <button type="button" onClick={() => setSortBy(c.m)} className={cn('hover:text-foreground', sortBy === c.m && 'text-primary')}>{c.label}</button>
            </th>)}
          </tr></thead>
          <tbody>{films.map(([id, row]) => <tr key={id} className="border-b border-border/60">
            <td className="py-1.5 pr-2"><a href={`/film/${id}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
              {SNAPSHOT[id]?.poster ? <img src={SNAPSHOT[id]!.poster} alt="" loading="lazy" className="h-9 w-6 shrink-0 rounded object-cover" /> : <span className="h-9 w-6 shrink-0 rounded bg-muted" />}
              <span className="line-clamp-2">{TITLES.get(id)}</span></a></td>
            {FILM_COLUMNS.map((c) => <td key={c.m} className={cn('px-1 text-right tabular-nums', !row[c.m] && 'text-muted-foreground/50')}>{row[c.m] ?? 0}</td>)}
          </tr>)}</tbody>
        </table>
        {summary && !films.length && <p className="py-3 text-muted-foreground">No film activity counted yet.</p>}
      </div>
    </section>

    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <List title="Where visits come from" rows={summary?.top.visit} label={(k) => (k === 'direct' ? 'Direct or unknown' : k)} />
      <List title="Countries" rows={summary?.top.country} label={(k) => countries?.of(k.toUpperCase()) ?? k.toUpperCase()} />
      <List title="Top pages" rows={summary?.top.page} label={(k) => (k === 'home' ? 'Home' : `/${k.replace(/\|/g, '/')}`)} href={(k) => (k === 'home' ? '/' : `/${k.replace(/\|/g, '/')}`)} />
      <List title="Devices" rows={summary?.top.device} label={(k) => k[0]!.toUpperCase() + k.slice(1)} />
      <List title="Searches that found nothing" rows={summary?.top.nosearch} label={(k) => k.replace(/-/g, ' ')} empty="None yet. These are worth adding to the catalogue." />
      <List title="Email signups by placement (all time)" rows={kit && !('error' in kit) ? Object.entries(kit.bySource).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n) : undefined} label={(k) => k} />
      <List title="Most saved by account holders (now)" rows={accounts?.saved} label={(k) => TITLES.get(k) ?? k} href={(k) => `/film/${k}`} />
      <List title="Most watched by account holders (now)" rows={accounts?.watched} label={(k) => TITLES.get(k) ?? k} href={(k) => `/film/${k}`} />
      <List title="Ko-fi tip clicks" rows={summary?.top.kofi} label={(k) => (k === 'about' ? 'About page' : 'Footer line')} />
    </div>

    <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
      These counts are anonymous and include everyone, not only people who accept cookies. {summary?.first ? `Counting since ${shortDay(summary.first)}.` : 'Counting starts with the next visit after this was published.'} Your own devices aren't counted once you've opened this page.
      For older traffic see <a href={LOVABLE} target="_blank" rel="noreferrer" className="underline">Lovable analytics <ExternalLink className="inline size-3" /></a> or <a href={GA} target="_blank" rel="noreferrer" className="underline">Google Analytics <ExternalLink className="inline size-3" /></a> (only visitors who accept cookies).
    </p>
  </div>;
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="rounded-lg border border-border bg-card/40 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
  </div>;
}

function List({ title, rows, label, href, empty = 'Nothing yet.' }: { title: string; rows: { k: string; n: number }[] | undefined; label: (k: string) => string; href?: (k: string) => string; empty?: string }) {
  const [all, setAll] = useState(false);
  const max = rows?.[0]?.n ?? 0;
  return <section>
    <h2 className="text-base font-semibold">{title}</h2>
    {!rows ? <p className="mt-2 text-muted-foreground">…</p> : !rows.length ? <p className="mt-2 text-muted-foreground">{empty}</p> : <>
      <ul className="mt-2 space-y-1">
        {rows.slice(0, all ? 50 : 8).map((r) => <li key={r.k} className="relative flex justify-between gap-3 overflow-hidden rounded px-2 py-1">
          <span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${max ? (r.n / max) * 100 : 0}%` }} />
          <span className="relative truncate">{href ? <a href={href(r.k)} target="_blank" rel="noreferrer" className="hover:underline">{label(r.k)}</a> : label(r.k)}</span>
          <span className="relative tabular-nums">{fmt(r.n)}</span>
        </li>)}
      </ul>
      {rows.length > 8 && <button type="button" className="mt-1 text-xs text-primary underline underline-offset-4" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${Math.min(rows.length, 50)}`}</button>}
    </>}
  </section>;
}
