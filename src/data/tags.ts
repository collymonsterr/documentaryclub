// The only tags the site shows; the sync rejects anything else in the CSV. Add a tag with one line here.
export const TAGS = [
  { id: 'editors-choice', label: "Editor's Choice", group: 'picks', title: "Editor's Choice", description: 'My personal favourites from the whole collection.' },
  { id: 'essential', label: 'Essential', group: 'picks', title: 'Essential Documentaries', description: 'A starting point: the documentaries most worth seeing first.' },
  { id: 'presenter-led', label: 'Presenter-led', group: 'picks', title: 'Presenter-led Documentaries', description: 'Films where the person asking the questions is part of the story.' },
  { id: 'go-in-blind', label: 'Go in blind', group: 'picks', title: 'Documentaries to Go in Blind', description: 'Best watched knowing as little as possible, so avoid the trailers.' },
  { id: 'wrongful-conviction', label: 'Wrongful conviction', group: 'topics', title: 'Wrongful Conviction Documentaries', description: 'Disputed verdicts, flawed investigations and the fight to overturn them.' },
  { id: 'mountains', label: 'Mountains', group: 'topics', title: 'Mountain Documentaries', description: 'Climbers, summits and what it takes to come back down.' },
  { id: 'ocean', label: 'Ocean', group: 'topics', title: 'Ocean Documentaries', description: 'Life at sea, under it and on the edge of it.' },
  { id: 'space', label: 'Space', group: 'topics', title: 'Space Documentaries', description: 'Missions, astronauts and our attempts to understand what is out there.' },
  { id: 'filmmaking', label: 'Filmmaking', group: 'topics', title: 'Documentaries About Filmmaking', description: 'How films get made, and how they sometimes fall apart.' },
  { id: 'psychedelics', label: 'Psychedelics', group: 'topics', title: 'Psychedelics Documentaries', description: 'The science, history and culture of mind-altering drugs.' },
  { id: 'narcos', label: 'Narcos', group: 'topics', title: 'Narco Documentaries', description: 'Cartels, traffickers and the people caught up in the drug trade.' },
  { id: 'hackers-and-leaks', label: 'Hackers & leaks', group: 'topics', title: 'Hackers & Leaks Documentaries', description: 'Whistleblowers, hackers and the secrets they brought out.' },
  { id: 'startups', label: 'Startups', group: 'topics', title: 'Startup Documentaries', description: 'Big ideas, bigger egos and what happened to the money.' },
  { id: 'internet-culture', label: 'Internet culture', group: 'topics', title: 'Internet Culture Documentaries', description: 'How life online changed the way people think and behave.' },
  { id: 'gaming', label: 'Gaming', group: 'topics', title: 'Gaming Documentaries', description: 'The players, makers and rivalries behind video games.' },
  { id: 'all-archive-footage', label: 'All archive footage', group: 'topics', title: 'All-Archive Documentaries', description: 'Told entirely through existing footage, with no new interviews on screen.' },
  { id: 'electronic-music', label: 'Electronic Music', group: 'topics', title: 'Electronic Music Documentaries', description: 'The machines, scenes and people behind house, techno and rave.' },
  { id: 'automotive', label: 'Automotive', group: 'topics', title: 'Automotive Documentaries', description: 'Racing, road trips and the people obsessed with cars and motorbikes.' },
  { id: 'wine', label: 'Wine', group: 'topics', title: 'Wine Documentaries', description: 'The people who grow it, judge it, collect it and fake it.' },
  { id: 'free-on-youtube', label: 'Free on YouTube', group: 'topics', title: 'Documentaries Free on YouTube', description: 'Full-length films you can watch free on YouTube.' },
] as const;
export const PICK_TAGS = TAGS.filter(t => t.group === 'picks');
export const TOPIC_TAGS = TAGS.filter(t => t.group === 'topics');
export const tagLabel = (id: string) => TAGS.find(t => t.id === id)?.label;
export const knownTags = (tags: string[] = []) => tags.filter(tagLabel);
const rank = (id: string) => id === 'editors-choice' ? 0 : PICK_TAGS.some(t => t.id === id) ? 1 : 2;
// Editor's Choice leads, then other Picks, then CSV order.
export const orderedTags = (tags: string[] = []) => knownTags(tags).sort((a, b) => rank(a) - rank(b));
