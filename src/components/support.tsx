import { Coffee } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

// Tips go through Ko-fi (no cut on one-off tips). A plain link rather than Ko-fi's widget, so no
// third-party script loads and it matches the site. Empty until the Ko-fi page exists: nothing renders.
export const KOFI_URL = '';

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

// The About page's fuller ask.
export function SupportAbout({ heading, paragraph }: { heading: string; paragraph: string }) {
  if (!KOFI_URL) return null;
  return <>
    <h3 className={heading}>Keep it going</h3>
    <p className={paragraph}>There are no ads, no paywall and no sponsored picks here, and I'd like to keep it that way. If the site has found you something worth watching, a coffee helps cover the running costs and keeps me adding films.</p>
    <a href={KOFI_URL} target="_blank" rel="noopener" onClick={track('about')} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-primary/60 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
      <Coffee className="size-4" aria-hidden />Buy me a coffee on Ko-fi
    </a>
  </>;
}
