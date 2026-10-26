// Second approved batch (attachment list + inline list), kept verbatim as the audit source.
// Reconciled against the whole existing catalogue by normalized identity; only genuinely new works are imported.
import type { ImportCategory } from './import-list';
import { normalizeTitle } from '@/lib/discovery';

export const ATTACHMENT_RAW = `## Strange but True
- Up series (1964–2019)
- Gimme Shelter (1970)
- F for Fake (1973)
- Grey Gardens (1975)
- Gates of Heaven (1978)
- Burden of Dreams (1982)
- Paris Is Burning (1990)
- Hearts of Darkness: A Filmmaker's Apocalypse (1991)
- Theremin: An Electronic Odyssey (1993)
- Crumb (1994)
- Hoop Dreams (1994)
- Fast, Cheap & Out of Control (1997)
- Hands on a Hardbody (1997)
- American Movie (1999)
- Mr. Death (1999)
- My Best Fiend (1999)
- Dark Days (2000)
- Lost in La Mancha (2002)
- The King of Kong (2007)
- My Kid Could Paint That (2007)
- Best Worst Movie (2009)
- The Red Chapel (2009)
- Winnebago Man (2009)
- Catfish (2010)
- Exit Through the Gift Shop (2010)
- Marwencol (2010)
- Tabloid (2010)
- Room 237 (2012)
- Searching for Sugar Man (2012)
- Stories We Tell (2012)
- The Imposter (2012)
- Finding Vivian Maier (2013)
- Jodorowsky's Dune (2013)
- The Wolfpack (2015)
- Author: The JT LeRoy Story (2016)
- Tickled (2016)
- Jim & Andy: The Great Beyond (2017)
- Long Shot (2017)
- Bisbee '17 (2018)
- Operation Odessa (2018)
- Shirkers (2018)
- Three Identical Strangers (2018)
- Cold Case Hammarskjöld (2019)

## Cults, Psychology and Manipulation
- Titicut Follies (1967)
- Marjoe (1972)
- Quiet Rage: The Stanford Prison Study (1992)
- Jesus Camp (2006)
- Jonestown: The Life and Death of Peoples Temple (2006)
- Children of God: Lost and Found (2007)
- Kumaré (2011)
- Project Nim (2011)
- The Source Family (2012)
- Going Clear (2015)
- Prophet's Prey (2015)
- Holy Hell (2016)
- Wormwood (2017)
- Behind the Curve (2018)
- Derren Brown: Sacrifice (2018)
- The Push (2018)
- Wild Wild Country (2018)
- Bikram: Yogi, Guru, Predator (2019)
- The Family (2019)
- Heaven's Gate: The Cult of Cults (2020)
- The Vow (2020)
- Sons of Sam: A Descent into Darkness (2021)
- The Way Down (2021)
- Keep Sweet: Pray and Obey (2022)
- Escaping Twin Flames (2023)
- Love Has Won (2023)
- Shiny Happy People (2023)
- Waco: American Apocalypse (2023)
- Daughters of the Cult (2024)
- Quiet on Set: The Dark Side of Kids TV (2024)
- The Synanon Fix (2024)

## Scams and Grifts
- Enron: The Smartest Guys in the Room (2005)
- Who the #$&% Is Jackson Pollock? (2006)
- Inside Job (2010)
- Betting on Zero (2016)
- Sour Grapes (2016)
- The China Hustle (2017)
- Dirty Money (2018)
- Fyre (2019)
- The Inventor: Out for Blood in Silicon Valley (2019)
- McMillion$ (2020)
- Made You Look (2020)
- The Lady and the Dale (2021)
- LuLaRich (2021)
- Operation Varsity Blues (2021)
- WeWork: or the Making and Breaking of a $47 Billion Unicorn (2021)
- Bad Vegan (2022)
- Skandal! Bringing Down Wirecard (2022)
- The Tinder Swindler (2022)
- Trust No One: The Hunt for the Crypto King (2022)
- Bad Surgeon: Love Under the Knife (2023)
- Madoff: The Monster of Wall Street (2023)
- The Puppet Master: Hunting the Ultimate Conman (2023)
- Bitconned (2024)

## Technology, Internet and Ideas
- Triumph of the Nerds (1996)
- Revolution OS (2001)
- Startup.com (2001)
- The Century of the Self (2002)
- The Trap: What Happened to Our Dream of Freedom (2007)
- We Live in Public (2009)
- All Watched Over by Machines of Loving Grace (2011)
- Ecstasy of Order: The Tetris Masters (2011)
- Indie Game: The Movie (2012)
- Downloaded (2013)
- TPB AFK: The Pirate Bay Away from Keyboard (2013)
- Web Junkie (2013)
- Atari: Game Over (2014)
- Citizenfour (2014)
- Free to Play (2014)
- The Internet's Own Boy (2014)
- Print the Legend (2014)
- Deep Web (2015)
- Steve Jobs: The Man in the Machine (2015)
- HyperNormalisation (2016)
- Lo and Behold, Reveries of the Connected World (2016)
- Silicon Cowboys (2016)
- Zero Days (2016)
- AlphaGo (2017)
- Kim Dotcom: Caught in the Web (2017)
- The Cleaners (2018)
- General Magic (2018)
- The Great Hack (2019)
- Coded Bias (2020)
- Feels Good Man (2020)
- The Speed Cubers (2020)
- Can't Get You Out of My Head (2021)
- Fake Famous (2021)
- A Glitch in the Matrix (2021)
- Q: Into the Storm (2021)
- Eat the Rich: The GameStop Saga (2022)
- The Most Hated Man on the Internet (2022)
- Grand Theft Hamlet (2024)
- Money Electric: The Bitcoin Mystery (2024)
- The Remarkable Life of Ibelin (2024)
- The Thinking Game (2024)

## Crime, Investigations and Injustice
- The Thin Blue Line (1988)
- Aileen Wuornos: The Selling of a Serial Killer (1992)
- Brother's Keeper (1992)
- Paradise Lost (1996)
- Waco: The Rules of Engagement (1997)
- One Day in September (1999)
- Murder on a Sunday Morning (2001)
- Capturing the Friedmans (2003)
- The Staircase (2004)
- Dear Zachary (2008)
- Cropsey (2009)
- Into the Abyss (2011)
- The Central Park Five (2012)
- The House I Live In (2012)
- The Seven Five (2014)
- Cartel Land (2015)
- The Jinx (2015)
- Making a Murderer (2015)
- The Witness (2015)
- 13th (2016)
- Amanda Knox (2016)
- Killing for Love (2016)
- Southwest of Salem (2016)
- Abducted in Plain Sight (2017)
- Casting JonBenét (2017)
- The Keepers (2017)
- Mommy Dead and Dearest (2017)
- Crime + Punishment (2018)
- Evil Genius (2018)
- Collective (2019)
- Don't F\\*\\*k with Cats (2019)
- American Murder: The Family Next Door (2020)
- I'll Be Gone in the Dark (2020)
- Into the Deep (2020)
- The Pharmacist (2020)
- Tiger King (2020)
- Time (2020)
- Crime Scene: The Vanishing at the Cecil Hotel (2021)
- Murder Among the Mormons (2021)
- Sophie: A Murder in West Cork (2021)
- Girl in the Picture (2022)
- Our Father (2022)
- The Perfect Neighbor (2025)

## Politics and Geopolitics
- Hearts and Minds (1974)
- Harlan County, USA (1976)
- The Atomic Cafe (1982)
- Manufacturing Consent: Noam Chomsky and the Media (1992)
- The War Room (1993)
- The Trials of Henry Kissinger (2002)
- The Fog of War (2003)
- The Power of Nightmares (2004)
- Our Brand Is Crisis (2005)
- Why We Fight (2005)
- No End in Sight (2007)
- Taxi to the Dark Side (2007)
- Burma VJ (2008)
- Restrepo (2010)
- 5 Broken Cameras (2011)
- The Act of Killing (2012)
- The Gatekeepers (2012)
- The Armstrong Lie (2013)
- The Square (2013)
- The Unknown Known (2013)
- The Look of Silence (2014)
- Bitter Lake (2015)
- Winter on Fire (2015)
- Shadow World (2016)
- Weiner (2016)
- Get Me Roger Stone (2017)
- Icarus (2017)
- Last Men in Aleppo (2017)
- Bellingcat: Truth in a Post-Truth World (2018)
- Citizen K (2019)
- For Sama (2019)
- The Dissident (2020)
- The Mole: Undercover in North Korea (2020)
- Navalny (2022)
- 20 Days in Mariupol (2023)

## Economics, Corporations and Inequality
- Roger & Me (1989)
- The Corporation (2003)
- Darwin's Nightmare (2004)
- Black Gold (2006)
- Manufactured Landscapes (2006)
- Food, Inc. (2008)
- Capitalism: A Love Story (2009)
- Big Men (2013)
- Inequality for All (2013)
- Money for Nothing: Inside the Federal Reserve (2013)
- Requiem for the American Dream (2015)
- The True Cost (2015)
- China's Van Gogh (2016)
- Plastic China (2016)
- Generation Wealth (2018)
- American Factory (2019)
- Capital in the Twenty-First Century (2019)
- Ascension (2021)
- Downfall: The Case Against Boeing (2022)

## Survival and Extraordinary Feats
- Kon-Tiki (1950)
- The Man Who Skied Down Everest (1975)
- Little Dieter Needs to Fly (1997)
- Touching the Void (2003)
- Riding Giants (2004)
- Grizzly Man (2005)
- Deep Water (2006)
- Stranded (2007)
- Man on Wire (2008)
- Happy People: A Year in the Taiga (2010)
- Senna (2010)
- The Summit (2012)
- Beyond the Edge (2013)
- Maidentrip (2013)
- The Barkley Marathons (2014)
- Valley Uprising (2014)
- Meru (2015)
- Sherpa (2015)
- The Dawn Wall (2017)
- Mountain (2017)
- Free Solo (2018)
- Last Breath (2019)
- 14 Peaks: Nothing Is Impossible (2021)
- The Alpinist (2021)
- The Rescue (2021)
- Torn (2021)
- The Deepest Breath (2023)
- The Endurance (2024)

## Nature and Science
- Cane Toads: An Unnatural History (1988)
- For All Mankind (1989)
- Microcosmos (1996)
- Winged Migration (2001)
- March of the Penguins (2005)
- Encounters at the End of the World (2007)
- In the Shadow of the Moon (2007)
- The Cove (2009)
- Cave of Forgotten Dreams (2010)
- Into Eternity (2010)
- Chasing Ice (2012)
- Blackfish (2013)
- Particle Fever (2013)
- Tim's Vermeer (2013)
- Virunga (2014)
- Into the Inferno (2016)
- The Ivory Game (2016)
- Planet Earth II (2016)
- Chasing Coral (2017)
- The Farthest (2017)
- Jane (2017)
- Apollo 11 (2019)
- Fantastic Fungi (2019)
- Honeyland (2019)
- Sea of Shadows (2019)
- My Octopus Teacher (2020)
- Fire of Love (2022)`;

