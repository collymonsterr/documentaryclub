const MEASUREMENT_ID = 'G-4H3Z8664MT';
const CONSENT_KEY = 'dc-analytics-consent';
type Consent = 'granted' | 'denied';
type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}
export function saveConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // The choice still applies for this visit.
  }
}
export const clearConsent = () => {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Nothing stored to clear.
  }
};
// Google's script is only added after the visitor accepts; route changes are sent by hand because the site is single-page.
export function startAnalytics() {
  const w = window as GtagWindow;
  if (w.gtag) return;
  w.dataLayer = w.dataLayer ?? [];
  w.gtag = function gtag() {
    // gtag.js reads the raw arguments object.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer?.push(arguments);
  };
  w.gtag('js', new Date());
  w.gtag('config', MEASUREMENT_ID, { send_page_view: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}
export const trackPageView = () => (window as GtagWindow).gtag?.('event', 'page_view', { page_location: window.location.href, page_title: document.title });
// Only reaches Google once the visitor has accepted analytics; otherwise gtag doesn't exist and nothing is sent.
export const trackEvent = (name: string, params: Record<string, string>) => (window as GtagWindow).gtag?.('event', name, params);
