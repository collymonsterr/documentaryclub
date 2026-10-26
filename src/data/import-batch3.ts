// Third approved batch: the user's "Sex & Drugs (18+)" list, stored verbatim as the audit source.
// Every entry's home category is 'sexdrugs'. Fantastic Fungi moves here from Nature & Science per the
// user's note; LGBTQ history films, Pray Away, The Red Pill and Born into Brothels stay where they are.
export type Batch3Raw = { section: string; title: string; year: number };
export const BATCH3_RAW: Batch3Raw[] = [
  // Escobar and the Cocaine Trade
  { section: 'Escobar and the Cocaine Trade', title: 'Cocaine Cowboys', year: 2006 },
  { section: 'Escobar and the Cocaine Trade', title: "Cocaine Cowboys II: Hustlin' with the Godmother", year: 2008 },
  { section: 'Escobar and the Cocaine Trade', title: 'Sins of My Father', year: 2009 },
  { section: 'Escobar and the Cocaine Trade', title: 'The Two Escobars', year: 2010 },
  { section: 'Escobar and the Cocaine Trade', title: "Pablo's Hippos", year: 2010 },
  { section: 'Escobar and the Cocaine Trade', title: 'Narco Cultura', year: 2013 },
  { section: 'Escobar and the Cocaine Trade', title: 'Freeway: Crack in the System', year: 2015 },
  { section: 'Escobar and the Cocaine Trade', title: 'Countdown to Death: Pablo Escobar', year: 2017 },
  { section: 'Escobar and the Cocaine Trade', title: 'The Last Narc', year: 2020 },
  { section: 'Escobar and the Cocaine Trade', title: 'Cocaine Cowboys: The Kings of Miami', year: 2021 },
  // Addiction and Hard Drugs
  { section: 'Addiction and Hard Drugs', title: 'Black Tar Heroin: The Dark End of the Street', year: 2000 },
  { section: 'Addiction and Hard Drugs', title: 'Amy', year: 2015 },
  { section: 'Addiction and Hard Drugs', title: 'Heroin(e)', year: 2017 },
  { section: 'Addiction and Hard Drugs', title: 'Take Your Pills', year: 2018 },
  { section: 'Addiction and Hard Drugs', title: 'The Crime of the Century', year: 2021 },
  // Weed
  { section: 'Weed', title: 'Grass', year: 1999 },
  { section: 'Weed', title: 'The Union: The Business Behind Getting High', year: 2007 },
  { section: 'Weed', title: 'Super High Me', year: 2007 },
  { section: 'Weed', title: 'Marijuana: A Chronic History', year: 2010 },
  { section: 'Weed', title: 'The Culture High', year: 2014 },
  { section: 'Weed', title: 'Rolling Papers', year: 2015 },
  { section: 'Weed', title: 'Grass Is Greener', year: 2019 },
  // Psychedelics
  { section: 'Psychedelics', title: 'DMT: The Spirit Molecule', year: 2010 },
  { section: 'Psychedelics', title: 'Neurons to Nirvana', year: 2013 },
  { section: 'Psychedelics', title: 'Dying to Know: Ram Dass & Timothy Leary', year: 2014 },
  { section: 'Psychedelics', title: 'The Sunshine Makers', year: 2015 },
  { section: 'Psychedelics', title: "Hamilton's Pharmacopeia", year: 2016 },
  { section: 'Psychedelics', title: 'Orange Sunshine', year: 2016 },
  { section: 'Psychedelics', title: 'The Last Shaman', year: 2016 },
  { section: 'Psychedelics', title: 'Magic Medicine', year: 2018 },
  { section: 'Psychedelics', title: 'Fantastic Fungi', year: 2019 },
  { section: 'Psychedelics', title: 'Have a Good Trip: Adventures in Psychedelics', year: 2020 },
  { section: 'Psychedelics', title: 'How to Change Your Mind', year: 2022 },
  // Louis Theroux
  { section: 'Louis Theroux', title: "Louis Theroux's Weird Weekends: Porn", year: 1998 },
  { section: 'Louis Theroux', title: 'Louis and the Brothel', year: 2003 },
  { section: 'Louis Theroux', title: 'Louis Theroux: Twilight of the Porn Stars', year: 2012 },
  { section: 'Louis Theroux', title: 'Louis Theroux: Drinking to Oblivion', year: 2016 },
  { section: 'Louis Theroux', title: 'Louis Theroux: Dark States – Heroin Town', year: 2017 },
  { section: 'Louis Theroux', title: "Louis Theroux's Forbidden America", year: 2022 },
  // Sex Industry and Desire
  { section: 'Sex Industry and Desire', title: 'Inside Deep Throat', year: 2005 },
  { section: 'Sex Industry and Desire', title: 'Guys and Dolls', year: 2007 },
  { section: 'Sex Industry and Desire', title: "Whores' Glory", year: 2011 },
  { section: 'Sex Industry and Desire', title: 'After Porn Ends', year: 2012 },
  { section: 'Sex Industry and Desire', title: 'Kink', year: 2013 },
  { section: 'Sex Industry and Desire', title: 'Love Me', year: 2014 },
  { section: 'Sex Industry and Desire', title: 'Hot Girls Wanted', year: 2015 },
  { section: 'Sex Industry and Desire', title: 'Rocco', year: 2016 },
  { section: 'Sex Industry and Desire', title: 'Scotty and the Secret History of Hollywood', year: 2017 },
  { section: 'Sex Industry and Desire', title: 'Silicone Soul', year: 2018 },
  { section: 'Sex Industry and Desire', title: 'Secrets of Playboy', year: 2022 },
  { section: 'Sex Industry and Desire', title: 'Money Shot: The Pornhub Story', year: 2023 },
  // Excess and Hedonism
  { section: 'Excess and Hedonism', title: 'Party Monster: The Shockumentary', year: 1998 },
  { section: 'Excess and Hedonism', title: 'Gonzo: The Life and Work of Dr. Hunter S. Thompson', year: 2008 },
  { section: 'Excess and Hedonism', title: 'Spark: A Burning Man Story', year: 2013 },
  { section: 'Excess and Hedonism', title: 'Studio 54', year: 2018 },
  { section: 'Excess and Hedonism', title: "Trainwreck: Woodstock '99", year: 2022 },
];

// Title-scoped search aliases for entries whose submitted name differs from the canonical record
// (episode-level submissions map to their parent series/special).
export const BATCH3_ALIASES: Record<string, string> = {
  'Louis Theroux: Dark States – Heroin Town|2017': 'Louis Theroux: Dark States',
  "Louis Theroux's Weird Weekends: Porn|1998": "Louis Theroux's Weird Weekends",
};