export const INLINE_RAW = `Pre-1980 / 1980s / 1990s explicitly requested:
Up series (1964–2019)
Titicut Follies (1967)
Gimme Shelter (1970)
Marjoe (1972)
The Atomic Cafe (1982)
Cane Toads: An Unnatural History (1988)
Paris Is Burning (1990)
Quiet Rage: The Stanford Prison Study (1992)
Aileen Wuornos: The Selling of a Serial Killer (1992)
Theremin: An Electronic Odyssey (1993)
Hoop Dreams (1994)
Triumph of the Nerds (1996)
Fast, Cheap & Out of Control (1997)
Waco: The Rules of Engagement (1997)
One Day in September (1999)
My Best Fiend (1999)

Cults, High-Control Groups & Manipulation:
Holy Hell (2016)
The Vow (2020)
Heaven’s Gate: The Cult of Cults (2020)
Love Has Won: The Cult of Mother God (2023)
Stolen Youth: Inside the Cult at Sarah Lawrence (2023)
Jesus Camp (2006)
Going Clear: Scientology and the Prison of Belief (2015)
Wild Wild Country (2018)

Strange True Stories & Twists:
The Imposter (2012)
Abducted in Plain Sight (2019)
Finders Keepers (2015)
Tickled (2016)
Three Identical Strangers (2018)
Dear Zachary (2008)

Crime, Investigations & Scams:
The Act of Killing (2012)
The Look of Silence (2014)
The Jinx (2015)
McMillions (2020)
Enron: The Smartest Guys in the Room (2005)
The Tinder Swindler (2022)
Don’t F**k with Cats (2019)

Politics, History & Systemic Injustice:
O.J.: Made in America (2016)
Citizenfour (2014)
Inside Job (2010)
HyperNormalisation (2016)
The Century of the Self (2002)
The Thin Blue Line (1988)
13th (2016)
The Vietnam War (2017)
The House I Live In (2012)
The Fog of War (2003)

Survival, Achievement & Human Extremes:
Free Solo (2018)
Man on Wire (2008)
Icarus (2017)
AlphaGo (2017)

Other:
The King of Kong: A Fistful of Quarters (2007)`;

