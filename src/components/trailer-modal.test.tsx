import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FILMS } from '@/data/films';
import { TrailerModal } from './trailer-modal';
function Harness({ trailer }: { trailer?: string }) {
 const [open,setOpen] = useState(false); const film=FILMS[0];
 if (!film) return null;
 return <TrailerModal film={film} trailer={trailer} open={open} onOpenChange={setOpen} />;
}
describe('trailer modal', () => {
 it('opens inline official trailer and removes player on close', async () => {
  render(<Harness trailer="abcdefghijk" />);
  fireEvent.click(screen.getByRole('button',{name:'Trailer',exact:true}));
  expect(screen.getByTitle('Beyond Utopia official trailer').getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1');
  fireEvent.click(screen.getByRole('button',{name:'Close',exact:true}));
  await waitFor(()=>expect(screen.queryByTitle('Beyond Utopia official trailer')).toBeNull());
 });
 it('provides search rather than an invented inline video when missing', () => {
  render(<Harness />); fireEvent.click(screen.getByRole('button',{name:'Trailer',exact:true}));
  expect(screen.getByRole('link',{name:'Search YouTube for trailer'}).getAttribute('href')).toContain('youtube.com/results?search_query=Beyond%20Utopia');
  expect(screen.queryByTitle('Beyond Utopia official trailer')).toBeNull();
 });
});
