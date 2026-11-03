# Free on YouTube: find a link for every film

The sheet `youtube-to-find.csv` lists the 484 films on Documentary Club with no YouTube link yet, best-ranked first (priority 1 is the most important). For each one, find out whether the **full film** is on YouTube **free**, and fill in the blank columns.

## What counts

- **Any uploader.** Official or not, it doesn't matter. A monthly check removes links that get taken down.
- **The whole film,** within about 10 minutes of `runtime_min`. Not a trailer, clip, review, reaction, podcast, interview or a film split into parts.
- **Free to watch.** Free with ads on YouTube Movies counts; rent or buy doesn't, and neither does a channel subscription (HBO Max, Magnolia Selects and so on).
- **English audio.** Not a dubbed copy (for example Polish "lektor" or Russian voice-over). English subtitles on a foreign-language film are fine; burned-in subtitles in another language aren't.
- **Plays in Ireland, the UK or the US.** One of the three is enough.
- **Series** (`type` = Series): link episode 1, or a single video with the whole series, and say which in `notes`.
- **Prefer** the official upload when there's a choice, because it lasts longer.

## The columns to fill

| Column | What to put |
|---|---|
| `suggested_url` | Already filled for 78 films: our scanner found a possible match. **Check it.** Many are wrong (dubbed, another film, a video about the film). If it's right, copy it into `youtube_url`. |
| `youtube_url` | The link you'd use, or leave blank if there's nothing. |
| `plays_in` | Where it plays, if you can tell: `IE, GB, US`, or for example `US`. Leave blank if you couldn't check; we check every link anyway. |
| `notes` | Anything worth knowing: "official", "fan upload", "episode 1 of 6", "nothing found". |

Leave every other column exactly as it is, especially `site_id`, so the changes match up.

## Sending it back

Send back the whole sheet as CSV, in batches if that's easier (for example priorities 1 to 100). Every link is checked automatically before it goes on the site, so a wrong guess is caught rather than published.
