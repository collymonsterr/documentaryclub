import { Mic } from 'lucide-react';
import { DF_ID, DF_NAME, DF_PICKS_PAGE, dfLink, dfPicksFor } from '@/data/documentary-first';
import { pagePath } from '@/lib/site-urls';
import { softClick } from '@/lib/utils';

const external = { target: '_blank', rel: 'noopener' } as const;

// Film page: "Picked by Laela Kilbourn on Documentary First", each guest linking to their pick on DocuView Deja View
// (tracked with utm_source=documentaryclub, as agreed), then a link to the whole guest-picks list here.
export function DocumentaryFirstCredit({ filmId, onAll }: { filmId: string; onAll: () => void }) {
  const picks = dfPicksFor(filmId);
  if (!picks.length) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
      <Mic className="size-3.5 shrink-0" aria-hidden />
      <span>Picked by</span>
      {picks.map((p, i) => (
        <span key={p.guest}>
          <a href={dfLink(p)} {...external} className="font-medium text-foreground underline-offset-2 hover:underline">{p.guest}</a>
          {i < picks.length - 2 ? ',' : i === picks.length - 2 ? ' and' : ''}
        </span>
      ))}
      <span>on {DF_NAME}</span>
      <span aria-hidden>·</span>
      <a href={pagePath({ pick: DF_ID }) ?? '/'} onClick={softClick(onAll)} className="underline-offset-2 hover:underline">All guest picks</a>
    </p>
  );
}

// The guest-picks list: one line pointing to their page, where every pick has the guest's reasons and the episode.
export function DocumentaryFirstListLink() {
  const href = `${DF_PICKS_PAGE}?${new URLSearchParams({ utm_source: 'documentaryclub', utm_medium: 'referral' })}`;
  return (
    <p className="mt-2 max-w-2xl text-sm">
      <a href={href} {...external} className="inline-flex items-center gap-1.5 font-medium underline underline-offset-2">
        <Mic className="size-3.5" aria-hidden />
        Hear why each guest picked them on {DF_NAME}
      </a>
    </p>
  );
}
