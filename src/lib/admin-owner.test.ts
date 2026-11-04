import { describe, expect, it } from 'vitest';
import { NotOwner, verifyOwner } from './admin.server';

describe('owner check', () => {
  it('refuses missing, malformed and unsigned tokens', async () => {
    await expect(verifyOwner(undefined)).rejects.toBeInstanceOf(NotOwner);
    await expect(verifyOwner('abc')).rejects.toBeInstanceOf(NotOwner);
    const enc = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    await expect(verifyOwner(`${enc({ alg: 'none' })}.${enc({ email: 'colinfitz@gmail.com' })}.x`)).rejects.toBeInstanceOf(NotOwner);
  });
});
