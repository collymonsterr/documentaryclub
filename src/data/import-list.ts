// User-approved import (135 submitted entries). Source of truth for reconciliation; never edit titles/years silently.
export type ImportCategory = 'strange' | 'psychology' | 'scams' | 'tech' | 'crime' | 'politics' | 'survival' | 'nature' | 'economics';
const RAW: Record<ImportCategory, string> = {
  strange: `American Movie|1999
Mr. Death|1999
Dark Days|2000
The King of Kong|2007
The Red Chapel|2009
Catfish|2010
Tabloid|2010
Room 237|2012
The Imposter|2012
Stories We Tell|2012
Finding Vivian Maier|2013
Jodorowsky's Dune|2013
Author: The JT LeRoy Story|2016
Tickled|2016
Long Shot|2017
Operation Odessa|2018
Shirkers|2018
Three Identical Strangers|2018
Cold Case Hammarskjöld|2019`,
  psychology: `Jesus Camp|2006
Jonestown: The Life and Death of Peoples Temple|2006
Kumaré|2011
Project Nim|2011
Going Clear|2015
Holy Hell|2016
Wormwood|2017
Behind the Curve|2018
Wild Wild Country|2018
The Family|2019
The Vow|2020
The Way Down|2021
Escaping Twin Flames|2023
Love Has Won|2023
Shiny Happy People|2023
Waco: American Apocalypse|2023`,
  scams: `Enron: The Smartest Guys in the Room|2005
Inside Job|2010
Sour Grapes|2016
Fyre|2019
The Inventor: Out for Blood in Silicon Valley|2019
McMillion$|2020
Made You Look|2020
The Lady and the Dale|2021
Bad Vegan|2022
The Tinder Swindler|2022
Bitconned|2024
The China Hustle|2017`,
  tech: `The Century of the Self|2002
We Live in Public|2009
All Watched Over by Machines of Loving Grace|2011
Indie Game: The Movie|2012
Citizenfour|2014
The Internet's Own Boy|2014
Deep Web|2015
HyperNormalisation|2016
Lo and Behold, Reveries of the Connected World|2016
Zero Days|2016
AlphaGo|2017
General Magic|2018
The Great Hack|2019
Feels Good Man|2020
Can't Get You Out of My Head|2021
Q: Into the Storm|2021
Eat the Rich: The GameStop Saga|2022
The Most Hated Man on the Internet|2022
Grand Theft Hamlet|2024
Money Electric: The Bitcoin Mystery|2024
The Remarkable Life of Ibelin|2024
The Thinking Game|2024
The Trap: What Happened to Our Dream of Freedom|2007`,
  crime: `The Thin Blue Line|1988
Paradise Lost|1996
Capturing the Friedmans|2003
The Staircase|2004
Dear Zachary|2008
Cropsey|2009
The Jinx|2015
Making a Murderer|2015
Abducted in Plain Sight|2017
The Keepers|2017
Evil Genius|2018
Collective|2019
Don't F**k with Cats|2019
American Murder: The Family Next Door|2020
Into the Deep|2020
The Pharmacist|2020
Tiger King|2020
Murder Among the Mormons|2021
The Perfect Neighbor|2025
The House I Live In|2012
13th|2016`,
  politics: `The Fog of War|2003
The Power of Nightmares|2004
Taxi to the Dark Side|2007
Restrepo|2010
The Act of Killing|2012
The Armstrong Lie|2013
The Unknown Known|2013
Bitter Lake|2015
Icarus|2017
The Mole: Undercover in North Korea|2020
Navalny|2022
20 Days in Mariupol|2023
The Trials of Henry Kissinger|2002
Why We Fight|2005`,
  survival: `Touching the Void|2003
Grizzly Man|2005
Stranded|2007
Man on Wire|2008
Happy People: A Year in the Taiga|2010
The Summit|2012
Maidentrip|2013
Meru|2015
Sherpa|2015
The Dawn Wall|2017
Free Solo|2018
Last Breath|2019
14 Peaks: Nothing Is Impossible|2021
The Alpinist|2021
The Rescue|2021
The Deepest Breath|2023`,
  nature: `The Cove|2009
Cave of Forgotten Dreams|2010
Into Eternity|2010
Chasing Ice|2012
Blackfish|2013
Particle Fever|2013
Tim's Vermeer|2013
Into the Inferno|2016
Apollo 11|2019
Honeyland|2019
My Octopus Teacher|2020
Fire of Love|2022`,
  economics: `The Corporation|2003
Capital in the Twenty-First Century|2019`,
};
export type ImportEntry = { title: string; year: number; category: ImportCategory };
export const IMPORT_LIST: ImportEntry[] = (Object.entries(RAW) as [ImportCategory, string][]).flatMap(([category, block]) =>
  block.split('\n').map(line => { const [title = '', year = ''] = line.split('|'); return { title, year: Number(year), category }; }));
// Submitted titles already in the original 17 merge into those stable IDs.
export const MERGED_INTO: Record<string, string> = {
  'The Remarkable Life of Ibelin|2024': 'ibelin', 'The Perfect Neighbor|2025': 'perfect-neighbor',
  '20 Days in Mariupol|2023': 'mariupol', 'Fire of Love|2022': 'fire-of-love',
};
// Tie-break hints only (used when BOTH a verified film and a verified series exist); identity still comes from TMDB.
export const MEDIA_HINTS: Record<string, 'movie' | 'tv'> = {
  'Catfish|2010': 'movie', 'The Staircase|2004': 'tv', 'The Family|2019': 'tv', 'Last Breath|2019': 'movie',
  'Into the Deep|2020': 'movie', 'Stranded|2007': 'movie', 'Paradise Lost|1996': 'movie', 'Wormwood|2017': 'tv',
};
// Extra search phrasings for titles TMDB lists under their full canonical subtitle.
export const SEARCH_ALIASES: Record<string, string[]> = {
  'Stranded|2007': ["Stranded: I've Come from a Plane That Crashed on the Mountains"],
  'Paradise Lost|1996': ['Paradise Lost: The Child Murders at Robin Hood Hills'],
};
// Credited filmmaker required where several same-title documentaries share a year (The Summit: 2008 K2 disaster film).
export const EXPECTED_PEOPLE: Record<string, string> = { 'The Summit|2012': 'Nick Ryan' };
export const importSlug = (title: string) => title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\$/g, 's').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
