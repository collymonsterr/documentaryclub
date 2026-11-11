import { Link } from '@tanstack/react-router';
import { SuggestForm } from '@/components/suggest-form';
import { SupportAbout } from '@/components/support';

const paragraph = 'mt-4 leading-relaxed text-foreground/90';
const heading = 'mt-8 font-display text-xl font-semibold';
export function AboutContent() {
  return <div className="max-w-2xl">
    <h1 className="font-display text-3xl font-semibold">About Documentary Club</h1>
    <p className={paragraph}>I'm <a href="https://www.linkedin.com/in/colly" target="_blank" rel="noopener noreferrer" className="underline">Colin</a>. I got tired of hunting for the trailer, the ratings and where to stream every documentary I wanted to watch, so I built one place that does all three.</p>
    <SupportAbout />
    <h2 className={heading}>How the films are picked</h2>
    <p className={paragraph}>Every title is a feature film or series that documentary fans rate highly, with a lean towards award winners and great directors. Editor's Choice is my personal favourites, and plenty are free on YouTube.</p>
    <p className={paragraph}>Not sure where to start? <Link to="/best" className="underline">See every list on the site</Link>: the best documentaries by subject, mood, decade, director, award and streaming service, all on one page.</p>
    <p className={paragraph}>Want it on your phone like an app? On iPhone, tap Share then "Add to Home Screen". On Android, choose "Install app" from the browser menu.</p>
    <h2 className={heading}>Got one I'm missing?</h2>
    <p className={paragraph}>Suggest a documentary or send me a message below.</p>
    <SuggestForm />
    <p className="mt-8 text-sm text-muted-foreground"><Link to="/privacy" className="underline">Privacy</Link></p>
  </div>;
}
