import { describe, expect, it } from 'vitest';
import { judge, namesFilm, parseDuration, playsIn, type Video } from '../../scripts/youtube-match';

const now = Date.parse('2026-11-01');
const video: Video = { id: 'abcdefghijk', title: 'Hoop Dreams (full documentary)', channelId: 'official', channelTitle: 'FRONTLINE', minutes: 170, publishedAt: '2026-10-01', views: 1000, public: true, blocked: [] };
const film = { title: 'Hoop Dreams', minutes: 171 }, trusted = new Set(['official']);

describe('YouTube matching', () => {
  it('reads ISO durations', () => { expect(parseDuration('PT1H30M')).toBe(90); expect(parseDuration('P1DT1M')).toBe(1441); expect(parseDuration('PT45S')).toBe(0.75); });
  it('matches whole words, accents and aliases', () => {
    expect(namesFilm('Café Society', { title: 'Cafe Society' })).toBe(true);
    expect(namesFilm('Weddings', { title: 'Wedding' })).toBe(false);
    expect(namesFilm('The Doctor', { title: 'Rossi', aliases: ['The Doctor'] })).toBe(true);
  });
  it('confirms an official upload of the right length', () => { expect(judge(film, video, trusted, now)).toBe('confirmed'); });
  it('rejects clips and wrong lengths', () => { expect(judge(film, { ...video, minutes: 3 }, trusted, now)).toBeNull(); expect(judge(film, { ...video, minutes: 182 }, trusted, now)).toBeNull(); });
  it('accepts videos that play in one main region, and rejects ones that play in none', () => {
    expect(judge(film, { ...video, blocked: ['IE'] }, trusted, now)).toBe('confirmed');
    expect(judge(film, { ...video, allowed: ['US'] }, trusted, now)).toBe('confirmed');
    expect(playsIn({ blocked: [], allowed: ['US', 'BR'] })).toEqual(['US']);
    expect(judge(film, { ...video, blocked: ['IE', 'GB', 'US'] }, trusted, now)).toBeNull();
    expect(judge(film, { ...video, allowed: ['BR'] }, trusted, now)).toBeNull();
  });
  it('sends one-word titles and missing runtimes to review', () => {
    expect(judge({ title: 'Hoop', minutes: 171 }, { ...video, title: 'Hoop' }, trusted, now)).toBe('review');
    expect(judge({ title: 'Hoop Dreams' }, video, trusted, now)).toBe('review');
  });
  it('rejects videos about the film', () => { expect(judge(film, { ...video, title: 'Hoop Dreams audio commentary' }, trusted, now)).toBeNull(); });
  it('reviews official videos that only mention the title', () => { expect(judge(film, { ...video, title: 'What are Hoop Dreams worth?' }, trusted, now)).toBe('review'); });
  it('holds back unofficial uploads under six months old', () => {
    expect(judge(film, { ...video, channelId: 'someone' }, trusted, now)).toBeNull();
    expect(judge(film, { ...video, channelId: 'someone', publishedAt: '2025-01-01' }, trusted, now)).toBe('review');
  });
});
