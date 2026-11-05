import { Check, Link2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { stat } from '@/lib/stats-client';

// The visitor's sort order is theirs, so shared links leave it out.
const shareable = () => { const url = new URL(window.location.href); url.searchParams.delete('sort'); return url.href; };

export function CopyLink({ path, className }: { path?: string | undefined; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = path ? `${window.location.origin}${path}` : shareable();
    try {
      await navigator.clipboard.writeText(url);
      const film = /^\/film\/([^/?]+)/.exec(path ?? location.pathname)?.[1];
      if (film) stat('share', film);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };
  return (
    <Button variant="outline" size="sm" className={className} onClick={copy}>
      {copied ? <Check /> : <Link2 />}
      <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
    </Button>
  );
}
