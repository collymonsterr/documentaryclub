import { Link, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { readConsent, saveConsent, startAnalytics, trackPageView } from '@/lib/analytics';
import { newOrReturning } from '@/lib/stats-client';

export function ConsentBanner() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const consent = readConsent();
    if (consent === 'granted') { startAnalytics(); trackPageView(); }
    if (!consent) setOpen(true);
    return router.subscribe('onResolved', () => trackPageView());
  }, [router]);
  if (!open) return null;
  const choose = (value: 'granted' | 'denied') => {
    saveConsent(value);
    setOpen(false);
    if (value === 'granted') { startAnalytics(); trackPageView(); newOrReturning(); }
  };
  return (
    <div role="region" aria-label="Analytics choice" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="min-w-0 flex-1 basis-60 text-muted-foreground">Can I use Google Analytics to see how the site is used? <Link to="/privacy" className="underline">Privacy</Link></p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => choose('denied')}>No thanks</Button>
        <Button size="sm" onClick={() => choose('granted')}>Accept</Button>
      </div>
    </div>
  );
}
