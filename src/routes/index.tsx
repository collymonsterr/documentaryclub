import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Check,
  Grid2X2,
  Maximize2,
  ExternalLink,
  Shuffle,
  Award,
  SlidersHorizontal,
  Link2,
  EyeOff,
  Search,
  Dices,
  X,
} from "lucide-react";
import { CATEGORIES, justWatchLink, type Category } from "@/data/films";
import { CATALOGUE, SNAPSHOT, searchCatalogue } from "@/data/catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AWARDS,
  MOODS,
  EDITORIAL,
  accolades,
  matchesFacets,
  makerIndex,
  formatCommitment,
} from "@/data/discovery-facets";
import { AwardLaurel } from "@/components/award-laurel";
import { AwardBadges } from "@/components/award-badges";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DocumentaryPoster } from "@/components/documentary-poster";
import { ScrollRow } from "@/components/scroll-row";
import { SiteLogo } from "@/components/site-logo";
import { TrailerModal } from "@/components/trailer-modal";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { usePreference, useTracking } from "@/hooks/use-tracking";
import {
  gallerySelection,
  canNavigate,
  cardBadges,
  inEra,
  inLength,
  orderFilms,
  shuffleIds,
  sortByRating,
  overviewSentences,
  TRACKING_KEYS,
  type Era,
  type Length,
  type Provider,
  type Enrichment,
} from "@/lib/discovery";
import { getIrishProviders } from "@/lib/tmdb.functions";
const PAGE = 36;
const kind = (m?: string) => (m === "tv" ? "Series" : m === "collection" ? "Film series" : "Film");
const years = (f: { year: number; yearEnd?: number }) => (f.yearEnd ? `${f.year}–${f.yearEnd}` : String(f.year));
const ERAS: [Era, string][] = [
  ["all", "All eras"],
  ["recent", "Recent"],
  ["2020s", "2020s"],
  ["2010s", "2010s"],
  ["2000s", "2000s"],
  ["pre2000", "Pre-2000"],
];
const LENGTHS: [Length, string][] = [
  ["all", "Any length"],
  ["short", "Under 90 min"],
  ["standard", "90–120 min"],
  ["long", "Over 2 hours"],
  ["series", "Series & multi-part"],
];

