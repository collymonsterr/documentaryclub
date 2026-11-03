// Rules for syncing Saved and Watched with a signed-in account (src/hooks/use-cloud-sync.ts does the I/O).
// The account copy is the source of truth once someone has signed in on this device; only the very first
// sign-in merges what this browser already had, so a removal on one device isn't undone by another.

export type Lists = { shortlist: string[]; watched: string[] };

const clean = (ids: unknown): string[] => (Array.isArray(ids) ? [...new Set(ids.filter((id): id is string => typeof id === 'string'))] : []);

export function fromDoc(data: unknown): Lists {
  const d = (data ?? {}) as { shortlist?: unknown; watched?: unknown };
  return { shortlist: clean(d.shortlist), watched: clean(d.watched) };
}

// First sign-in on this device: keep everything from both sides. A film marked watched leaves Saved,
// matching what Mark watched does on the page.
export function mergeFirst(local: Lists, cloud: Lists): Lists {
  const watched = [...new Set([...cloud.watched, ...local.watched])];
  const seen = new Set(watched);
  return { shortlist: [...new Set([...cloud.shortlist, ...local.shortlist])].filter((id) => !seen.has(id)), watched };
}

export const sameLists = (a: Lists, b: Lists) =>
  [...a.shortlist].sort().join() === [...b.shortlist].sort().join() && [...a.watched].sort().join() === [...b.watched].sort().join();
