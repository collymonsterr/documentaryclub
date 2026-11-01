// "strange" is legacy (pre-sheet sources only); the sheet assigns every title one of CATEGORIES.
// One home category per title. IDs are stable URL keys (survival = Adventure, arts = Art, life = Life Stories).
export type Category = "strange" | "psychology" | "scams" | "tech" | "crime" | "politics" | "war" | "survival" | "sport"
  | "nature" | "science" | "economics" | "arts" | "music" | "life" | "drugs" | "sex" | "food";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "psychology", label: "Cults & Psychology" },
  { id: "scams", label: "Scams" },
  { id: "tech", label: "Tech" },
  { id: "crime", label: "Crime" },
  { id: "politics", label: "Politics" },
  { id: "war", label: "War" },
  { id: "survival", label: "Adventure" },
  { id: "sport", label: "Sport" },
  { id: "nature", label: "Nature" },
  { id: "food", label: "Food" },
  { id: "science", label: "Science" },
  { id: "economics", label: "Economics" },
  { id: "arts", label: "Art" },
  { id: "music", label: "Music" },
  { id: "life", label: "Life Stories" },
  { id: "drugs", label: "Drugs" },
  { id: "sex", label: "Sex" },
];

export type Film = {
  id: string;
  title: string;
  year: number;
  director: string;
  minutes?: number;
  genre: string;
  categories: Category[];
  synopsis: string;
  awards: string[];
  hue: number; // poster art tint
  trailerUrl?: string; // only set when a verified official URL exists
  mediaType?: "movie" | "tv" | "collection"; // defaults to movie
  yearEnd?: number; // collections/series spanning years
  parts?: string[]; // verified collection installments
  aliases?: string[];
  tmdbId?: number;
  imdbId?: string;
  episodes?: number;
  pending?: boolean; // approved but identity unverified
  tags?: string[]; // free-text sheet tags, e.g. food-and-drink
  presenter?: string; // on-screen presenter, alongside (never replacing) verified directors
};