const SECTION_CATEGORY: Record<string, ImportCategory | undefined> = {
  'Strange but True': 'strange', 'Cults, Psychology and Manipulation': 'psychology', 'Scams and Grifts': 'scams',
  'Technology, Internet and Ideas': 'tech', 'Crime, Investigations and Injustice': 'crime', 'Politics and Geopolitics': 'politics',
  'Economics, Corporations and Inequality': 'economics', 'Survival and Extraordinary Feats': 'survival', 'Nature and Science': 'nature',
  'Cults, High-Control Groups & Manipulation': 'psychology', 'Strange True Stories & Twists': 'strange', 'Crime, Investigations & Scams': 'crime',
  'Politics, History & Systemic Injustice': 'politics', 'Survival, Achievement & Human Extremes': 'survival', Other: 'strange',
};

export type RawInput = { source: 'attachment' | 'inline'; section: string; raw: string; title: string; year: number; yearEnd?: number | undefined; category?: ImportCategory | undefined };
// Unescape markdown asterisks and normalise curly apostrophes; the raw line is preserved for audit.
export const cleanTitle = (t: string) => t.replace(/\\\*/g, '*').replace(/[‘’]/g, "'").trim();
export function parseList(text: string, source: RawInput['source']): RawInput[] {
  let section = '';
  const out: RawInput[] = [];
  for (const line of text.split('\n').map(l => l.trim()).filter(Boolean)) {
    const header = line.match(/^##\s+(.+)$/) ?? line.match(/^(.+):$/);
    if (header && !/\(\d{4}/.test(line)) { section = header[1]!.trim(); continue; }
    const m = line.replace(/^-\s+/, '').match(/^(.+?)\s+\((\d{4})(?:[–-](\d{4}))?\)$/);
    if (!m) throw new Error(`Unparsed batch line: ${line}`);
    out.push({ source, section, raw: line, title: cleanTitle(m[1]!), year: Number(m[2]), ...(m[3] ? { yearEnd: Number(m[3]) } : {}), category: SECTION_CATEGORY[section] });
  }
  return out;
}
export const BATCH2_RAW: RawInput[] = [...parseList(ATTACHMENT_RAW, 'attachment'), ...parseList(INLINE_RAW, 'inline')];

// Explicit identity aliases: alternate/full titles that are the same work as an existing catalogue title.
export const IDENTITY_ALIASES: Record<string, string> = {
  mcmillions: 'mcmillions', // McMillions = McMillion$ (both normalise identically once "$" → "s")
  lovehaswonthecultofmothergod: 'lovehaswon',
  goingclearscientologyandtheprisonofbelief: 'goingclear',
  thekingofkongafistfulofquarters: 'thekingofkong',
};
// Explicit release/distribution year variants for the same work (Abducted in Plain Sight: 2017 festival, 2019 Netflix).
export const YEAR_VARIANTS: Record<string, number[]> = { abductedinplainsight: [2017, 2019] };
export const identityKey = (title: string) => {
  const n = normalizeTitle(title.replace(/\$/g, 's'));
  return IDENTITY_ALIASES[n] ?? n;
};
const sameWorkYear = (key: string, a: number, b: number) => Math.abs(a - b) <= 1 || (YEAR_VARIANTS[key]?.includes(a) && YEAR_VARIANTS[key]?.includes(b));

export type ExistingRef = { id: string; title: string; year: number; aliases?: string[] };
export type Reconciled = RawInput & { key: string; outcome: 'duplicate-in-batch' | 'existing' | 'new'; existingId?: string | undefined; firstTitle?: string };
export function reconcileBatch(raw: RawInput[], existing: ExistingRef[]): Reconciled[] {
  const known = existing.flatMap(e => [e.title, ...(e.aliases ?? [])].map(t => ({ key: identityKey(t), year: e.year, id: e.id })));
  const seen = new Map<string, { year: number; title: string; id?: string | undefined }>();
  return raw.map(r => {
    const key = identityKey(r.title);
    const prior = seen.get(key);
    if (prior && sameWorkYear(key, prior.year, r.year)) return { ...r, key, outcome: 'duplicate-in-batch', existingId: prior.id, firstTitle: prior.title };
    const hit = known.find(k => k.key === key && sameWorkYear(key, k.year, r.year));
    seen.set(key, { year: r.year, title: r.title, id: hit?.id });
    return hit ? { ...r, key, outcome: 'existing', existingId: hit.id } : { ...r, key, outcome: 'new' };
  });
}

// Inline-only works have no attachment section; their primary category comes from the inline heading.
// Primary + optional secondary subject tags, applied by submitted title (also re-tags earlier imports coherently).
export type Subject = ImportCategory | 'music' | 'arts';
export const CATEGORY_OVERRIDES: Record<string, Subject[]> = {
  'Up series': ['strange', 'economics'],
  'Gimme Shelter': ['music', 'arts'], 'F for Fake': ['arts', 'scams'], 'Grey Gardens': ['arts', 'strange'], 'Burden of Dreams': ['arts', 'survival'],
  'Paris Is Burning': ['arts', 'music'], "Hearts of Darkness: A Filmmaker's Apocalypse": ['arts'], 'Theremin: An Electronic Odyssey': ['music', 'tech'],
  Crumb: ['arts', 'strange'], 'Hoop Dreams': ['strange', 'economics'], 'Fast, Cheap & Out of Control': ['strange', 'nature'],
  'American Movie': ['arts', 'strange'], 'My Best Fiend': ['arts'], 'Lost in La Mancha': ['arts'], 'My Kid Could Paint That': ['arts', 'scams'],
  'Best Worst Movie': ['arts', 'strange'], 'Exit Through the Gift Shop': ['arts', 'scams'], Marwencol: ['arts', 'psychology'],
  'Room 237': ['arts', 'strange'], 'Searching for Sugar Man': ['music', 'strange'], 'Finding Vivian Maier': ['arts', 'strange'],
  "Jodorowsky's Dune": ['arts'], 'Jim & Andy: The Great Beyond': ['arts', 'psychology'], Shirkers: ['arts', 'strange'],
  'Stories We Tell': ['arts', 'psychology'], 'Author: The JT LeRoy Story': ['arts', 'scams'], 'Who the #$&% Is Jackson Pollock?': ['arts', 'scams'],
  "China's Van Gogh": ['arts', 'economics'], "Tim's Vermeer": ['arts', 'nature'], 'Indie Game: The Movie': ['tech', 'arts'], 'Grand Theft Hamlet': ['tech', 'arts'],
  'Enron: The Smartest Guys in the Room': ['scams', 'economics'], 'Inside Job': ['scams', 'economics'], 'Betting on Zero': ['scams', 'economics'],
  'The China Hustle': ['scams', 'economics'], 'Dirty Money': ['scams', 'economics'], 'Skandal! Bringing Down Wirecard': ['scams', 'economics'],
  'WeWork: or the Making and Breaking of a $47 Billion Unicorn': ['scams', 'economics'], 'Madoff: The Monster of Wall Street': ['scams', 'crime'],
  '13th': ['crime', 'politics'], 'The House I Live In': ['crime', 'politics'], 'O.J.: Made in America': ['crime', 'politics'], Collective: ['crime', 'politics'],
  'The Central Park Five': ['crime', 'politics'], Time: ['crime', 'politics'], Icarus: ['politics', 'scams'],
  'Quiet on Set: The Dark Side of Kids TV': ['psychology', 'crime'], 'Keep Sweet: Pray and Obey': ['psychology', 'crime'], "Prophet's Prey": ['psychology', 'crime'],
  'The Act of Killing': ['politics', 'crime'], 'The Look of Silence': ['politics', 'crime'], 'Fyre': ['scams', 'music'],
};

// Evidence-pinned identities (verified against TMDB details before use; never trusted blindly).
// The Push (2018): Derren Brown's Netflix special, catalogued by TMDB as "Derren Brown: Pushed to the Edge" (2016 UK broadcast);
// the unrelated 2018 "The Push" is Grant Korgan's adventure film. The Endurance (2024): National Geographic's Shackleton
// shipwreck film, catalogued as "Endurance" (2024, Vasarhelyi/Chin/Hewit), not The Endurance (2000).
export const BATCH2_PINS: Record<string, { media: 'movie' | 'tv'; id: number; evidence: RegExp; why: string }> = {
  'The Push|2018': { media: 'movie', id: 377319, evidence: /Derren Brown/, why: 'Derren Brown psychology experiment (cults/manipulation section); TMDB title Derren Brown: Pushed to the Edge' },
  'Theremin: An Electronic Odyssey|1993': { media: 'movie', id: 70042, evidence: /Theremin/, why: '1993 festival premiere, TMDB release 1995' },
  'Quiet Rage: The Stanford Prison Study|1992': { media: 'movie', id: 226763, evidence: /Zimbardo/, why: 'TMDB title Quiet Rage: The Stanford Prison Experiment' },
  'Sons of Sam: A Descent into Darkness|2021': { media: 'tv', id: 122672, evidence: /Son of Sam/, why: 'Netflix docuseries; TMDB title The Sons of Sam' },
  'Triumph of the Nerds|1996': { media: 'movie', id: 15554, evidence: /Triumph of the Nerds/, why: 'TMDB full title The Triumph of the Nerds: The Rise of Accidental Empires' },
  'Time|2020': { media: 'movie', id: 653729, evidence: /^Time /, why: 'Garrett Bradley 2020 documentary (verified via director credits)' },
  '5 Broken Cameras|2011': { media: 'movie', id: 84170, evidence: /Five Broken Cameras/, why: 'TMDB spells the number: Five Broken Cameras' },
  "China's Van Gogh|2016": { media: 'movie', id: 426619, evidence: /China's Van Goghs/, why: "TMDB plural title China's Van Goghs" },
  'O.J.: Made in America|2016': { media: 'movie', id: 377462, evidence: /O\.J\./, why: 'Oscar-winning feature cut chosen over the identical ESPN miniseries listing' },
  'The Endurance|2024': { media: 'movie', id: 947763, evidence: /Shackleton/, why: '2024 Shackleton shipwreck documentary by Vasarhelyi, Chin & Hewit; TMDB title Endurance' },
};
// Collections represented as one entry; parts outside the submitted range are excluded from coverage.
export const BATCH2_COLLECTIONS: Record<string, { id: number; name: RegExp }> = { 'Up series|1964': { id: 95051, name: /^The Up Collection$/ } };
