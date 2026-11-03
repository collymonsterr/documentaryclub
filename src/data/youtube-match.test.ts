import { describe, expect, it } from 'vitest';
import { judge, namesFilm, parseDuration, playsIn, type Video } from '../../scripts/youtube-match';

const video: Video = { id: 'abcdefghijk', title: 'Hoop Dreams (full documentary)', channelId: 'official', channelTitle: 'FRONTLINE', minutes: 170, publishedAt: '2026-10-01', views: 1000, public: true, blocked: [] };
const film = { title: 'Hoop Dreams', minutes: 171 }, trusted = new Set(['official']);

describe('YouTube matching', () => {
  it('reads ISO durations', () => { expect(parseDuration('PT1H30M')).toBe(90); expect(parseDuration('P1DT1M')).toBe(1441); expect(parseDuration('PT45S')).toBe(0.75); });
  it('matches whole words, accents and aliases', () => {
    expect(namesFilm('Café Society', { title: 'Cafe Society' })).toBe(true);
    expect(namesFilm('Weddings', { title: 'Wedding' })).toBe(false);
    expect(namesFilm('The Doctor', { title: 'Rossi', aliases: ['The Doctor'] })).toBe(true);
  });
  it('confirms an official upload of the right length', () => { expect(judge(film, video, trusted)).toBe('confirmed'); });
  it('rejects clips and wrong lengths', () => { expect(judge(film, { ...video, minutes: 3 }, trusted)).toBeNull(); expect(judge(film, { ...video, minutes: 182 }, trusted)).toBeNull(); });
  it('accepts videos that play in one main region, and rejects ones that play in none', () => {
    expect(judge(film, { ...video, blocked: ['IE'] }, trusted)).toBe('confirmed');
    expect(judge(film, { ...video, allowed: ['US'] }, trusted)).toBe('confirmed');
    expect(playsIn({ blocked: [], allowed: ['US', 'BR'] })).toEqual(['US']);
    expect(judge(film, { ...video, blocked: ['IE', 'GB', 'US'] }, trusted)).toBeNull();
    expect(judge(film, { ...video, allowed: ['BR'] }, trusted)).toBeNull();
  });
  it('sends one-word titles and missing runtimes to review', () => {
    expect(judge({ title: 'Hoop', minutes: 171 }, { ...video, title: 'Hoop' }, trusted)).toBe('review');
    expect(judge({ title: 'Hoop Dreams' }, video, trusted)).toBe('review');
  });
  it('rejects videos about the film', () => { expect(judge(film, { ...video, title: 'Hoop Dreams audio commentary' }, trusted)).toBeNull(); });
  it('reviews official videos that only mention the title', () => { expect(judge(film, { ...video, title: 'What are Hoop Dreams worth?' }, trusted)).toBe('review'); });
  it('sends any other full upload to review, however new', () => {
    expect(judge(film, { ...video, channelId: 'someone' }, trusted)).toBe('review');
  });
});
