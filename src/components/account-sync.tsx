import { Cloud, LogOut } from 'lucide-react';
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
        <span className="font-medium">Use more than one device?</span>
        <span className="text-muted-foreground"> Sign in to keep Saved and Watched in sync. We only store your name, email and the films you save.</span>
      </span>
      <Button variant="outline" size="sm" disabled={!ready} onClick={onSignIn}>{ready ? 'Sign in with Google' : 'Loading…'}</Button>
    </>}
    {error && <p className="w-full text-xs text-destructive" role="alert">{error}</p>}
  </div>;
}
