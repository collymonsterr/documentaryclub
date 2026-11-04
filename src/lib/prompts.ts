// When the site asks a visitor for something. Both asks sit in the page (never a popup), each at the moment it is useful:
// sign-in right after someone saves a film, the weekly email once they've opened a few film pages.
export const PROMPT_KEYS = { views: 'dc-film-views', newsletter: 'dc-newsletter', syncNudge: 'dc-sync-nudge' } as const;
export const NEWSLETTER_AFTER_VIEWS = 3;
export const SYNC_NUDGE_MAX = 3;

// The weekly-email card on film pages: from the third film page, until they sign up or close it.
export const showNewsletterCard = (views: number, state: string | null) =>
  views >= NEWSLETTER_AFTER_VIEWS && state !== 'subscribed' && state !== 'dismissed';

// The sign-in note under Save: shown after a save, at most three times, and never again once closed or signed in.
export const canNudgeSync = (state: string | null) => state !== 'dismissed' && state !== 'done' && (Number(state) || 0) < SYNC_NUDGE_MAX;
export const nextNudgeState = (state: string | null) => String((Number(state) || 0) + 1);

// Where a visit came from: utm_source when a shared link has one, else the referring site (reddit.com for any Reddit domain).
export function arrivalSource(search: string, referrer: string, ownHost: string) {
  const utm = new URLSearchParams(search).get('utm_source')?.trim().toLowerCase();
  if (utm) return utm.slice(0, 40);
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host === ownHost || host.endsWith(`.${ownHost}`)) return 'internal';
    if (/(^|\.)reddit\.com$|^redd\.it$/.test(host)) return 'reddit.com';
    return host.replace(/^(www|m|l|lm|out|old|new)\./, '');
  } catch {
    return 'direct';
  }
}

export const readStore = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
export const writeStore = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* storage blocked: the ask just shows again */ } };
