// Server-only helpers for /admin: checking the visitor is the site owner, and saving to GitHub (which syncs to Lovable).

// Firebase project "documentary-club" signs the ID tokens; only this Google account may edit.
const PROJECT = 'documentary-club';
const OWNER = 'colinfitz@gmail.com';
const JWKS = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
export const REPO = 'collymonsterr/documentaryclub';
const BRANCH = 'main';

let keys: { at: number; maxAge: number; list: (JsonWebKey & { kid: string })[] } | null = null;
async function signingKeys() {
  if (keys && Date.now() - keys.at < keys.maxAge) return keys.list;
  const res = await fetch(JWKS, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Google keys ${res.status}`);
  const maxAge = Number(res.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 3600) * 1000;
  keys = { at: Date.now(), maxAge, list: ((await res.json()) as { keys: (JsonWebKey & { kid: string })[] }).keys };
  return keys.list;
}
const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const json = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s)));

export class NotOwner extends Error {}
// Verifies a Firebase ID token the way Firebase's own SDK does (RS256 signature from Google's current keys, audience,
// issuer, expiry), then insists on the owner's verified Google email. Throws NotOwner on anything else.
export async function verifyOwner(token: unknown) {
  if (typeof token !== 'string' || token.length > 4096) throw new NotOwner('No sign-in');
  const [h, p, sig] = token.split('.');
  if (!h || !p || !sig) throw new NotOwner('Malformed token');
  let header: { alg?: string; kid?: string }, claims: Record<string, unknown>;
  try { header = json(h); claims = json(p); } catch { throw new NotOwner('Malformed token'); }
  if (header.alg !== 'RS256' || !header.kid) throw new NotOwner('Wrong algorithm');
  const jwk = (await signingKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new NotOwner('Unknown key');
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true } as JsonWebKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  const now = Date.now() / 1000;
  if (!valid) throw new NotOwner('Bad signature');
  if (claims['aud'] !== PROJECT || claims['iss'] !== `https://securetoken.google.com/${PROJECT}`) throw new NotOwner('Wrong project');
  if (typeof claims['exp'] !== 'number' || claims['exp'] < now || typeof claims['iat'] !== 'number' || claims['iat'] > now + 300) throw new NotOwner('Expired');
  if (typeof claims['sub'] !== 'string' || !claims['sub']) throw new NotOwner('No user');
  if (claims['email'] !== OWNER || claims['email_verified'] !== true) throw new NotOwner('Not the owner');
}

// GitHub: GITHUB_TOKEN is a fine-grained token with Contents read and write on this repository only.
const gh = async (path: string, init: RequestInit = {}) => {
  const token = process.env['GITHUB_TOKEN']?.trim();
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  return fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init, signal: AbortSignal.timeout(15000),
    // init.headers come last so readFile can ask for the raw file instead of GitHub's JSON wrapper.
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'documentary-club-admin', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers as Record<string, string> | undefined) },
  });
};
const ok = async (res: Response, what: string) => {
  if (!res.ok) throw new Error(`GitHub ${what}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<any>;
};
const head = async () => (await ok(await gh(`/git/ref/heads/${BRANCH}`), 'ref')).object.sha as string;

export async function readFile(path: string, ref?: string) {
  const at = ref ?? (await head());
  const res = await gh(`/contents/${path}?ref=${at}`, { headers: { Accept: 'application/vnd.github.raw+json' } });
  if (!res.ok) throw new Error(`GitHub read ${path}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return { text: await res.text(), commit: at };
}

// Writes several files as one commit on main, building on `parent` (the commit the edit was read from).
// Returns false if main moved in between, so the caller can re-read and re-apply.
export async function commitFiles(parent: string, files: Record<string, string>, message: string, branch = BRANCH) {
  const base = (await ok(await gh(`/git/commits/${parent}`), 'commit')).tree.sha as string;
  const tree = await ok(await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base, tree: Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content })) }) }), 'tree');
  const commit = await ok(await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [parent] }) }), 'new commit');
  const res = await gh(`/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
  if (res.status === 422) return false;
  await ok(res, 'update main');
  return true;
}
