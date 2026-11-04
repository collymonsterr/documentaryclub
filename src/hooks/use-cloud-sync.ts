import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { fromDoc, mergeFirst, sameLists, type Lists } from '@/lib/cloud-sync';
import { trackEvent } from '@/lib/analytics';

// Optional Google sign-in that syncs Saved and Watched across devices (Firebase project "documentary-club").
// These values are public by design; the Firestore rules (users/{uid}, owner only) are what protect the data.
const FIREBASE = {
  apiKey: 'AIzaSyDaKhoCYO5fmfKg3VPcXKMLQNyZhjYUfC0',
  authDomain: 'documentary-club.firebaseapp.com',
  projectId: 'documentary-club',
  storageBucket: 'documentary-club.firebasestorage.app',
  messagingSenderId: '997309832391',
  appId: '1:997309832391:web:f6e9388477706d98baf2e2',
};
// Set once someone signs in here, so only their visits load Firebase; everyone else never downloads it.
const SIGNED_IN = 'dc-account';

async function load() {
  const [{ initializeApp }, auth, store] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
  const app = initializeApp(FIREBASE);
  return { auth, store, authInstance: auth.getAuth(app), db: store.getFirestore(app) };
}
type Cloud = Awaited<ReturnType<typeof load>>;
let loading: Promise<Cloud> | null = null;
export const loadCloud = () => (loading ??= load());

const flag = { get: () => { try { return localStorage.getItem(SIGNED_IN) === '1'; } catch { return false; } },
  set: (on: boolean) => { try { on ? localStorage.setItem(SIGNED_IN, '1') : localStorage.removeItem(SIGNED_IN); } catch { /* storage blocked */ } } };

export type Account = { name: string; email: string; photo?: string | undefined };

export function useCloudSync(local: Lists, replace: (lists: Lists) => void, wanted: boolean) {
  const [cloud, setCloud] = useState<Cloud | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState('');
  const last = useRef<Lists | null>(null);
  const firstHere = useRef(false);
  const localRef = useRef(local);
  localRef.current = local;
  const replaceRef = useRef(replace);
  replaceRef.current = replace;

  // Load Firebase for returning account holders, or once the sign-in button is on screen so the popup
  // can open straight from the tap (iPhone and iPad block popups that wait on a download).
  useEffect(() => {
    if (cloud || !(wanted || flag.get())) return;
    loadCloud().then(setCloud, () => setError("Sign-in isn't available right now."));
  }, [cloud, wanted]);

  useEffect(() => cloud?.auth.onAuthStateChanged(cloud.authInstance, (u) => { setUser(u); if (!u) { flag.set(false); setSynced(false); last.current = null; } }), [cloud]);

  // Account record -> this browser. The first snapshot after a fresh sign-in merges; later ones replace.
  useEffect(() => {
    if (!cloud || !user) return;
    const ref = cloud.store.doc(cloud.db, 'users', user.uid);
    return cloud.store.onSnapshot(ref, (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const remote = fromDoc(snap.data());
      const next = firstHere.current || !snap.exists() ? mergeFirst(localRef.current, remote) : remote;
      firstHere.current = false;
      last.current = next;
      if (!sameLists(next, localRef.current)) replaceRef.current(next);
      if (!sameLists(next, remote)) write(cloud, user.uid, next);
      setSynced(true);
    }, () => setError("Couldn't reach your account. Your list is still saved on this device."));
  }, [cloud, user]);

  // This browser -> account record, whenever Save or Mark watched changes something.
  useEffect(() => {
    if (!cloud || !user || !synced || !last.current || sameLists(local, last.current)) return;
    last.current = local;
    write(cloud, user.uid, local);
  }, [cloud, user, synced, local]);

  // Must run inside the tap itself, so Firebase has to be loaded already (see the effect above).
  // placement says which ask worked (the Saved/Watched lists, or the note under Save), for the consent-gated sign_in event.
  const signIn = useCallback((placement: 'list' | 'save' = 'list') => {
    if (!cloud) return;
    setError('');
    firstHere.current = !flag.get();
    cloud.auth.signInWithPopup(cloud.authInstance, new cloud.auth.GoogleAuthProvider())
      .then(() => { flag.set(true); trackEvent('sign_in', { placement }); })
      .catch((e: { code?: string }) => { if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') setError("Sign-in didn't work. Please try again."); });
  }, [cloud]);
  const signOut = useCallback(() => { if (cloud) cloud.auth.signOut(cloud.authInstance); }, [cloud]);

  const account: Account | null = user ? { name: user.displayName ?? user.email ?? 'Signed in', email: user.email ?? '', photo: user.photoURL ?? undefined } : null;
  return { ready: Boolean(cloud), account, synced, error, signIn, signOut };
}

function write(cloud: Cloud, uid: string, lists: Lists) {
  cloud.store.setDoc(cloud.store.doc(cloud.db, 'users', uid), { ...lists, updatedAt: cloud.store.serverTimestamp() }).catch(() => {});
}
