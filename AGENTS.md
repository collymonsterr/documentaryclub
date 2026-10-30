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
- Only Irish watch providers are fetched live, per selected catalogue ID through a server function that rejects non-catalogue IDs.
- Optional enrichment uses a public server function reading runtime-injected process.env secrets inside its handler only; retain the immediate curated first screen so service failures never block discovery.
- TMDB identity requires exact normalized title, documentary genre and every director, allowing at most one year of premiere/distribution variance; verify all candidate details and reject ambiguity before caching an ID.
- Discovery helpers own filtering, trailer validation, Irish provider parsing and tracking keys; test these rules independently from presentation.
- Independent discovery facets and explicit editorial tags live in discovery-facets; named OMDb Oscar evidence can supply generic badges, but aggregate counts never supply prize categories or years. This keeps claims auditable without re-enrichment.
- Makers uses verified existing director credits and catalogue poster mosaics, not inferred presenter credits or unverified portraits; /directors remains accessible to preserve existing links.
- Discovery shelves apply the current filtered, stable order and hide below three titles; URL facets are conjunctive and never fetch catalogue-wide live providers, keeping navigation deterministic and costs bounded.
- Verified alternate director credits use film-scoped normalization shared by TMDB and OMDb; never broaden name matching globally because unrelated people can share names.
- TMDB requests are deduplicated per worker with a bounded catalogue cache and three concurrent requests; no persistent database or login is needed for this private curated catalogue.
- OMDb ratings are captured in the snapshot at import by verified IMDb ID with matching movie/series type, preserving the daily quota; omdb.server.ts remains the bounded cached helper for any future runtime refresh.
- Later approved batches are delta imports (`bun scripts/resolve-catalogue.ts --batch2`): reconciled against the pre-batch catalogue by identity key, verified-TMDB collisions merge, resolved manifest entries are reused so reruns make no API calls; title-scoped evidence pins and collections live beside the batch source.
- The user's catalogue sheet (src/data/catalogue-sheet.json, from their Google Sheet CSV) is the final authority for category, moods, tags, director and format, applied by stable ID in the catalogue merge; New rows resolve via `bun scripts/resolve-catalogue.ts --batch4` and Remove rows are dropped, so audit manifests and saved IDs stay intact.
- Discovery navigation uses one sticky grid for header, tabs and chips; category and browse-chip selections clear the Spotlight film so filtering always opens Gallery.
