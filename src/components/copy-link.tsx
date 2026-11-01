import { Check, Link2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyLink({ path, className }: { path?: string | undefined; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = path ? `${window.location.origin}${path}` : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
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
