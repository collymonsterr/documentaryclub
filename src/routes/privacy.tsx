import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { SimplePage } from '@/components/simple-page';
import { clearConsent } from '@/lib/analytics';
import { staticPageHead } from '@/lib/site-urls';

export const Route = createFileRoute('/privacy')({
  head: () => staticPageHead('Privacy', 'What Documentary Club collects and why.', '/privacy'),
  component: () => <SimplePage title="Privacy">
    <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
      <p><strong>Analytics.</strong> If you accept, Google Analytics sets cookies and records which pages are visited, so I can see what people use. If you decline, it never loads.</p>
      <p><strong>Anonymous counts.</strong> Without cookies, the site adds 1 to simple daily tallies: page and film page views, saves, trailer plays, clicks to Netflix or YouTube, searches that find nothing, and visits by referring site, country and device type. Nothing that identifies you is stored with them, and they can't be linked back to you.</p>
      <p><strong>Your device.</strong> Your saved films, watched list, country and analytics choice are kept in your own browser; only the anonymous counts above reach me.</p>
      <p><strong>Your country.</strong> It is worked out from your connection to show the right streaming services. It is only stored as part of the anonymous count of visits per country.</p>
      <p><strong>Weekly email.</strong> If you sign up, your email address is stored by Kit (kit.com), the service that sends the newsletter, along with which part of the site you signed up from. You'll get one email to confirm before anything else is sent. Every email has an unsubscribe link, and unsubscribing stops them straight away.</p>
      <p><strong>Messages and suggestions.</strong> Anything you send, including a name or email address if you give one, is emailed to my private inbox. It is only used to read and reply to your message, and you can ask me to delete it through the same form.</p>
    </div>
    <Button className="mt-6" size="sm" variant="outline" onClick={() => { clearConsent(); window.location.reload(); }}>Change analytics choice</Button>
  </SimplePage>,
});