// Shareable state lives in the URL: ?film= opens Spotlight, ?list=shortlist|watched, ?q= search, plus cat/era/len/type/sort filters.
const searchDefaults = {
  film: "",
  q: "",
  list: "",
  cat: "all",
  era: "all",
  len: "all",
  type: "all",
  sort: "random",
  award: "",
  mood: "",
  pick: "",
  maker: "",
  browse: "topics",
};
const text = (value: unknown, fallback = "") => (typeof value === "string" && value ? value : fallback);
const SORTS = ["random", "curated", "newest", "oldest", "imdb", "rt"];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    film: text(search["film"]),
    q: text(search["q"]),
    list: text(search["list"]),
    cat: text(search["cat"], "all"),
    era: text(search["era"], "all"),
    len: text(search["len"], "all"),
    type: text(search["type"], "all"),
    sort: text(search["sort"], "random"),
    award: text(search["award"]),
    mood: text(search["mood"]),
    pick: text(search["pick"]),
    maker: text(search["maker"]),
    browse: text(search["browse"], "topics"),
  }),
  search: { middlewares: [stripSearchParams(searchDefaults)] },
  head: () => ({
    meta: [
      { title: "Documentary Club — Discover extraordinary true stories" },
      {
        name: "description",
        content: `Explore ${CATALOGUE.length} curated documentary films and series, documented festival awards, official trailers and streaming availability in Ireland.`,
      },
      { property: "og:title", content: "Documentary Club — Extraordinary true stories" },
      {
        property: "og:description",
        content:
          "Discover curated documentaries in Spotlight or Gallery, save your favourites and find Irish streaming options.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
type Filter = "all" | Category | "awards";
const NOTES: Record<string, string> = {
  "beyond-utopia":
    "The escape unfolds through an underground network, with the family’s safety at stake at every border.",
  "fire-of-love": "Their extraordinary archive brings a shared life of scientific discovery into view.",
  ibelin: "His online friendships reveal a side of their son they never knew.",
  skywalkers: "Trust becomes as precarious as the climb itself.",
  mariupol: "Their footage preserves a firsthand record of the siege.",
  "eternal-memory": "Their daily routines become an intimate portrait of love and memory.",
  territory: "Indigenous voices and cameras shape this account of resistance.",
  daughters: "The preparations reveal the emotional distance between prison and home.",
  sugarcane: "Survivors and families confront the enduring consequences of the residential school system.",
  "four-daughters": "Reenactment becomes a way to explore grief, memory and family bonds.",
  "pez-outlaw": "A colourful collecting obsession turns into an unlikely international caper.",
  "perfect-neighbor": "The recordings reveal how everyday tensions can become deadly.",
  contestant: "The experiment raises unsettling questions about entertainment and consent.",
  mission: "The film examines the beliefs behind his fatal expedition.",
  "greatest-night": "The film revisits the collaboration behind the charity single.",
  whakaari: "Survivor accounts place human choices at the centre of the disaster.",
  "fantastic-fungi": "The film explores the relationship between fungi, forests and people.",
};
// Watch in Ireland as one row: subscription first, else rent/buy, else a discreet JustWatch link. Missing data = unknown.
function WatchStrip({
  loading,
  providers,
  fallback,
}: {
  loading: boolean;
  providers?: Enrichment["providers"] | undefined;
  fallback: string;
}) {
  const names = (items: Provider[]) => items.map((p) => p.name).join(", ");
  const rentBuy = [...new Map([...(providers?.rent ?? []), ...(providers?.buy ?? [])].map((p) => [p.id, p])).values()];
  const href = providers?.link ?? fallback;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
      <span className="font-semibold">Ireland</span>
      {loading ? (
        <span className="text-muted-foreground" role="status">
          Checking…
        </span>
      ) : providers?.flatrate.length ? (
        <span className="rounded-full bg-primary/15 px-2.5 py-1 font-medium text-primary">
          ▶ Stream on {names(providers.flatrate)}
        </span>
      ) : rentBuy.length ? (
        <span className="rounded-full border border-border px-2.5 py-1">Rent / buy: {names(rentBuy)}</span>
      ) : (
        <span className="text-muted-foreground">Availability unknown</span>
      )}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        {providers?.link ? "All options" : "JustWatch IE"}
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}
// IMDb / RT pills open the source directly in a new tab (their pages block embedding).
function RatingPill({
  site,
  film,
  score,
}: {
  site: "imdb" | "rt";
  film: { title: string; imdbId?: string | undefined };
  score?: number | undefined;
}) {
  const imdb = site === "imdb";
  if (score === undefined || (imdb && !film.imdbId)) return null;
  const href = imdb
    ? `https://www.imdb.com/title/${film.imdbId}/`
    : `https://www.rottentomatoes.com/search?search=${encodeURIComponent(film.title)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${imdb ? "IMDb" : "Rotten Tomatoes"} ${imdb ? score.toFixed(1) : `${score}%`} — open in new tab`}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium hover:border-primary"
    >
      {imdb ? (
        <span className="rounded-sm bg-primary px-1 text-[10px] font-bold text-primary-foreground">IMDb</span>
      ) : (
        <span className="text-[10px] font-bold text-destructive">RT</span>
      )}
      {imdb ? score.toFixed(1) : `${score}%`}
      <ExternalLink className="size-3 opacity-60" />
    </a>
  );
}
// Free, legal viewing searches only (no piracy sources).
function FreeLegal({ film }: { film: { title: string; year: number } }) {
  const q = encodeURIComponent(film.title);
  const links = [
    [
      "YouTube (full length)",
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${film.title} ${film.year} full documentary`)}`,
    ],
    ["Internet Archive", `https://archive.org/search?query=${q}&and%5B%5D=mediatype%3A%22movies%22`],
    ["Kanopy (library card)", `https://www.kanopy.com/en/search?query=${q}`],
    // Placeholder address — replace with the real Download site search URL.
    ["Download", `https://thepiratebay.com/search?q=${q}`],
  ] as const;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Search />
          Find it free
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <p className="mb-1 text-xs text-muted-foreground">Free, legal sources — results not verified.</p>
        {links.map(([label, href]) => (
          <Button key={label} asChild variant="link" size="sm" className="h-auto w-full justify-start px-0 py-1">
            <a href={href} target="_blank" rel="noreferrer">
              {label}
              <ExternalLink />
            </a>
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
function Index() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const view = search.film ? "spotlight" : "gallery";
  const listFilter = search.list === "shortlist" || search.list === "watched" ? search.list : "";
  const [order, setOrder] = useState<string[] | null>(null);
  useEffect(() => {
    setOrder(shuffleIds(CATALOGUE.map((f) => f.id)));
  }, []);
  // Return anchor: clicked/visible card ID plus its viewport offset, restored after layout (no timers).
  const anchor = useRef<{ id: string; offset: number } | null>(null);
  const restore = useRef(false);
  const saveAnchor = (id?: string) => {
    const cards = [...document.querySelectorAll<HTMLElement>("[data-film-card]")];
    const el =
      (id && cards.find((c) => c.dataset["filmCard"] === id)) ||
      cards.find((c) => c.getBoundingClientRect().bottom > 0);
    anchor.current = el ? { id: el.dataset["filmCard"] ?? "", offset: el.getBoundingClientRect().top } : null;
  };
  const setFilm = (id: string) => navigate({ search: (prev) => ({ ...prev, film: id }) });
  const openSpotlight = (id?: string, anchorId?: string) => {
    if (view === "gallery") saveAnchor(anchorId ?? id);
    const target = id ?? (search.film || list[0]?.id);
    if (target) setFilm(target);
  };
  const backToGallery = () => {
    if (view === "gallery") return;
    restore.current = true;
    navigate({ search: (prev) => ({ ...prev, film: "" }) });
  };
  useLayoutEffect(() => {
    if (view === "spotlight") {
      document.getElementById("spotlight-top")?.scrollIntoView({ block: "start" });
      return;
    }
    if (!restore.current) return;
    restore.current = false;
    const apply = () => {
      const a = anchor.current;
      const el = a && document.querySelector<HTMLElement>(`[data-film-card="${CSS.escape(a.id)}"]`);
      if (el && a) window.scrollBy(0, el.getBoundingClientRect().top - a.offset);
      else window.scrollTo(0, 0);
    };
    apply();
    const r = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(r);
  }, [view]);
  // Filters live in the URL so refresh/bookmarks restore the same view.
  const facet = {
    award: AWARDS.some((a) => a.id === search.award) ? search.award : "",
    mood: MOODS.some((m) => m.id === search.mood) ? search.mood : "",
    pick: "",
    maker: makerIndex().some((m) => m.name === search.maker) ? search.maker : "",
  };
  const browse = ["topics", "awards", "directors", "moods"].includes(search.browse) ? search.browse : "topics";
  const filterIds = new Set<string>(["all", "awards", ...CATEGORIES.map((c) => c.id)]);
  const filter = (filterIds.has(search.cat) ? search.cat : "all") as Filter;
  const era = (ERAS.some(([id]) => id === search.era) ? search.era : "all") as Era;
  const len = (LENGTHS.some(([id]) => id === search.len) ? search.len : "all") as Length;
  const type = (["movie", "tv"].includes(search.type) ? search.type : "all") as "all" | "movie" | "tv";
  const sort = SORTS.includes(search.sort) ? search.sort : "random";
  const setParam = (patch: Partial<typeof searchDefaults>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const setDiscovery = (patch: Partial<typeof searchDefaults>) => {
    restore.current = false;
    navigate({ search: (prev) => gallerySelection(prev, patch), replace: true });
  };
  const setFilter = (cat: Filter) => setDiscovery({ cat });
  const setEra = (e: Era) => setParam({ era: e });
  const setType = (t: string) => setParam({ type: t });
  const setSort = (s: string) => setParam({ sort: s });
  const reshuffle = () => {
    setOrder(shuffleIds(CATALOGUE.map((f) => f.id)));
    setSort("random");
    setShown(PAGE);
    window.scrollTo(0, 0);
  };
  const [query, setQuery] = useState(search.q);
  useEffect(() => {
    setQuery(search.q);
  }, [search.q]);
  const updateQuery = (value: string) => {
    setQuery(value);
    navigate({ search: (prev) => ({ ...prev, q: value, film: "" }), replace: true });
  };
  const [shown, setShown] = useState(PAGE);
  const [shortlist, toggleShort, shortOps] = useTracking(TRACKING_KEYS.shortlist);
  const [watched, toggleWatchedRaw] = useTracking(TRACKING_KEYS.watched);
  // Marking watched clears Saved (one direction only).
  const toggleWatched = (id: string) => {
    if (!watched.has(id)) shortOps.remove(id);
    toggleWatchedRaw(id);
  };
  const [hideWatched, setHideWatched] = usePreference("dc-hide-watched", true);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fetchProviders = useServerFn(getIrishProviders);
  const list = useMemo(() => {
    const base =
      listFilter === "shortlist"
        ? CATALOGUE.filter((f) => shortlist.has(f.id))
        : listFilter === "watched"
          ? CATALOGUE.filter((f) => watched.has(f.id))
          : hideWatched
            ? CATALOGUE.filter((f) => !watched.has(f.id))
            : CATALOGUE;
    const filtered = searchCatalogue(sort === "random" ? orderFilms(base, order) : base, query, type)
      .filter((f) => inEra(f.year, era) && inLength(f, SNAPSHOT[f.id]?.runtime ?? f.minutes, len))
      .filter((f) =>
        filter === "all" ? true : filter === "awards" ? accolades(f).length > 0 : f.categories.includes(filter),
      )
      .filter((f) => matchesFacets(f, facet));
    if (sort === "imdb" || sort === "rt")
      return sortByRating(filtered, SNAPSHOT, sort === "imdb" ? "imdb" : "rottenTomatoes");
    if (sort === "newest") return [...filtered].sort((a, b) => b.year - a.year);
    if (sort === "oldest") return [...filtered].sort((a, b) => a.year - b.year);
    return filtered;
  }, [
    filter,
    listFilter,
    shortlist,
    watched,
    hideWatched,
    sort,
    query,
    type,
    era,
    len,
    order,
    facet.award,
    facet.mood,
    facet.pick,
    facet.maker,
  ]);
  useEffect(() => {
    setShown(PAGE);
  }, [filter, listFilter, query, type, sort, era, len, hideWatched, facet.award, facet.mood, facet.pick, facet.maker]);
  // A shared link may name a film outside the current filters; show it anyway.
  const topDirectors = useMemo(() => makerIndex().filter((m) => m.films.length >= 3), []);
  const film = list.find((f) => f.id === search.film) ?? CATALOGUE.find((f) => f.id === search.film) ?? list[0];
  const idx = list.findIndex((f) => f.id === film?.id);
  // Baseline metadata ships in the snapshot; only Irish availability is fetched live, for the selected title.
  const providers = useQuery({
    queryKey: ["ie-providers", film?.id],
    queryFn: () => fetchProviders({ data: { id: film?.id ?? "" } }),
    enabled: view === "spotlight" && Boolean(film?.tmdbId) && film?.mediaType !== "collection",
    staleTime: 6 * 60 * 60_000,
    retry: false,
  });
  const snap = film ? SNAPSHOT[film.id] : undefined;
  const extra = snap ? { ...snap, rating: snap.tmdbRating, providers: providers.data } : undefined;
  const go = useCallback(
    (direction: number) => {
      if (!list.length) return;
      const next = list[(Math.max(idx, 0) + direction + list.length) % list.length];
      if (next) setFilm(next.id);
    },
    [list, idx],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPhoto(null);
    setCopied(false);
  }, [film?.id]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (view !== "spotlight" || !canNavigate(e.target, trailerOpen) || document.querySelector('[role="dialog"]'))
        return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        go(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [go, view, trailerOpen]);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const share = async () => {
    if (!film) return;
    const url = `${window.location.origin}/?film=${film.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };
  const toggleList = (which: "shortlist" | "watched") =>
    navigate({ search: (prev) => ({ ...prev, film: "", list: prev.list === which ? "" : which }) });
  // Director links: open the gallery filtered to everything we have by that filmmaker.
  const searchDirector = (name: string) => {
    setQuery(name);
    navigate({
      search: (prev) => ({
        ...prev,
        film: "",
        q: name,
        list: "",
        cat: "all",
        era: "all",
        len: "all",
        type: "all",
        award: "",
        mood: "",
        pick: "",
        maker: name,
      }),
    });
  };
  const clearFilters = () => {
    setQuery("");
    navigate({
      search: (prev) => ({
        ...prev,
        film: "",
        q: "",
        list: "",
        cat: "all",
        era: "all",
        type: "all",
        sort: "random",
        len: "all",
        award: "",
        mood: "",
        pick: "",
        maker: "",
      }),
      replace: true,
    });
  };
  // Surprise me: random title from the current selection (Saved, filters, search), never the one already open.
  const surprise = () => {
    const pool = list.length > 1 ? list.filter((f) => f.id !== search.film) : list;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) openSpotlight(pick.id);
  };
  const activeFilters = [
    type !== "all",
    sort !== "random",
    era !== "all",
    len !== "all",
    listFilter === "watched",
    !!facet.award,
    !!facet.mood,
    !!facet.pick,
    !!facet.maker,
    filter !== "all",
  ].filter(Boolean).length;
  const filters: { id: Filter; label: string }[] = [{ id: "all", label: "All" }, ...CATEGORIES];
  const filtersControl = (
    <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="filter-trigger" aria-label="More filters">
          <SlidersHorizontal />
          <span className="desktop-label">Filters</span>
          {activeFilters > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="filters-scroll max-h-[70vh] space-y-3 overflow-y-auto">
          <label className="block text-xs text-muted-foreground">
            Category
            <select
              aria-label="Category"
              className="discovery-select mt-1 w-full"
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
            >
              {filters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Award
            <select
              aria-label="Award"
              className="discovery-select mt-1 w-full"
              value={facet.award}
              onChange={(e) => setParam({ award: e.target.value })}
            >
              <option value="">Any award</option>
              {AWARDS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Mood
            <select
              aria-label="Mood"
              className="discovery-select mt-1 w-full"
              value={facet.mood}
              onChange={(e) => setParam({ mood: e.target.value })}
            >
              <option value="">Any mood</option>
              {MOODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Director
            <select
              aria-label="Director"
              className="discovery-select mt-1 w-full"
              value={facet.maker}
              onChange={(e) => setParam({ maker: e.target.value, q: "" })}
            >
              <option value="">Any director</option>
              {makerIndex().map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.films.length})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Type
            <select
              aria-label="Film or series"
              className="discovery-select mt-1 w-full"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">Films & series</option>
              <option value="movie">Films</option>
              <option value="tv">Series</option>
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Order
            <select
              aria-label="Sort order"
              className="discovery-select mt-1 w-full"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="random">Shuffled</option>
              <option value="curated">Curated</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="imdb">Top IMDb</option>
              <option value="rt">Top Rotten Tomatoes</option>
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Era
            <select
              aria-label="Era"
              className="discovery-select mt-1 w-full"
              value={era}
              onChange={(e) => setEra(e.target.value as Era)}
            >
              {ERAS.map(([id, label]) => (
                <option key={id} value={id}>
                  {id === "recent" ? "Recent (last 2 years)" : label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Length
            <select
              aria-label="Length"
              className="discovery-select mt-1 w-full"
              value={len}
              onChange={(e) => setParam({ len: e.target.value })}
            >
              {LENGTHS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={listFilter === "watched" ? "default" : "outline"}
              aria-pressed={listFilter === "watched"}
              onClick={() => toggleList("watched")}
            >
              <Check />
              Watched · {watched.size}
            </Button>
            <Button size="sm" variant="outline" onClick={reshuffle}>
              <Shuffle />
              Shuffle
            </Button>
            <Button
              size="sm"
              variant={hideWatched ? "default" : "outline"}
              aria-pressed={hideWatched}
              onClick={() => setHideWatched(!hideWatched)}
            >
              <EyeOff />
              Hide watched
            </Button>
          </div>
          {activeFilters > 0 && (
            <Button size="sm" variant="ghost" className="w-full" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
  return (
    <main className="discovery-shell mx-auto max-w-6xl px-4 pb-5 sm:px-6">
      <div className="discovery-navigation">
        <header className="contents">
          <h1 className="header-brand min-w-0">
            <SiteLogo />
          </h1>
          <div className={`header-search ${searchOpen ? "is-open" : ""}`}>
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              aria-label="Search title, alias or director"
              type="search"
              placeholder={`Search ${CATALOGUE.length} documentaries`}
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              className="h-9 min-w-0 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              size="icon"
              variant="ghost"
              className="mobile-search-close"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div className="header-tools">
            {filtersControl}
            <Button
              size="sm"
              variant="outline"
              className="surprise-trigger"
              aria-label="Surprise me"
              disabled={!list.length}
              onClick={surprise}
              title="Open a random title from this selection"
            >
              <Dices />
              <span className="desktop-label">Surprise me</span>
            </Button>
          </div>
          <div className="header-views" role="group" aria-label="Browsing view">
            <Button
              size="icon"
              variant="ghost"
              className="mobile-search-toggle"
              aria-label="Open search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search />
            </Button>
            <div className="desktop-view-toggle">
              <Button
                size="icon"
                variant={view === "spotlight" ? "secondary" : "ghost"}
                aria-label="Spotlight"
                title="Spotlight"
                aria-pressed={view === "spotlight"}
                onClick={() => openSpotlight()}
              >
                <Maximize2 />
              </Button>
              <Button
                size="icon"
                variant={view === "gallery" ? "secondary" : "ghost"}
                aria-label="Gallery"
                title="Gallery"
                aria-pressed={view === "gallery"}
                onClick={backToGallery}
              >
                <Grid2X2 />
              </Button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="mobile-view-toggle"
              aria-label={view === "gallery" ? "Switch to Spotlight" : "Switch to Gallery"}
              onClick={() => (view === "gallery" ? openSpotlight() : backToGallery())}
            >
              {view === "gallery" ? <Maximize2 /> : <Grid2X2 />}
            </Button>
          </div>
          <Button
            size="sm"
            variant={listFilter === "shortlist" ? "secondary" : "ghost"}
            className="header-saved"
            aria-label={`Saved · ${shortlist.size}`}
            aria-pressed={listFilter === "shortlist"}
            onClick={() => toggleList("shortlist")}
          >
            <Heart className={listFilter === "shortlist" ? "fill-save text-save" : "text-save"} />
            <span className="desktop-label">Saved</span>
            <span className="text-xs text-muted-foreground">{shortlist.size}</span>
          </Button>
        </header>
        <nav
          aria-label="Browse by"
          className="browse-tabs flex gap-5 overflow-x-auto border-b border-border no-scrollbar"
        >
          {(
            [
              ["topics", "Categories"],
              ["moods", "Moods"],
              ["directors", "Directors"],
              ["awards", "Awards"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant="ghost"
              className="browse-tab"
              aria-pressed={browse === id}
              onClick={() => setParam({ browse: id })}
            >
              {label}
            </Button>
          ))}
        </nav>
        <ScrollRow label="Discovery options" className="discovery-chips">
          {browse === "topics" ? (
            filters.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={filter === f.id ? "default" : "ghost"}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Button>
            ))
          ) : browse === "directors" ? (
            <>
              <Button
                size="sm"
                variant={!facet.maker ? "default" : "ghost"}
                onClick={() => setDiscovery({ maker: "" })}
              >
                All
              </Button>
              {topDirectors.map((m) => (
                <Button
                  key={m.name}
                  size="sm"
                  variant={facet.maker === m.name ? "default" : "ghost"}
                  aria-pressed={facet.maker === m.name}
                  onClick={() => setDiscovery({ maker: facet.maker === m.name ? "" : m.name, q: "" })}
                >
                  {m.name} <span className="text-xs opacity-70">{m.films.length}</span>
                </Button>
              ))}
              <Button asChild size="sm" variant="link">
                <Link to="/makers">
                  All directors
                  <ArrowRight />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant={!facet[browse === "awards" ? "award" : "mood"] ? "default" : "ghost"}
                onClick={() => setDiscovery({ [browse === "awards" ? "award" : "mood"]: "" })}
              >
                All
              </Button>
              {(browse === "awards" ? AWARDS : MOODS).map((f) => {
                const key = browse === "awards" ? "award" : "mood";
                return (
                  <Button
                    key={f.id}
                    size="sm"
                    variant={facet[key] === f.id ? "default" : "ghost"}
                    aria-pressed={facet[key] === f.id}
                    onClick={() => setDiscovery({ [key]: facet[key] === f.id ? "" : f.id })}
                  >
                    {f.label}
                  </Button>
                );
              })}
            </>
          )}
        </ScrollRow>
      </div>
      {(query || activeFilters > 0 || listFilter) && (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{list.length} titles</span>
          <span>·</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      )}
      {(facet.award || facet.mood || facet.pick || facet.maker || filter !== "all") && (
        <div className="mb-3 flex flex-wrap gap-1" aria-label="Active discovery filters">
          {[
            ...(filter !== "all" ? [{ key: "cat", label: filters.find((f) => f.id === filter)?.label ?? filter }] : []),
            ...(facet.award ? [{ key: "award", label: AWARDS.find((a) => a.id === facet.award)?.label }] : []),
            ...(facet.mood ? [{ key: "mood", label: MOODS.find((m) => m.id === facet.mood)?.label }] : []),
            ...(facet.maker ? [{ key: "maker", label: facet.maker }] : []),
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant="secondary"
              onClick={() => setParam({ [f.key]: f.key === "cat" ? "all" : "" })}
              aria-label={`Remove ${f.label} filter`}
            >
              {f.label} ×
            </Button>
          ))}
        </div>
      )}
      {listFilter && (
        <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {listFilter === "shortlist" ? "Your saved films" : "Watched"}
          </span>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => toggleList(listFilter)}>
            Show everything
          </Button>
        </p>
      )}
      {!film ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No films in this selection.</p>
          <Button variant="ghost" className="mt-3" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : view === "gallery" ? (
        <>
          <section
            aria-label="Film gallery"
            className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {list.slice(0, shown).map((f) => {
              const badges = cardBadges(SNAPSHOT[f.id]);
              return (
                <div key={f.id} data-film-card={f.id} className="film-card min-w-0">
                  <div className="group relative">
                    <Button
                      variant="ghost"
                      aria-label={`Open ${f.title}`}
                      className="h-auto w-full p-0"
                      onClick={() => openSpotlight(f.id)}
                    >
                      <DocumentaryPoster film={f} src={SNAPSHOT[f.id]?.poster} small />
                    </Button>
                    <AwardLaurel film={f} />
                    <div className="card-hover-actions absolute right-2 top-2 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-8"
                        aria-label={`${shortlist.has(f.id) ? "Unsave" : "Save"} ${f.title}`}
                        aria-pressed={shortlist.has(f.id)}
                        onClick={() => toggleShort(f.id)}
                      >
                        <Heart className={shortlist.has(f.id) ? "fill-save text-save" : "text-save"} />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-8"
                        aria-label={`Mark ${f.title} ${watched.has(f.id) ? "unwatched" : "watched"}`}
                        aria-pressed={watched.has(f.id)}
                        onClick={() => toggleWatched(f.id)}
                      >
                        <Check className={watched.has(f.id) ? "text-success" : "text-muted-foreground"} />
                      </Button>
                    </div>
                  </div>
                  <h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-medium leading-5">{f.title}</h2>
                  <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                    {years(f)}
                    {formatCommitment(f) ? ` · ${formatCommitment(f)}` : ""}
                    {f.pending ? " · Pending" : ""}
                  </p>
                  <div className="mt-1 flex min-h-7 items-start justify-between gap-1">
                    <p className="min-w-0 text-[11px] leading-5 text-muted-foreground">{badges.join(" · ")}</p>
                    <div className="flex shrink-0 items-center gap-1" aria-label={`${f.title} status`}>
                      {shortlist.has(f.id) && <Heart className="size-3 fill-save text-save" aria-label="Saved" />}
                      {watched.has(f.id) && <Check className="size-3 text-success" aria-label="Watched" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
          {shown < list.length && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                Show more · {list.length - shown} left
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <section
            id="spotlight-top"
            aria-label="Selected documentary"
            className="spotlight-grid"
            onTouchStart={(e) => {
              if (!canNavigate(e.target, trailerOpen)) return;
              const t = e.touches[0];
              if (t) touch.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              const t = e.changedTouches[0],
                start = touch.current;
              touch.current = null;
              if (
                t &&
                start &&
                !trailerOpen &&
                Math.abs(t.clientX - start.x) > 60 &&
                Math.abs(t.clientX - start.x) > Math.abs(t.clientY - start.y)
              )
                go(t.clientX < start.x ? 1 : -1);
            }}
          >
            <div className="spotlight-poster">
              <DocumentaryPoster film={film} src={extra?.poster} />
            </div>
            <div className="min-w-0">
              <Button size="sm" variant="ghost" className="-ml-2 w-fit" onClick={backToGallery}>
                <ArrowLeft />
                Back to Gallery
              </Button>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-xs font-medium uppercase text-primary">
                  <span className="rounded-sm border border-primary/40 px-1.5 py-0.5">{kind(film.mediaType)}</span>
                  {film.genre}
                  {film.pending && <span className="text-muted-foreground">· Identity pending</span>}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" aria-label="Previous film" onClick={() => go(-1)}>
                    <ArrowLeft />
                  </Button>
                  <span className="min-w-10 text-center text-xs text-muted-foreground">
                    {idx >= 0
                      ? `${idx + 1} of ${list.length}${filter !== "all" ? ` in ${filters.find((f) => f.id === filter)?.label ?? ""}` : ""}`
                      : ""}
                  </span>
                  <Button variant="ghost" size="icon" aria-label="Next film" onClick={() => go(1)}>
                    <ArrowRight />
                  </Button>
                </div>
              </div>
              <h2 className="font-display text-3xl leading-tight sm:text-4xl">{film.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {years(film)}
                {film.director && (
                  <>
                    {" "}
                    ·{" "}
                    {film.director.split(", ").map((d, i, arr) => (
                      <span key={d}>
                        <Button
                          variant="link"
                          size="sm"
                          title={`See all catalogue titles by ${d}`}
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => searchDirector(d)}
                        >
                          {d}
                        </Button>
                        {i < arr.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </>
                )}
                {film.presenter && (
                  <>
                    {" "}
                    · Presented by{" "}
                    <Button
                      variant="link"
                      size="sm"
                      title={`See all catalogue titles with ${film.presenter}`}
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        if (film.presenter) searchDirector(film.presenter);
                      }}
                    >
                      {film.presenter}
                    </Button>
                  </>
                )}
                {formatCommitment(film, extra?.runtime ?? film.minutes)
                  ? ` · ${formatCommitment(film, extra?.runtime ?? film.minutes)}`
                  : ""}
              </p>
              {!!film.aliases?.length && (
                <p className="mt-1 text-xs text-muted-foreground">Also known as {film.aliases.join(", ")}</p>
              )}
              {!!film.parts?.length && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {film.parts.length} films: {film.parts.join(", ")}
                </p>
              )}
              <AwardBadges film={film} />
              {extra?.omdb?.awards && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {extra.omdb.awards} <span className="opacity-70">(OMDb)</span>
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <RatingPill site="imdb" film={film} score={extra?.omdb?.imdb} />
                <RatingPill site="rt" film={film} score={extra?.omdb?.rottenTomatoes} />
                {extra?.omdb?.imdb === undefined && extra?.rating !== undefined && (
                  <span className="text-xs text-accent-foreground">TMDB {extra.rating.toFixed(1)}</span>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {extra?.overview
                  ? overviewSentences(
                      `${extra.overview}${(extra.overview.match(/[.!?](?:\s|$)/g)?.length ?? 0) < 2 ? ` ${NOTES[film.id] ?? ""}` : ""}`,
                    )
                  : `${film.synopsis} ${NOTES[film.id] ?? ""}`}
              </p>
              {!!EDITORIAL[film.id] && (
                <div className="mt-3 flex flex-wrap gap-1" aria-label="Moods">
                  {MOODS.filter((m) => EDITORIAL[film.id]?.moods.includes(m.id)).map((m) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      key={m.id}
                      title="Editorial mood"
                      onClick={() => {
                        setParam({ mood: m.id, film: "", browse: "moods" });
                      }}
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <TrailerModal film={film} trailer={extra?.trailer} open={trailerOpen} onOpenChange={setTrailerOpen} />
                <Button variant="outline" aria-pressed={shortlist.has(film.id)} onClick={() => toggleShort(film.id)}>
                  <Heart className={shortlist.has(film.id) ? "fill-save text-save" : "text-save"} />
                  {shortlist.has(film.id) ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" aria-pressed={watched.has(film.id)} onClick={() => toggleWatched(film.id)}>
                  <Check />
                  {watched.has(film.id) ? "Watched" : "Mark watched"}
                </Button>
                <FreeLegal film={film} />
                <Button variant="outline" onClick={share}>
                  <Link2 />
                  {copied ? "Link copied" : "Share"}
                </Button>
              </div>
              <WatchStrip loading={providers.isFetching} providers={extra?.providers} fallback={justWatchLink(film)} />
              {!!extra?.backdrops?.length && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Stills</span>
                  {extra.backdrops.map((url, i) => (
                    <Button
                      variant="ghost"
                      key={url}
                      aria-label={`View still ${i + 1}`}
                      className="h-10 w-16 overflow-hidden p-0 hover:ring-2 hover:ring-primary"
                      onClick={() => setPhoto(i)}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </Button>
                  ))}
                </div>
              )}
              <PhotoLightbox title={film.title} photos={extra?.backdrops ?? []} index={photo} onIndex={setPhoto} />
            </div>
          </section>
        </>
      )}
      <footer className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
        <span>{CATALOGUE.length} curated true stories.</span>
        <Link to="/list" className="underline">
          All titles by category
        </Link>
        <Link to="/makers" className="underline">
          Directors
        </Link>
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="underline">
          Film data & images: TMDB
        </a>
        <a href="https://www.justwatch.com/ie" target="_blank" rel="noreferrer" className="underline">
          Availability: JustWatch
        </a>
        <a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer" className="underline">
          IMDb & Rotten Tomatoes: OMDb
        </a>
        <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        {providers.isError && <span>Live availability temporarily unavailable.</span>}
      </footer>
    </main>
  );
}
