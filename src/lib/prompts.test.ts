import { describe, expect, it } from 'vitest';
import { arrivalSource, canNudgeSync, nextNudgeState, showNewsletterCard } from './prompts';

describe('asks', () => {
  it('shows the weekly-email card from the third film page until signed up or closed', () => {
    expect(showNewsletterCard(2, null)).toBe(false);
    expect(showNewsletterCard(3, null)).toBe(true);
    expect(showNewsletterCard(9, 'subscribed')).toBe(false);
    expect(showNewsletterCard(9, 'dismissed')).toBe(false);
  });
  it('nudges sign-in at most three times, never after closing or signing in', () => {
    expect(canNudgeSync(null)).toBe(true);
    expect(canNudgeSync(nextNudgeState(nextNudgeState(null)))).toBe(true);
    expect(canNudgeSync('3')).toBe(false);
    expect(canNudgeSync('dismissed')).toBe(false);
    expect(canNudgeSync('done')).toBe(false);
  });
  it('names where a visit came from', () => {
    expect(arrivalSource('?utm_source=Reddit', 'https://www.reddit.com/', 'documentaryclub.fyi')).toBe('reddit');
    expect(arrivalSource('', 'https://old.reddit.com/r/Documentaries/', 'documentaryclub.fyi')).toBe('reddit.com');
    expect(arrivalSource('', 'https://out.reddit.com/t3_x', 'documentaryclub.fyi')).toBe('reddit.com');
    expect(arrivalSource('', 'https://www.google.com/', 'documentaryclub.fyi')).toBe('google.com');
    expect(arrivalSource('', 'https://documentaryclub.fyi/tags/space', 'documentaryclub.fyi')).toBe('internal');
    expect(arrivalSource('', '', 'documentaryclub.fyi')).toBe('direct');
  });
});
