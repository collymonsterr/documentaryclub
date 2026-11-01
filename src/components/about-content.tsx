import { Link } from '@tanstack/react-router';

export function AboutContent() {
  return <div className="max-w-2xl">
    <h2 className="font-display text-3xl font-semibold">About</h2>
    <p className="mt-4 leading-relaxed text-foreground/90">Documentary Club is a personal collection of documentaries I think are worth your time, built by me, Colin, in Ireland. No ads, no sponsored picks. Feature-length only. Editor's Choice marks my personal favourites.</p>
    <p className="mt-6 text-sm text-muted-foreground"><Link to="/suggest" className="underline">Suggest a documentary or send a message</Link> · <Link to="/privacy" className="underline">Privacy</Link></p>
  </div>;
}
