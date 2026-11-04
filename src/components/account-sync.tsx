import { Cloud, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Account } from '@/hooks/use-cloud-sync';

// Shown on the Saved and Watched lists: optional Google sign-in so the lists follow you between devices.
export function AccountSync({ ready, account, synced, error, onSignIn, onSignOut }: {
  ready: boolean; account: Account | null; synced: boolean; error: string; onSignIn: () => void; onSignOut: () => void;
}) {
  return <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card/60 px-4 py-3 text-sm">
    {account ? <>
      {account.photo ? <img src={account.photo} alt="" referrerPolicy="no-referrer" className="size-7 rounded-full" /> : <Cloud className="size-5 text-primary" />}
      <span className="min-w-0 flex-1">
        <span className="font-medium">{synced ? 'Synced' : 'Syncing…'}</span>
        <span className="text-muted-foreground"> · Saved and Watched follow {account.email || account.name} on every device</span>
      </span>
      <Button variant="ghost" size="sm" onClick={onSignOut}><LogOut />Sign out</Button>
    </> : <>
      <Cloud className="size-5 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="font-medium">Your watchlist, on every device.</span>
        <span className="text-muted-foreground"> Sign in with Google and Saved and Watched follow you to your phone, tablet and laptop. We only store your name, email and the films you save.</span>
      </span>
      <Button variant="outline" size="sm" disabled={!ready} onClick={onSignIn}>{ready ? 'Sign in with Google' : 'Loading…'}</Button>
    </>}
    {error && <p className="w-full text-xs text-destructive" role="alert">{error}</p>}
  </div>;
}

// A note under Save / Mark watched on a film page, right after someone saves: the one moment an account is worth having.
// It sits in the page (no popup), can be closed for good, and Firebase starts loading as it appears so the tap opens Google straight away.
export function SyncNudge({ ready, account, error, watched, onSignIn, onClose }: {
  ready: boolean; account: Account | null; error: string; watched: boolean; onSignIn: () => void; onClose: () => void;
}) {
  return <div role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-primary/40 bg-primary/5 py-2.5 pl-3 pr-1 text-sm">
    <Cloud className="size-5 shrink-0 text-primary" aria-hidden />
    {account ? <span className="min-w-0 flex-1"><span className="font-medium">You're signed in.</span><span className="text-muted-foreground"> Saved and Watched now follow you to every device.</span></span>
      : <span className="min-w-0 flex-1">
        <span className="font-medium">{watched ? 'Marked on this device.' : 'Saved on this device.'}</span>
        <span className="text-muted-foreground"> Sign in with Google to keep your list on your phone and laptop too.</span>
      </span>}
    {!account && <Button size="sm" disabled={!ready} onClick={onSignIn}>{ready ? 'Sign in with Google' : 'Loading…'}</Button>}
    <Button variant="ghost" size="icon" aria-label={account ? 'Close' : 'No thanks'} onClick={onClose} className="size-8 text-muted-foreground"><X /></Button>
    {error && <p className="w-full text-xs text-destructive" role="alert">{error}</p>}
  </div>;
}
