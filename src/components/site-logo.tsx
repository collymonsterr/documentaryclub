// Approved brand mark: amber handheld camera (open top handle, dark side window and dot,
// viewfinder wedge left, lens wedge right) + real text wordmark. Inline SVG, no banner image.
import { Link } from '@tanstack/react-router';

export function CameraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" aria-hidden="true" className={className}>
      <path d="M15 21 5 15.5v17L15 27V21Z" fill="currentColor" />
      <rect x="15" y="13" width="30" height="26" rx="7" fill="currentColor" />
      <path d="M45 19.5 59 12v24L45 28.5v-9Z" fill="currentColor" />
      <path d="M22 13V9a5 5 0 0 1 5-5h11a5 5 0 0 1 5 5v4" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <rect x="20" y="19" width="13" height="12" rx="2.5" fill="var(--color-background)" />
      <circle cx="38.5" cy="21.5" r="2.6" fill="var(--color-background)" />
    </svg>
  );
}

export function SiteLogo() {
  return (
    <Link to="/" search={{ film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', tag: '', browse: 'topics' }} aria-label="Documentary Club home"
      className="flex min-w-0 items-center gap-2.5 rounded-sm outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
      <CameraMark className="h-7 w-auto shrink-0 text-primary sm:h-8" />
      <span className="truncate font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Documentary <span className="text-primary">Club</span></span>
    </Link>
  );
}
