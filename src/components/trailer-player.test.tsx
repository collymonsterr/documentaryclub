import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FILMS } from '@/data/films';
import { TrailerPlayer } from './trailer-player';
function Harness({ trailer }: { trailer?: string }) {
  const [playing, setPlaying] = useState(false); const film = FILMS[0];
  if (!film) return null;
  return <TrailerPlayer film={film} trailer={trailer} playing={playing} onPlay={() => setPlaying(true)} />;
}
describe('inline trailer', () => {
  it('mounts the player only after play is pressed', () => {
    render(<Harness trailer="abcdefghijk" />);
    expect(screen.queryByTitle('Beyond Utopia official trailer')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play Beyond Utopia trailer' }));
    expect(screen.getByTitle('Beyond Utopia official trailer').getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1');
  });
  it('offers a search rather than an invented video when missing', () => {
    render(<Harness />);
    expect(screen.getByRole('link', { name: 'Search YouTube for trailer' }).getAttribute('href')).toContain('youtube.com/results?search_query=Beyond%20Utopia');
  });
});
