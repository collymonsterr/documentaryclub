import type { Category } from './films';
// Page headings and one-line descriptions for /categories/… pages.
export const CATEGORY_COPY: Partial<Record<Category, { title: string; description: string }>> = {
  psychology: { title: 'Cults & Psychology Documentaries', description: 'Why people believe what they believe, and who takes advantage of it.' },
  scams: { title: 'Scam Documentaries', description: 'Frauds, fakes and the people who fell for them.' },
  tech: { title: 'Tech Documentaries', description: 'The people and ideas behind the technology we live with.' },
  crime: { title: 'Crime Documentaries', description: 'Real cases, investigations and their consequences.' },
  politics: { title: 'Politics Documentaries', description: 'Power, campaigns and how decisions get made.' },
  war: { title: 'War Documentaries', description: 'Conflict as seen by those who lived through it.' },
  survival: { title: 'Adventure Documentaries', description: 'Expeditions, risks and journeys that went further than planned.' },
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
