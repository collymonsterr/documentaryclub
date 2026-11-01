import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimplePage } from '@/components/simple-page';
import { searchDocumentaries, sendFeedback, type SearchResult } from '@/lib/feedback.functions';
import { staticPageHead } from '@/lib/site-urls';

export const Route = createFileRoute('/suggest')({
  head: () => staticPageHead('Suggest a documentary', 'Suggest a documentary for the collection, or send a message.', '/suggest'),
  component: SuggestPage,
});
const field = 'mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm';
function SuggestPage() {
  const search = useServerFn(searchDocumentaries), send = useServerFn(sendFeedback);
  const [kind, setKind] = useState<'suggestion' | 'message'>('suggestion');
  const [query, setQuery] = useState(''), [results, setResults] = useState<SearchResult[]>([]), [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<SearchResult | null>(null);
  const [name, setName] = useState(''), [note, setNote] = useState(''), [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  useEffect(() => {
    if (picked || query.trim().length < 2) { setResults([]); return; }
    let live = true;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void search({ data: { query } }).then(found => { if (live) setResults(found); }, () => { if (live) setResults([]); }).finally(() => { if (live) setSearching(false); });
    }, 300);
    return () => { live = false; window.clearTimeout(timer); };
  }, [query, picked, search]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const result = await send({ data: { kind, name, note, website, title: picked?.title ?? '', year: picked?.year ?? '', tmdbId: picked ? String(picked.tmdbId) : '', mediaType: picked?.mediaType ?? '' } }).catch(() => ({ ok: false }));
    setStatus(result.ok ? 'sent' : 'failed');
  };
  if (status === 'sent') return <SimplePage title="Thank you"><p className="mt-4 text-muted-foreground">Got it. Thanks for getting in touch.</p></SimplePage>;
  const ready = kind === 'suggestion' ? !!picked && !picked.catalogueId : !!note.trim();
  return <SimplePage title={kind === 'suggestion' ? 'Suggest a documentary' : 'Send a message'}>
    <div className="mt-4 flex gap-2">
      <Button size="sm" variant={kind === 'suggestion' ? 'default' : 'outline'} onClick={() => setKind('suggestion')}>Suggest a documentary</Button>
      <Button size="sm" variant={kind === 'message' ? 'default' : 'outline'} onClick={() => setKind('message')}>Send a message</Button>
    </div>
    <form onSubmit={submit} className="mt-5 space-y-4">
      {kind === 'suggestion' && (picked ? <div className="flex items-center gap-3 rounded-md border border-border p-2">
        {picked.poster && <img src={picked.poster} alt="" className="h-16 rounded-sm" />}
        <div className="min-w-0 flex-1"><p className="font-medium">{picked.title}</p><p className="text-sm text-muted-foreground">{picked.year}{picked.mediaType === 'tv' ? ' · Series' : ''}</p>
          {picked.catalogueId && <p className="text-sm">Already in the collection. <Link to="/" search={{ film: picked.catalogueId } as never} className="underline">Open it</Link></p>}</div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setPicked(null)}>Change</Button>
      </div> : <label className="block text-sm">Find the documentary
        <Input className="mt-1" type="search" autoComplete="off" placeholder="Start typing a title" value={query} onChange={e => setQuery(e.target.value)} />
        {searching && <span className="mt-2 block text-xs text-muted-foreground" role="status">Searching…</span>}
        {!!results.length && <ul className="mt-2 divide-y divide-border rounded-md border border-border">{results.map(r => <li key={`${r.mediaType}${r.tmdbId}`}><button type="button" className="flex min-h-12 w-full items-center gap-3 p-2 text-left hover:bg-accent" onClick={() => setPicked(r)}>
          {r.poster ? <img src={r.poster} alt="" className="h-12 w-8 rounded-sm object-cover" loading="lazy" /> : <span className="h-12 w-8 rounded-sm bg-muted" />}
          <span className="min-w-0"><span className="block truncate">{r.title}</span><span className="block text-xs text-muted-foreground">{r.year}{r.mediaType === 'tv' ? ' · Series' : ''}</span></span>
        </button></li>)}</ul>}
        {!searching && !results.length && query.trim().length >= 2 && <span className="mt-2 block text-xs text-muted-foreground">No documentaries found. Try another spelling, or send it as a message.</span>}
      </label>)}
      <label className="block text-sm">{kind === 'suggestion' ? 'Why this one? (optional)' : 'Your message'}<textarea className={field} rows={4} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></label>
      <label className="block text-sm">Your name (optional)<Input className="mt-1" maxLength={80} autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></label>
      <label className="absolute -left-[9999px]" aria-hidden>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label>
      {status === 'failed' && <p className="text-sm text-destructive" role="alert">That didn't send. Please try again later.</p>}
      <Button type="submit" disabled={!ready || status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send'}</Button>
    </form>
  </SimplePage>;
}
