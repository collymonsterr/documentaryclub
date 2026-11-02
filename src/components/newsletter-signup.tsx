import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackEvent } from '@/lib/analytics';
import { subscribe, type SignupSource } from '@/lib/newsletter.functions';
import { cn } from '@/lib/utils';

const COPY: Record<'block' | 'compact', { title: string; body: string }> = {
  block: { title: 'One documentary worth your time, every week', body: 'Plus the best new releases. One email, no spam, and you can leave whenever you like.' },
  compact: { title: 'Get one of these every week', body: 'One documentary worth your time, plus the best new releases.' },
};

// One email field and a button. Kit sends the confirmation email; nothing here pops up on its own.
export function NewsletterSignup({ source, title, body, compact = false, className }: { source: SignupSource; title?: string; body?: string; compact?: boolean; className?: string }) {
  const send = useServerFn(subscribe);
  const [email, setEmail] = useState(''), [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const copy = COPY[compact ? 'compact' : 'block'];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    const result = await send({ data: { email, source, path: window.location.pathname, website } }).catch(() => ({ ok: false }));
    setState(result.ok ? 'done' : 'error');
    if (result.ok) trackEvent('newsletter_signup', { source });
  };
  return <section aria-label="Weekly email" className={cn('rounded-lg border border-border bg-card/40', compact ? 'p-3' : 'p-4 sm:p-5', className)}>
    <h2 className={cn('font-display font-semibold', compact ? 'text-base' : 'text-lg')}>{title ?? copy.title}</h2>
    {state === 'done' ? <p className="mt-1 text-sm" role="status">Nearly there. Check your inbox and click the link to confirm, and you're in.</p> : <>
      <p className="mt-1 text-sm text-muted-foreground">{body ?? copy.body}</p>
      <form onSubmit={submit} className="mt-3 flex max-w-md gap-2">
        <Input type="email" required autoComplete="email" aria-label="Email address" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="h-9 min-w-0 flex-1" />
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={website} onChange={e => setWebsite(e.target.value)} />
        <Button type="submit" size="sm" className="h-9 shrink-0" disabled={state === 'sending'}>{state === 'sending' ? 'Signing up…' : 'Sign me up'}</Button>
      </form>
      {state === 'error' && <p className="mt-2 text-xs text-destructive" role="alert">That didn't work. Check the address and try again in a minute.</p>}
    </>}
  </section>;
}
