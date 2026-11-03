import { Coffee } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

// Tips go through Ko-fi (no cut on one-off tips). A plain link rather than Ko-fi's widget, so no
// third-party script loads and it matches the site. Nothing renders if this is emptied.
export const KOFI_URL = 'https://ko-fi.com/documentaryclub';

const track = (placement: string) => () => trackEvent('support_click', { placement });

// One quiet line above the footer on every page.
export function SupportLine() {
  if (!KOFI_URL) return null;
  return <p className="mt-8 flex flex-wrap items-center justify-center gap-x-1.5 text-center text-sm text-muted-foreground">
    <span>Documentary Club is free, ad-free and made by one person. If it's found you a good film,</span>
    <a href={KOFI_URL} target="_blank" rel="noopener" onClick={track('footer')} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
      <Coffee className="size-4" aria-hidden />buy me a coffee
    </a>
  </p>;
}

// The About page's ask: a card near the top.
export function SupportAbout() {
  if (!KOFI_URL) return null;
  return <div className="mt-6 flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="leading-relaxed text-foreground/90"><span className="font-semibold text-foreground">No ads, no paywall, no sponsored picks.</span> If the site has found you a good film, a coffee keeps it running.</p>
    <a href={KOFI_URL} target="_blank" rel="noopener" onClick={track('about')} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
      <Coffee className="size-4" aria-hidden />Buy me a coffee
    </a>
  </div>;
}
