import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, FILMS, justWatchLink, trailerLink, type Category, type Film } from "@/data/films";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Documentary Club — Extraordinary true stories" },
      { name: "description", content: "Curated award-winning documentaries, 2022–2026. Survival, adventure, the human mind, and strange true stories." },
      { property: "og:title", content: "Documentary Club" },
      { property: "og:description", content: "Curated award-winning documentaries. Extraordinary true stories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Filter = "all" | Category | "shortlist" | "watched";

function useStoredSet(key: string) {
  const [set, setSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    try { setSet(new Set(JSON.parse(localStorage.getItem(key) || "[]"))); } catch { /* ignore */ }
  }, [key]);
  const toggle = (id: string) =>
    setSet((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      localStorage.setItem(key, JSON.stringify([...n]));
      return n;
    });
  return [set, toggle] as const;
}

function Poster({ film, size = "lg" }: { film: Film; size?: "lg" | "sm" }) {
  return (
    <div className="poster" style={{ ["--h" as string]: film.hue }}>
      <div className="poster-grain" />
      <div className="relative flex h-full flex-col justify-end p-4">
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">{film.year}</span>
        <h3 className={`font-display leading-[0.95] text-foreground ${size === "lg" ? "text-4xl sm:text-5xl" : "text-xl"}`}>
          {film.title}
        </h3>
      </div>
    </div>
  );
}

function Index() {
  const [filter, setFilter] = useState<Filter>("all");
  const [shortlist, toggleShort] = useStoredSet("dc-shortlist");
  const [watched, toggleWatched] = useStoredSet("dc-watched");
  const [idx, setIdx] = useState(0);

  const list = useMemo(() => FILMS.filter((f) =>
    filter === "all" ? true : filter === "shortlist" ? shortlist.has(f.id) : filter === "watched" ? watched.has(f.id) : f.categories.includes(filter)
  ), [filter, shortlist, watched]);

  useEffect(() => setIdx(0), [filter]);
  const safeIdx = Math.min(idx, Math.max(list.length - 1, 0));
  const film = list[safeIdx];

  const go = useCallback((d: number) => { if (list.length) setIdx((i) => (Math.min(i, list.length - 1) + d + list.length) % list.length); }, [list.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  const touchX = useRef<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    railRef.current?.querySelector<HTMLElement>(`[data-i="${safeIdx}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [safeIdx]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" }, ...CATEGORIES,
    { id: "shortlist", label: `Shortlist · ${shortlist.size}` },
    { id: "watched", label: `Watched · ${watched.size}` },
  ];

  return (
    <main className="min-h-screen pb-16">
      <header className="mx-auto flex max-w-6xl items-baseline justify-between px-5 pt-6">
        <h1 className="font-display text-2xl text-foreground">Documentary <em className="text-primary">Club</em></h1>
        <span className="text-xs text-muted-foreground">Extraordinary true stories</span>
      </header>

      <nav className="mx-auto mt-5 flex max-w-6xl gap-2 overflow-x-auto px-5 pb-2 no-scrollbar">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`chip ${filter === f.id ? "chip-active" : ""}`}>{f.label}</button>
        ))}
      </nav>

      {!film ? (
        <p className="mx-auto mt-16 max-w-6xl px-5 text-center text-muted-foreground">Nothing here yet. Tap ☆ on a film to add it.</p>
      ) : (
        <section
          className="mx-auto mt-4 grid max-w-6xl gap-6 px-5 md:grid-cols-[minmax(0,360px)_1fr] md:items-center"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div key={film.id} className="animate-in fade-in zoom-in-95 duration-500 aspect-[2/3] w-full max-w-[360px] justify-self-center">
            <Poster film={film} />
          </div>

          <div key={film.id + "-i"} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-xs uppercase tracking-[0.25em] text-primary">{film.genre}</p>
            <h2 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">{film.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {film.year} · {film.director}{film.minutes ? ` · ${film.minutes} min` : ""}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/90">{film.synopsis}</p>
            {film.awards.length > 0 && (
              <ul className="mt-4 space-y-1">
                {film.awards.map((a) => <li key={a} className="text-sm text-accent-foreground">✦ {a}</li>)}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={trailerLink(film)} target="_blank" rel="noreferrer" className="btn-primary">▶ Watch Trailer</a>
              <a href={justWatchLink(film)} target="_blank" rel="noreferrer" className="btn-ghost">Where to watch (IE)</a>
              <button onClick={() => toggleShort(film.id)} className="btn-ghost" aria-pressed={shortlist.has(film.id)}>
                {shortlist.has(film.id) ? "★ Shortlisted" : "☆ Shortlist"}
              </button>
              <button onClick={() => toggleWatched(film.id)} className="btn-ghost" aria-pressed={watched.has(film.id)}>
                {watched.has(film.id) ? "✓ Watched" : "Mark watched"}
              </button>
            </div>
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <button onClick={() => go(-1)} className="btn-round" aria-label="Previous">‹</button>
              <span>{safeIdx + 1} / {list.length}</span>
              <button onClick={() => go(1)} className="btn-round" aria-label="Next">›</button>
              <span className="hidden sm:inline">Use ← → keys</span>
            </div>
          </div>
        </section>
      )}

      <div ref={railRef} className="mx-auto mt-10 flex max-w-6xl snap-x gap-3 overflow-x-auto px-5 pb-4 no-scrollbar">
        {list.map((f, i) => (
          <button key={f.id} data-i={i} onClick={() => setIdx(i)}
            className={`relative aspect-[2/3] w-28 shrink-0 snap-center transition sm:w-36 ${i === safeIdx ? "rail-active" : "opacity-60 hover:opacity-100"}`}>
            <Poster film={f} size="sm" />
            {watched.has(f.id) && <span className="badge">✓</span>}
          </button>
        ))}
      </div>

      <footer className="mx-auto mt-8 max-w-6xl px-5 text-xs text-muted-foreground">
        Trailers open a YouTube search unless an official link is verified. Streaming via JustWatch Ireland. Awards shown only where documented.
      </footer>
    </main>
  );
}
