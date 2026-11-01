// Who gave an award decides its icon and prestige; list order is prestige order.
export const AWARD_BODIES = [
  { id: 'oscar', name: 'Academy Awards', color: '#f4c430', match: /^Oscar\b|Academy Award/ },
  { id: 'bafta', name: 'BAFTA', color: '#f2f0e6', match: /^BAFTA\b/ },
  { id: 'emmy', name: 'Emmy', color: '#b794f6', match: /\bEmmy\b/ },
  { id: 'cannes', name: 'Cannes', color: '#4ade80', match: /^Cannes\b/ },
  { id: 'sundance', name: 'Sundance', color: '#fb923c', match: /^Sundance\b/ },
  { id: 'tribeca', name: 'Tribeca', color: '#38bdf8', match: /^Tribeca\b/ },
  { id: 'ida', name: 'IDA', color: '#2dd4bf', match: /^IDA\b/ },
  { id: 'other', name: 'Award', color: '#a8a29e', match: /$^/ },
] as const;
export type AwardBody = (typeof AWARD_BODIES)[number]['id'];
export const awardBody = (label: string): AwardBody => AWARD_BODIES.find(b => b.match.test(label))?.id ?? 'other';
export const awardRank = (id: AwardBody) => AWARD_BODIES.findIndex(b => b.id === id);
export const awardColor = (id: AwardBody) => AWARD_BODIES[awardRank(id)]!.color;
