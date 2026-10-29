# Plan: finish the agreed structure

## Agreed but not done yet
1. **17 categories** — replace the current categories with, in order: Strange, Cults & Psychology, Scams, Tech, Crime, Politics, War, Adventure, Sport, Nature, Science, Economics, Art, Music, Life Stories, Drugs, Sex.
   - Move every title using the reassignments in your brief; anything the brief does not list keeps its nearest match.
   - Split the old "Sex & Drugs" into Drugs and Sex.
   - Update the category bar, Filters, the full list page and all counts.
2. **Presenter credit** — add "Presented by" (e.g. Louis Theroux) next to the director. Presenters show in the Directors tab and get their own page. Only titles from the brief get this credit.
3. **Moods** — go from 4 to 7: Funny, Uplifting, Wholesome, Gripping, Harrowing, Mind-blowing, Gloriously weird. These are my editorial tags, and you can change them.
4. **Awards at a glance** — show laurel badges in Spotlight above the fold, next to the streaming logos. Award detail stays limited to what we have evidence for.
5. **Length / format** — show a consistent "1h 34m" or "Series · 6 episodes" everywhere.

## Kept simple (as agreed)
- Where to watch stays Ireland-only and is checked when you open a title. No country picker and no weekly refresh.
- No Picks, no Reddit claims, no backend.

## Later
- New-titles prompt for Claude, then a batch import.

## Technical details
- Category type and list in films data. Reassignments go in a per-title map in the catalogue merge, so stable IDs and saved/watched data are unaffected.
- Optional `presenter` field. The director index merges presenters, and the person page lists both kinds of credit.
- Moods are expanded in discovery facets.
- Tests are updated for category order and no empty categories, plus moods and presenter indexing.
