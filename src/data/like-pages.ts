// "Documentaries like X" pages for the best-known titles. The list is documentariesLike in discovery-facets;
// add puts hand-picked titles first, drop removes matches that share a tag but not the feeling. Intros are hand-written.
export const LIKE_PAGES: Record<string, { intro: string; add?: string[]; drop?: string[] }> = {
  'tiger-king': {
    intro: "Tiger King worked because every new person was stranger than the last. These have the same energy - real people, unbelievable choices, and a story that keeps getting weirder. Start with Tickled.",
    add: ['tickled', 'wild-wild-country', 'pez-outlaw', 'abducted-in-plain-sight', 'mcmillions', 'bad-vegan', 'grizzly-man', 'american-movie', 'fyre', 'the-imposter', 'evil-genius', 'the-king-of-kong'],
  },
  'making-a-murderer': {
    intro: "If Making a Murderer left you shouting at the TV, these will too. Disputed verdicts, bad investigations and the long fight to undo them. The Thin Blue Line is where it all started.",
  },
  'the-tinder-swindler': {
    intro: "Con artists who were brilliant at one thing - getting people to trust them. These are the best scam documentaries if you liked The Tinder Swindler. Sour Grapes and Tickled are the two to start with.",
  },
  'fyre': {
    intro: "Fyre is a story about confidence, money and nobody saying no. These have the same mix of ambition and disaster. The Inventor and WeWork are the obvious next watches.",
  },
  'wild-wild-country': {
    intro: "Wild Wild Country is the gold standard for cult documentaries, and these come closest. Leaders, followers and what happens when it all falls apart. Going Clear is the one to watch next.",
  },
  'the-jinx': {
    intro: "The Jinx is true crime at its most gripping, with an ending nobody saw coming. These are the ones that hold you the same way. Go into The Imposter and Dear Zachary knowing as little as possible.",
    add: ['the-imposter', 'dear-zachary', 'capturing-the-friedmans', 'the-staircase', 'making-a-murderer'],
  },
  'don-t-f-k-with-cats': {
    intro: "Don't F**k with Cats is internet sleuths doing what the police couldn't. These have the same pull - an investigation you can't stop watching. The Jinx and The Imposter are the closest.",
    add: ['the-jinx', 'the-imposter', 'catfish', 'the-most-hated-man-on-the-internet'],
  },
  'the-social-dilemma': {
    intro: "If The Social Dilemma changed how you use your phone, these go further. Data, algorithms and the people who built the internet we're stuck with. The Great Hack is the obvious next one.",
  },
  'free-solo': {
    intro: "Nothing is quite like Free Solo, but these get close. Climbers, mountains and how far people will go. The Dawn Wall and Touching the Void are the two to watch next.",
  },
  'icarus': {
    intro: "Icarus starts as a cycling experiment and ends up exposing a state doping programme. These have the same feeling of a story getting much bigger than anyone planned. Citizenfour is the closest.",
    add: ['citizenfour', 'the-imposter', 'the-internet-s-own-boy', 'the-most-dangerous-man-in-america'],
  },
  'blackfish': {
    intro: "Blackfish changed how people see animals in captivity. These are the films that do the same for the oceans and the wild. The Cove is the one to watch next.",
    add: ['the-cove', 'project-nim', 'grizzly-man', 'food-inc'],
  },
  'my-octopus-teacher': {
    intro: "My Octopus Teacher is gentle, strange and beautiful, and so are these. Nature documentaries about connection as much as wildlife. Fantastic Fungi and Jane are good next picks.",
  },
  'planet-earth-ii': {
    intro: "If you've watched Planet Earth II and want more, these are the ones that come closest. Watch them on the biggest screen you have. Blue Planet II and Our Planet are the obvious next steps.",
  },
  'the-last-dance': {
    intro: "The Last Dance is a sport documentary for people who don't watch sport, and so are these. Rivalries, obsession and what winning costs. Hoop Dreams and Senna are the two to start with.",
  },
  'formula-1-drive-to-survive': {
    intro: "Drive to Survive got a whole new audience into Formula 1. These are the motorsport documentaries to watch next. Senna is the best of them, and one of the best documentaries ever made.",
  },
  'searching-for-sugar-man': {
    intro: "Searching for Sugar Man is about a musician the world forgot, and it's one of the great feel-good documentaries. These have the same warmth. 20 Feet from Stardom and Anvil are the closest.",
    add: ['20-feet-from-stardom', 'anvil-the-story-of-anvil', 'summer-of-soul', 'greatest-night', 'buena-vista-social-club', 'marley', 'dig', 'metallica-some-kind-of-monster', 'man-on-wire', 'three-identical-strangers'],
    drop: ['808', 'pump-up-the-volume-a-history-of-house-music', 'god-said-give-em-drum-machines', 'desire-the-carl-craig-story'],
  },
  'amy': {
    intro: "Amy tells Amy Winehouse's story through footage, and it's heartbreaking. These music documentaries are made the same way. Cobain: Montage of Heck is the obvious next watch.",
  },
  'three-identical-strangers': {
    intro: "Three Identical Strangers starts as a feel-good story and turns into something else. These have the same kind of turn, so go in knowing as little as possible. The Imposter is the closest.",
    add: ['the-imposter', 'capturing-the-friedmans', 'dear-zachary', 'stories-we-tell', 'project-nim', 'catfish', 'tickled', 'searching-for-sugar-man', 'abducted-in-plain-sight', 'the-jinx'],
    drop: ['apollo-11', 'cosmos-a-spacetime-odyssey', 'the-farthest', 'for-all-mankind', 'in-the-shadow-of-the-moon', 'particle-fever', 'a-brief-history-of-time'],
  },
  'the-imposter': {
    intro: "The Imposter is one of the most twisted true stories ever filmed. These have the same feeling that nothing is what it seems. Go into each one knowing as little as possible.",
    add: ['three-identical-strangers', 'capturing-the-friedmans', 'dear-zachary', 'the-jinx', 'catfish', 'tickled', 'stories-we-tell'],
  },
  'american-murder-the-family-next-door': {
    intro: "American Murder is told through the family's own videos, texts and police footage, and it's hard to shake. These true crime documentaries hit just as hard. Dear Zachary is the one to watch next.",
  },
  'going-clear': {
    intro: "Going Clear is the definitive Scientology documentary. These are the best films about cults and the people who leave them. Wild Wild Country is the obvious next watch.",
  },
  'dear-zachary': {
    intro: "Nothing prepares you for Dear Zachary, and nothing quite matches it. These are the true stories that hit closest. Capturing the Friedmans is the one to watch next.",
  },
  'jiro-dreams-of-sushi': {
    intro: "Jiro Dreams of Sushi is about obsession as much as food. These are the food and drink documentaries with the same devotion. Chef's Table is the obvious next step.",
  },
  'inside-job': {
    intro: "Inside Job explains the 2008 crash better than anything else. These are the documentaries about money, power and who pays for it. Roger & Me is the one to watch next.",
  },
  'senna': {
    intro: "Senna is one of the best sport documentaries ever made, and it's told entirely through archive footage. These are the motorsport documentaries to watch next. TT3D: Closer to the Edge is the most intense.",
  },
};
