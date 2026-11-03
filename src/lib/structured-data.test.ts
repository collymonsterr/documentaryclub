import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '@/data/catalogue';
import { filmSchema } from './structured-data';

const film = (id: string) => CATALOGUE.find(f => f.id === id)!;

describe('film JSON-LD', () => {
  it('lists won awards, never nominations', () => {
    expect(filmSchema(film('free-solo')).award).toContain('Oscar Winner 2019');
    expect(filmSchema(film('fire-of-love')).award ?? []).not.toContain('Oscar Nominee 2023');
  });
  it('never marks up ratings', () => {
    expect(JSON.stringify(filmSchema(film('free-solo')))).not.toMatch(/aggregateRating/i);
  });
});
