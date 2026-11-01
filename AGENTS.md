<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Catalogue = original curated FILMS (src/data/films.ts) + approved import list (src/data/import-list.ts) merged in src/data/catalogue.ts; identities/public metadata are resolved once by scripts/resolve-catalogue.ts into catalogue-snapshot.json and an audit import-manifest.json, so page loads never search TMDB/OMDb. Ambiguous titles stay visible as pending; never invent IDs, awards or trailers.
- Import matching supports movie and tv endpoints: documentary genre, title or ':'-subtitle alias, year ±1, uniqueness; tie-breaks only via explicit per-title hints (format, credited filmmaker, search alias).
- Watch providers are fetched live per selected catalogue ID through a server function that rejects non-catalogue IDs.
- Optional enrichment uses a public server function reading runtime-injected process.env secrets inside its handler only; retain the immediate curated first screen so service failures never block discovery.
- TMDB identity requires exact normalized title, documentary genre and every director, allowing at most one year of premiere/distribution variance; verify all candidate details and reject ambiguity before caching an ID.
- Discovery helpers own filtering, trailer validation, Irish provider parsing and tracking keys; test these rules independently from presentation.
- Independent discovery facets and explicit editorial tags live in discovery-facets; named OMDb Oscar wins and nominations and BAFTA and Primetime Emmy wins can supply generic labels, but aggregate counts never supply prize categories or years. This keeps claims auditable without re-enrichment.
- The Directors tab (/directors, /makers redirects by rewrite) lists featured directors (three catalogue titles, minus isFeatured's editorial exclusions) using director-profiles.json: people come from TMDB credits on catalogue films via `npm run resolve-directors`, never a name search, so portraits stay verified. Blurbs in that file are hand-written. /directors/x stays a filtered gallery page.
- Discovery shelves apply the current filtered, stable order and hide below three titles; URL facets are conjunctive and never fetch catalogue-wide live providers, keeping navigation deterministic and costs bounded.
- Verified alternate director credits use film-scoped normalization shared by TMDB and OMDb; never broaden name matching globally because unrelated people can share names.
- TMDB requests are deduplicated per worker with a bounded catalogue cache and three concurrent requests; no persistent database or login is needed for this private curated catalogue.
- OMDb ratings are captured in the snapshot at import by verified IMDb ID with matching movie/series type, preserving the daily quota; omdb.server.ts remains the bounded cached helper for any future runtime refresh.
- Later approved batches are delta imports (`bun scripts/resolve-catalogue.ts --batch2`): reconciled against the pre-batch catalogue by identity key, verified-TMDB collisions merge, resolved manifest entries are reused so reruns make no API calls; title-scoped evidence pins and collections live beside the batch source.
- data/catalogue-master.csv is the single source of truth for title, year, type, category, tags, mood, director and TMDB/IMDb IDs. src/data/catalogue-sheet.json is generated from it by `npm run sync-catalogue`: never edit that JSON by hand. Titles absent from the CSV are dropped; status=new rows are matched on TMDB and set live, and uncertain matches stay new and are listed. Enrichment stays in catalogue-snapshot.json, keyed by id.
- Tags are limited to the approved slugs in src/data/tags.ts; the sync rejects anything else.
- Discovery navigation uses one sticky grid for header, tabs and chips; category and browse-chip selections clear the Spotlight film so filtering always opens Gallery.
- Clean URLs (/tags/x, /categories/x, /directors/x, /film/x) are router rewrites onto the home route's search params in src/lib/site-urls.ts; keep filtering on the one route. Link previews come from pageHead and are server-rendered. SITE_ORIGIN there must match the live domain; rerun `npm run og-images` after adding a tag or category.
- Providers come from TMDB for one visitor-selected country; one cached response serves every country.
- Google Analytics loads only after consent (src/lib/analytics.ts). Messages and suggestions go to a private Google Sheet via the FEEDBACK_WEBHOOK_URL secret (docs/feedback-sheet.gs).
- Each film's awards are one `awards` CSV column (labels split on ";"), from an approved list only: Oscars (wins and nominations), BAFTA and Primetime Emmy (wins), Sundance Grand Jury/Audience/Directing, Tribeca, IDA, and Cannes Palme d'Or/L'Œil d'or. Wikidata has no Tribeca, IDA or Primetime Emmy data, so those need other sources. award-bodies.ts maps labels to icon, colour and prestige order. The Awards tab (/awards, /awards/x) groups by body and opens on an overview, like Directors.
- The on-netflix tag is generated: `npm run refresh-netflix` then `npm run sync-catalogue`. It means Netflix in at least one country; don't edit it by hand.
- Browse tabs and chips hold one selection (browseSelection): a tab opens on its first entry, and a new choice clears the last. Only the Filters dropdown combines; era, length, type and sort survive tab changes. Every single selection gets a heading from listHeading.
