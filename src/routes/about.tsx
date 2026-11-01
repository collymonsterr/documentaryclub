import { createFileRoute, Link } from '@tanstack/react-router';
import { SimplePage } from '@/components/simple-page';
import { staticPageHead } from '@/lib/site-urls';

export const Route = createFileRoute('/about')({
  head: () => staticPageHead('About', 'A personal collection of documentaries worth your time, built in Ireland.', '/about'),
  component: () => <SimplePage title="About">
    <p className="mt-4 leading-relaxed text-foreground/90">Documentary Club is a personal collection of documentaries I think are worth your time, built by me, Colin, in Ireland. No ads, no sponsored picks. Feature-length only. Editor's Choice marks my personal favourites.</p>
    <p className="mt-6 text-sm text-muted-foreground"><Link to="/suggest" className="underline">Suggest a documentary or send a message</Link> · <Link to="/privacy" className="underline">Privacy</Link></p>
  </SimplePage>,
});
