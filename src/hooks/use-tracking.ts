import { useEffect, useState } from 'react';
import { readTracking } from '@/lib/discovery';

export function useTracking(key: string) {
  const [items, setItems] = useState<Set<string>>(new Set());
  useEffect(() => {
    setItems(readTracking(localStorage, key));
    const sync = (event: StorageEvent) => { if (event.key === key) setItems(readTracking(localStorage, key)); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);
  const write = (next: Set<string>) => { try { localStorage.setItem(key, JSON.stringify([...next])); } catch { /* Keep usable when browser storage is blocked. */ } return next; };
  const toggle = (id: string) => setItems(previous => {
    const next = new Set(previous);
    next.has(id) ? next.delete(id) : next.add(id);
    return write(next);
  });
  const remove = (id: string) => setItems(previous => { if (!previous.has(id)) return previous; const next = new Set(previous); next.delete(id); return write(next); });
  const replace = (ids: string[]) => setItems(write(new Set(ids)));
  return [items, toggle, { remove, replace }] as const;
}

// Boolean preference stored alongside tracking; read after hydration.
export function usePreference(key: string, initial: boolean) {
  const [value, setValue] = useState(initial);
  useEffect(() => { const v = localStorage.getItem(key); if (v === 'true' || v === 'false') setValue(v === 'true'); }, [key]);
  const set = (next: boolean) => { setValue(next); try { localStorage.setItem(key, String(next)); } catch { /* ignore */ } };
  return [value, set] as const;
}
