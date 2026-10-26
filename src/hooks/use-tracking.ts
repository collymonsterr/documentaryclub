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
  const toggle = (id: string) => setItems(previous => {
    const next = new Set(previous);
    next.has(id) ? next.delete(id) : next.add(id);
    try { localStorage.setItem(key, JSON.stringify([...next])); } catch { /* Keep usable when browser storage is blocked. */ }
    return next;
  });
  return [items, toggle] as const;
}