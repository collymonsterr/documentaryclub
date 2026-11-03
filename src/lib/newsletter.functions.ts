import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { SITE_ORIGIN } from '@/lib/site-urls';

// Where a signup came from, so Kit's export shows which placement works.
export const SIGNUP_SOURCES = ['footer', 'film', 'surprise', 'saved', 'best', 'list', 'soon'] as const;
export type SignupSource = (typeof SIGNUP_SOURCES)[number];
type Signup = { email: string; source: SignupSource; path: string; website: string };

const recent = new Map<string, number[]>();
const LIMIT = 5, WINDOW = 60 * 60_000;
function allowed(ip: string) {
  const now = Date.now(), hits = (recent.get(ip) ?? []).filter(t => now - t < WINDOW);
  if (recent.size > 2000) recent.clear();
  if (hits.length >= LIMIT) return false;
  recent.set(ip, [...hits, now]);
  return true;
}
const kit = (path: string, key: string, body: object) => fetch(`https://api.kit.com/v4/${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Kit-Api-Key': key }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
});
// Failures go to the server log with Kit's status and body, never the key or the full address.
type Result = { ok: boolean; reason?: string };
const fail = async (reason: string, email: string, res?: Response): Promise<Result> => {
  console.error(`[newsletter] ${reason} for ${email.replace(/^(.).*@/, '$1***@')}${res ? `: ${res.status} ${(await res.text().catch(() => '')).slice(0, 300)}` : ''}`);
  return { ok: false, reason };
};

// Signups go to a Kit double opt-in form (KIT_API_KEY, KIT_FORM_ID): Kit sends the confirmation email and holds the list.
export const subscribe = createServerFn({ method: 'POST' })
  .inputValidator((data: Signup): Signup => ({
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data?.email?.trim() ?? '') ? data.email.trim().slice(0, 200) : '',
    source: SIGNUP_SOURCES.includes(data?.source) ? data.source : 'footer',
    path: String(data?.path ?? '/').startsWith('/') ? String(data.path).slice(0, 200) : '/',
    website: String(data?.website ?? '').slice(0, 100),
  }))
  .handler(async ({ data }): Promise<Result> => {
    // Success is only ever reported after Kit has returned 2xx for both calls.
    if (!data.email) return { ok: false, reason: 'email' };
    // Hidden field only bots fill in. It fails visibly: a silent "success" here once hid a broken signup.
    if (data.website) return fail('honeypot', data.email);
    const key = process.env['KIT_API_KEY'], form = process.env['KIT_FORM_ID'];
    if (!key || !/^\d+$/.test(form ?? '')) return fail(`config (KIT_API_KEY ${key ? 'set' : 'missing'}, KIT_FORM_ID ${form ? 'set' : 'missing'})`, data.email);
    if (!allowed(getRequestHeader('cf-connecting-ip') ?? 'unknown')) return fail('rate-limit', data.email);
    try {
      // Inactive until they confirm; the "source" custom field is optional, so retry without it if Kit rejects the key.
      const person = { email_address: data.email, state: 'inactive' };
      let created = await kit('subscribers', key, { ...person, fields: { source: data.source } });
      if (created.status === 422) created = await kit('subscribers', key, person);
      if (!created.ok) return fail('kit-subscriber', data.email, created);
      const referrer = `${SITE_ORIGIN}${data.path}${data.path.includes('?') ? '&' : '?'}utm_source=site&utm_medium=${data.source}`;
      const added = await kit(`forms/${form}/subscribers`, key, { email_address: data.email, referrer });
      if (!added.ok) return fail('kit-form', data.email, added);
      return { ok: true };
    } catch (e) {
      return fail(`kit-unreachable (${e instanceof Error ? e.name : 'error'})`, data.email);
    }
  });