// Awards listed only where confidently documented. Empty = none claimed.
export const FILMS: Film[] = [
  { id: "beyond-utopia", title: "Beyond Utopia", year: 2023, director: "Madeleine Gavin", minutes: 115, genre: "Escape thriller", categories: ["politics"], synopsis: "A family's desperate, covert flight out of North Korea through China and Southeast Asia, guided by a pastor's underground network.", awards: ["Sundance 2023 — Audience Award, U.S. Documentary"], hue: 20 },
  { id: "fire-of-love", title: "Fire of Love", year: 2022, director: "Sara Dosa", minutes: 93, genre: "Science romance", categories: ["nature"], synopsis: "Volcanologists Katia and Maurice Krafft loved each other and volcanoes — and filmed both, right up to the edge.", awards: ["Oscar nominee — Best Documentary Feature", "Sundance 2022 — Jonathan Oppenheim Editing Award"], hue: 35 },
  { id: "ibelin", title: "The Remarkable Life of Ibelin", year: 2024, director: "Benjamin Ree", minutes: 104, genre: "Hidden life", categories: ["tech"], synopsis: "After Mats Steen's death, his parents discover the vast, loving life he lived inside World of Warcraft.", awards: ["Sundance 2024 — World Cinema Documentary Directing Award", "Sundance 2024 — World Cinema Documentary Audience Award"], hue: 260 },
  { id: "skywalkers", title: "Skywalkers: A Love Story", year: 2024, director: "Jeff Zimbalist", minutes: 100, genre: "Adventure", categories: ["survival"], synopsis: "Two Russian rooftoppers attempt an illegal climb to the summit of a Malaysian megatower — and a test of their relationship.", awards: [], hue: 210 },
  { id: "mariupol", title: "20 Days in Mariupol", year: 2023, director: "Mstyslav Chernov", minutes: 95, genre: "War reportage", categories: ["politics"], synopsis: "AP journalists trapped in the besieged Ukrainian city document atrocities as the world's last reporters there.", awards: ["Oscar winner — Best Documentary Feature", "BAFTA winner — Best Documentary", "Sundance 2023 — World Cinema Documentary Audience Award"], hue: 0 },
  { id: "eternal-memory", title: "The Eternal Memory", year: 2023, director: "Maite Alberdi", minutes: 85, genre: "Intimate portrait", categories: ["psychology"], synopsis: "A Chilean couple face his Alzheimer's together, holding on to a shared past built through dictatorship and love.", awards: ["Oscar nominee — Best Documentary Feature", "Sundance 2023 — World Cinema Documentary Grand Jury Prize"], hue: 45 },
  { id: "territory", title: "The Territory", year: 2022, director: "Alex Pritz", minutes: 86, genre: "Frontline", categories: ["politics"], synopsis: "The Uru-eu-wau-wau people defend their Amazon rainforest from settlers and farmers — filming the fight themselves.", awards: ["Sundance 2022 — World Cinema Documentary Audience Award", "Sundance 2022 — Special Jury Award for Documentary Craft"], hue: 130 },
  { id: "daughters", title: "Daughters", year: 2024, director: "Angela Patton, Natalie Rae", minutes: 107, genre: "Family", categories: ["psychology"], synopsis: "Four girls prepare for a daddy-daughter dance with their incarcerated fathers inside a Washington, D.C. jail.", awards: ["Sundance 2024 — U.S. Documentary Audience Award"], hue: 330 },
  { id: "sugarcane", title: "Sugarcane", year: 2024, director: "Julian Brave NoiseCat, Emily Kassie", minutes: 107, genre: "Investigation", categories: ["crime"], synopsis: "An investigation into abuse and missing children at a Canadian Indian residential school ignites a reckoning.", awards: ["Oscar nominee — Best Documentary Feature", "Sundance 2024 — U.S. Documentary Directing Award"], hue: 25 },
  { id: "four-daughters", title: "Four Daughters", year: 2023, director: "Kaouther Ben Hania", minutes: 107, genre: "Hybrid", categories: ["psychology"], synopsis: "A Tunisian mother's two eldest daughters vanished; actors help her and her younger girls re-stage what happened.", awards: ["Oscar nominee — Best Documentary Feature", "Cannes 2023 — L'Œil d'or (shared)"], hue: 15 },
  { id: "pez-outlaw", title: "The Pez Outlaw", year: 2022, director: "Amy Storkel, Bryan Storkel", minutes: 81, genre: "Caper", categories: ["strange"], synopsis: "A Michigan man smuggles rare Pez dispensers from Eastern Europe and goes to war with the candy company.", awards: [], hue: 300 },
  { id: "perfect-neighbor", title: "The Perfect Neighbor", year: 2025, director: "Geeta Gandbhir", minutes: 97, genre: "True crime", categories: ["crime"], synopsis: "Told through police bodycam footage, a Florida neighbourhood dispute escalates into a fatal shooting.", awards: ["Sundance 2025 — U.S. Documentary Directing Award"], hue: 220 },
  { id: "contestant", title: "The Contestant", year: 2023, director: "Clair Titley", minutes: 90, genre: "Bizarre experiment", categories: ["strange"], synopsis: "A Japanese comedian spends over a year naked and alone, living on sweepstakes prizes — unaware it's broadcast.", awards: [], hue: 50 },
  { id: "mission", title: "The Mission", year: 2023, director: "Amanda McBaine, Jesse Moss", minutes: 103, genre: "Expedition", categories: ["survival"], synopsis: "Why young missionary John Allen Chau tried to reach North Sentinel Island — and what his zeal cost.", awards: [], hue: 180 },
  { id: "greatest-night", title: "The Greatest Night in Pop", year: 2024, director: "Bao Nguyen", minutes: 97, genre: "Music history", categories: ["music"], synopsis: "One night in 1985, pop's biggest stars crammed into a studio to record \u201cWe Are the World.\u201d", awards: [], hue: 280 },
  { id: "whakaari", title: "The Volcano: Rescue from Whakaari", year: 2022, director: "Rory Kennedy", minutes: 104, genre: "Disaster", categories: ["survival"], synopsis: "Tourists, guides and pilots recount the 2019 eruption on New Zealand's White Island and the rescue that followed.", awards: [], hue: 10 },
  { id: "fantastic-fungi", title: "Fantastic Fungi", year: 2019, director: "Louie Schwartzberg", minutes: 81, genre: "Nature", categories: ["nature"], synopsis: "Time-lapse wonder into the hidden fungal networks beneath our feet. An older pick, included as an exception.", awards: [], hue: 90 },
];

export const trailerLink = (f: Film) =>
  f.trailerUrl ??
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${f.title} ${f.year} official trailer`)}`;

export const justWatchLink = (f: Film, country: string) =>
  `https://www.justwatch.com/${country === 'GB' ? 'uk' : country.toLowerCase()}/search?q=${encodeURIComponent(f.title)}`;
