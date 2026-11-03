import { Link } from '@tanstack/react-router';
import { SuggestForm } from '@/components/suggest-form';
import { SupportAbout } from '@/components/support';

const paragraph = 'mt-4 leading-relaxed text-foreground/90';
const heading = 'mt-8 font-display text-xl font-semibold';
export function AboutContent() {
  return <div className="max-w-2xl">
    <h1 className="font-display text-3xl font-semibold">About</h1>
    <p className={paragraph}>I'm <a href="https://www.linkedin.com/in/colly" target="_blank" rel="noopener noreferrer" className="underline">Colin</a>, and I've been a documentary fan for years.</p>
    <p className={paragraph}>Finding a new one to watch always meant the same routine. Find a title, hunt for the trailer, check the ratings, then work out where to stream it. None of the existing documentary sites did all of that in one place, so I built one that does.</p>
    <p className={paragraph}>It started as a list of my own favourites. I used AI to suggest more I'd like, and the collection grew from there. Every title is a feature-length film or a series, well reviewed and rated highly by real documentary fans, the kind of picks you'd find on Reddit and in niche corners of the internet.</p>
    <p className={paragraph}>I also gravitate towards award winners and great directors, so you can browse by both.</p>
    <h3 className={heading}>Where to start</h3>
    <p className={paragraph}>Editor's Choice is my personal favourites. Every title shows where it's streaming, and plenty are free on YouTube - look for the red "Watch free on YouTube" button.</p>
    <p className={paragraph}>Want it on your phone like an app? On iPhone, tap Share then "Add to Home Screen". On Android, open the browser menu and choose "Install app".</p>
    <SupportAbout heading={heading} paragraph={paragraph} />
    <h3 className={heading}>Got one I'm missing?</h3>
    <p className={paragraph}>Send me a message or suggest a documentary using the form below.</p>
    <SuggestForm />
    <p className="mt-8 text-sm text-muted-foreground"><Link to="/privacy" className="underline">Privacy</Link></p>
  </div>;
}
