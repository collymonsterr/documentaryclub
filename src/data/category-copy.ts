import type { Category } from './films';
// Page headings and one-line descriptions for /categories/… pages.
export const CATEGORY_COPY: Partial<Record<Category, { title: string; description: string }>> = {
  psychology: { title: 'Cult & Psychology Documentaries', description: 'Why people believe what they believe, and who takes advantage of it.' },
  scams: { title: 'Scam Documentaries', description: 'Frauds, fakes and the people who fell for them.' },
  tech: { title: 'Tech Documentaries', description: 'The people and ideas behind the technology we live with.' },
  crime: { title: 'True Crime Documentaries', description: 'Real cases, investigations and their consequences.' },
  politics: { title: 'Political Documentaries', description: 'Power, campaigns and how decisions get made.' },
  war: { title: 'War Documentaries', description: 'Conflict as seen by those who lived through it.' },
  survival: { title: 'Adventure & Survival Documentaries', description: 'Expeditions, risks and journeys that went further than planned.' },
  sport: { title: 'Sport Documentaries', description: 'Competition, obsession and what winning costs.' },
  nature: { title: 'Nature Documentaries', description: 'Animals, landscapes and our relationship with the natural world.' },
  food: { title: 'Food Documentaries', description: 'Chefs, wine, beer and what ends up on the table.' },
  science: { title: 'Science Documentaries', description: 'Discoveries, experiments and the people behind them.' },
  economics: { title: 'Economics Documentaries', description: 'Money, work and how the system really runs.' },
  arts: { title: 'Art Documentaries', description: 'Artists, forgers and the worlds they work in.' },
  music: { title: 'Music Documentaries', description: 'Musicians, scenes and the stories behind the songs.' },
  life: { title: 'Life Story Documentaries', description: 'Portraits of unusual lives, famous and unknown.' },
  drugs: { title: 'Drug Documentaries', description: 'Addiction, policy and the trade that keeps it all going.' },
  sex: { title: 'Sex Documentaries', description: 'Sex, the industry around it and how society deals with both.' },
};
// Same treatment for the Moods and Awards tabs.
export const MOOD_COPY: Record<string, { title: string; description: string }> = {
  funny: { title: 'Funny Documentaries', description: 'True stories that will make you laugh out loud.' },
  feelgood: { title: 'Feel-good Documentaries', description: 'Real people and stories that leave you feeling better than you started.' },
  gripping: { title: 'Gripping Documentaries', description: "Once these start, you won't want to stop." },
  harrowing: { title: 'Harrowing Documentaries', description: 'Hard to watch and hard to forget, so pick your moment.' },
  infuriating: { title: 'Infuriating Documentaries', description: 'Injustice, greed and failure that will make your blood boil.' },
  mindblowing: { title: 'Mind-blowing Documentaries', description: 'Films that change how you see the world.' },
  breathtaking: { title: 'Breathtaking Documentaries', description: 'Made to be looked at, so pick the biggest screen you have.' },
  weird: { title: 'Weird Documentaries', description: 'Strange people, stranger stories, and all of it true.' },
};
export const AWARD_COPY: Record<string, { title: string; description: string }> = {
  // Titles name "documentary" and the award the way people search for it ("BAFTA-winning documentaries"), since they are
  // the page title and h1. Oscar's says "and Nominated" because most of its list are nominees.
  oscar: { title: 'Oscar-Winning and Nominated Documentaries', description: 'Every Academy Award-winning documentary in the collection, newest ceremony first, then the Oscar nominees.' },
  bafta: { title: 'BAFTA-Winning Documentaries', description: 'Documentaries that won a BAFTA, mostly the British Academy award for Best Documentary.' },
  emmy: { title: 'Emmy-Winning Documentaries', description: 'Documentaries and docuseries that won a Primetime Emmy.' },
  sundance: { title: 'Sundance Award-Winning Documentaries', description: 'Documentaries that won the Grand Jury Prize, the Audience Award or the Directing Award at Sundance.' },
  tribeca: { title: 'Tribeca Award-Winning Documentaries', description: 'Winners of the Best Documentary Feature prize at the Tribeca Festival.' },
  ida: { title: 'IDA Documentary Award Winners', description: "Winners at the International Documentary Association's awards: Best Feature, Best Series and the earlier Distinguished Documentary Achievement awards." },
  cannes: { title: 'Cannes Award-Winning Documentaries', description: "Documentaries that won the Palme d'Or or L'Œil d'or at the Cannes Film Festival." },
};
