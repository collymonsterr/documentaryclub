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

- Film catalogue is static curated data in src/data/films.ts; trailers fall back to YouTube search unless a verified URL is set (never invent video IDs).
- Optional enrichment uses a public server function with server-only TMDB credentials; retain the immediate curated first screen so service failures never block discovery.
- TMDB identity is verified by exact normalized title, year, documentary genre and director before caching an ID; uncertain matches remain curated fallbacks.
- Discovery helpers own filtering, trailer validation, Irish provider parsing and tracking keys; test these rules independently from presentation.
- TMDB requests are deduplicated per worker with a bounded catalogue cache and three concurrent requests; no persistent database or login is needed for this private curated catalogue.
