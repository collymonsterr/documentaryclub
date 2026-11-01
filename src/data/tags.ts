// The only tags the site shows; the sync rejects anything else in the CSV.
export const TAGS = [
  { id: 'automotive', label: 'Automotive' }, { id: 'wine', label: 'Wine' }, { id: 'food-and-drink', label: 'Food & Drink' },
  { id: 'gaming', label: 'Gaming' }, { id: 'climbing', label: 'Climbing' }, { id: 'ocean', label: 'Ocean' },
  { id: 'electronic-music', label: 'Electronic Music' }, { id: 'free-on-youtube', label: 'Free on YouTube' }, { id: 'editors-choice', label: "Editor's Choice" },
] as const;
const CARD_LIMIT = 2;
export const tagLabel = (id: string) => TAGS.find(t => t.id === id)?.label;
export const knownTags = (tags: string[] = []) => tags.filter(tagLabel);
// Editor's Choice leads, then CSV order.
export const orderedTags = (tags: string[] = []) => { const known = knownTags(tags); return [...known.filter(t => t === 'editors-choice'), ...known.filter(t => t !== 'editors-choice')]; };
export const cardTags = (tags: string[] = []) => orderedTags(tags).slice(0, CARD_LIMIT);
