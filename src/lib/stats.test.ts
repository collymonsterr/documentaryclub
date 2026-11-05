import { describe, expect, it } from 'vitest';
import { dayRange, docId, foldEvents, isBot, statDay, statKey, summarise, summariseKit } from './stats';

const films = new Set(['free-solo', 'man-on-wire']);

describe('anonymous stats', () => {
  it('turns keys into safe document id parts', () => {
    expect(statKey('Reddit.com')).toBe('reddit.com');
    expect(statKey('tags/free-on-youtube')).toBe('tags|free-on-youtube');
    expect(statKey('  Béla Tarr  docs ')).toBe('-bela-tarr-docs-');
    expect(statKey('a/b?c=<script>')).toBe('a|bcscript');
    expect(statKey('x'.repeat(200))).toHaveLength(80);
  });

  it('keeps real films and known metrics, folding repeats into one write', () => {
    const docs = foldEvents([
      { m: 'save', k: 'free-solo' }, { m: 'save', k: 'free-solo' }, { m: 'view', k: 'not-a-film' },
      { m: 'hack', k: 'x' }, { m: 'visit', k: 'reddit.com' }, { m: 'nosearch', k: 'Planet Earth III' }, null, 'junk',
    ], films, '2026-11-05');
    expect(docs).toEqual([
      { d: '2026-11-05', m: 'save', k: 'free-solo', n: 2 },
      { d: '2026-11-05', m: 'visit', k: 'reddit.com', n: 1 },
      { d: '2026-11-05', m: 'nosearch', k: 'planet-earth-iii', n: 1 },
    ]);
    expect(foldEvents('nope', films, '2026-11-05')).toEqual([]);
  });

  it('caps one write at 20 and one batch at 30 events', () => {
    const many = Array.from({ length: 50 }, () => ({ m: 'view', k: 'man-on-wire' }));
    expect(foldEvents(many, films, '2026-11-05')).toEqual([{ d: '2026-11-05', m: 'view', k: 'man-on-wire', n: 20 }]);
  });

  it('dates by the Irish calendar day', () => {
    expect(statDay(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02');
    expect(statDay(new Date('2026-12-01T23:30:00Z'))).toBe('2026-12-01');
    expect(docId('2026-11-05', 'save', 'free-solo')).toBe('2026-11-05~save~free-solo');
  });

  it('spots bots', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
    expect(isBot('')).toBe(true);
    expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1')).toBe(false);
  });

  it('summarises counts into totals, gap-free days and ranked keys', () => {
    const s = summarise([
      { d: '2026-11-03', m: 'visit', k: 'direct', n: 4 },
      { d: '2026-11-05', m: 'visit', k: 'reddit.com', n: 6 },
      { d: '2026-11-05', m: 'visit', k: 'direct', n: 1 },
      { d: '2026-11-01', m: 'visit', k: 'direct', n: 9 },
      { d: '2026-11-04', m: 'bogus', k: 'x', n: 1 },
    ], '2026-11-03', '2026-11-05');
    expect(s.days).toEqual(['2026-11-03', '2026-11-04', '2026-11-05']);
    expect(s.totals.visit).toBe(11);
    expect(s.daily.visit).toEqual([4, 0, 7]);
    expect(s.top.visit).toEqual([{ k: 'reddit.com', n: 6 }, { k: 'direct', n: 5 }]);
    expect(s.first).toBe('2026-11-01');
    expect(dayRange('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('summarises Kit subscribers without keeping addresses', () => {
    const k = summariseKit([
      { state: 'active', created_at: '2026-11-04T10:00:00Z', fields: { source: 'footer' } },
      { state: 'active', created_at: '2026-11-04T12:00:00Z', fields: { source: '' } },
      { state: 'inactive', created_at: '2026-11-05T09:00:00Z', fields: null },
    ]);
    expect(k).toEqual({ total: 3, active: 2, byDay: { '2026-11-04': 2, '2026-11-05': 1 }, byState: { active: 2, inactive: 1 }, bySource: { footer: 1, unknown: 1 } });
  });
});
