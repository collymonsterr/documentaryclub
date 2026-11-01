// Countries offered in the streaming dropdown; codes match TMDB's watch-provider regions.
export const COUNTRIES = [
  ['AR', 'Argentina'], ['AU', 'Australia'], ['AT', 'Austria'], ['BE', 'Belgium'], ['BR', 'Brazil'], ['CA', 'Canada'], ['CL', 'Chile'], ['CO', 'Colombia'], ['CZ', 'Czechia'],
  ['DK', 'Denmark'], ['FI', 'Finland'], ['FR', 'France'], ['DE', 'Germany'], ['GR', 'Greece'], ['HK', 'Hong Kong'], ['HU', 'Hungary'], ['IN', 'India'], ['ID', 'Indonesia'],
  ['IE', 'Ireland'], ['IL', 'Israel'], ['IT', 'Italy'], ['JP', 'Japan'], ['MY', 'Malaysia'], ['MX', 'Mexico'], ['NL', 'Netherlands'], ['NZ', 'New Zealand'], ['NO', 'Norway'],
  ['PH', 'Philippines'], ['PL', 'Poland'], ['PT', 'Portugal'], ['RO', 'Romania'], ['SG', 'Singapore'], ['ZA', 'South Africa'], ['KR', 'South Korea'], ['ES', 'Spain'],
  ['SE', 'Sweden'], ['CH', 'Switzerland'], ['TW', 'Taiwan'], ['TH', 'Thailand'], ['TR', 'Türkiye'], ['AE', 'United Arab Emirates'], ['GB', 'United Kingdom'], ['US', 'United States'],
] as const;
export const DEFAULT_COUNTRY = 'US';
export const isCountry = (code: unknown): code is string => COUNTRIES.some(([c]) => c === code);
// Uses the browser's language region until the server's location check answers.
export const browserCountry = () => { const region = typeof navigator === 'undefined' ? undefined : navigator.language.split('-')[1]?.toUpperCase(); return isCountry(region) ? region : undefined; };
