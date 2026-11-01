// The only tags the site shows; the sync rejects anything else in the CSV. Add a tag with one line here.
export const TAGS = [
  { id: 'editors-choice', label: "Editor's Choice", group: 'picks' }, { id: 'essential', label: 'Essential', group: 'picks' },
  { id: 'presenter-led', label: 'Presenter-led', group: 'picks' }, { id: 'go-in-blind', label: 'Go in blind', group: 'picks' },
  { id: 'wrongful-conviction', label: 'Wrongful conviction', group: 'topics' }, { id: 'mountains', label: 'Mountains', group: 'topics' },
  { id: 'ocean', label: 'Ocean', group: 'topics' }, { id: 'space', label: 'Space', group: 'topics' },
  { id: 'filmmaking', label: 'Filmmaking', group: 'topics' }, { id: 'psychedelics', label: 'Psychedelics', group: 'topics' },
  { id: 'narcos', label: 'Narcos', group: 'topics' }, { id: 'hackers-and-leaks', label: 'Hackers & leaks', group: 'topics' },
  { id: 'startups', label: 'Startups', group: 'topics' }, { id: 'internet-culture', label: 'Internet culture', group: 'topics' },
  { id: 'gaming', label: 'Gaming', group: 'topics' }, { id: 'all-archive-footage', label: 'All archive footage', group: 'topics' },
  { id: 'electronic-music', label: 'Electronic Music', group: 'topics' }, { id: 'automotive', label: 'Automotive', group: 'topics' },
  { id: 'wine', label: 'Wine', group: 'topics' }, { id: 'free-on-youtube', label: 'Free on YouTube', group: 'topics' },
] as const;
export const PICK_TAGS = TAGS.filter(t => t.group === 'picks');
export const TOPIC_TAGS = TAGS.filter(t => t.group === 'topics');
const CARD_LIMIT = 2;
export const tagLabel = (id: string) => TAGS.find(t => t.id === id)?.label;
export const knownTags = (tags: string[] = []) => tags.filter(tagLabel);
const rank = (id: string) => id === 'editors-choice' ? 0 : PICK_TAGS.some(t => t.id === id) ? 1 : 2;
// Editor's Choice leads, then other Picks, then CSV order.
export const orderedTags = (tags: string[] = []) => knownTags(tags).sort((a, b) => rank(a) - rank(b));
export const cardTags = (tags: string[] = []) => orderedTags(tags).slice(0, CARD_LIMIT);
