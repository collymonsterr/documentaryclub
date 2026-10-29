import { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function PhotoLightbox({ title, photos, index, onIndex }: { title: string; photos: string[]; index: number | null; onIndex: (i: number | null) => void }) {
  const touch = useRef<number | null>(null);
  const step = (d: number) => index !== null && onIndex((index + d + photos.length) % photos.length);
  const url = index === null ? undefined : photos[index];
  return <Dialog open={index !== null} onOpenChange={o => { if (!o) onIndex(null); }}>
    <DialogContent className="w-[calc(100%-1rem)] max-w-5xl gap-2 p-2 sm:p-3" onKeyDown={e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); }}>
      <DialogTitle className="pr-8 text-sm">{title}</DialogTitle>
      <DialogDescription className="sr-only">Still {index === null ? 0 : index + 1} of {photos.length}</DialogDescription>
      {url && <img src={url} alt={`${title} still ${(index ?? 0) + 1}`} className="max-h-[75dvh] w-full rounded-md object-contain"
        onTouchStart={e => { touch.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={e => { const x = e.changedTouches[0]?.clientX, s = touch.current; touch.current = null; if (x !== undefined && s !== null && Math.abs(x - s) > 50) step(x < s ? 1 : -1); }} />}
      {photos.length > 1 && <div className="flex items-center justify-center gap-3"><Button variant="ghost" size="icon" aria-label="Previous still" onClick={() => step(-1)}><ArrowLeft /></Button><span className="text-xs text-muted-foreground">{(index ?? 0) + 1} / {photos.length}</span><Button variant="ghost" size="icon" aria-label="Next still" onClick={() => step(1)}><ArrowRight /></Button></div>}
    </DialogContent>
  </Dialog>;
}
