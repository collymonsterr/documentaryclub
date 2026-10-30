import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Horizontal row with edge fades and desktop chevrons that appear only when content overflows. */
export function ScrollRow({ className, label, children }: { className?: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach(c => ro.observe(c));
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [children]);
  const nudge = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  return (
    <div className={`scroll-row ${className ?? ''}`} data-left={edges.left} data-right={edges.right}>
      <nav ref={ref} aria-label={label} className="flex gap-1 overflow-x-auto no-scrollbar">{children}</nav>
      {edges.left && <button type="button" className="scroll-row-arrow is-left" aria-label="Scroll left" onClick={() => nudge(-1)}><ChevronLeft size={18} /></button>}
      {edges.right && <button type="button" className="scroll-row-arrow is-right" aria-label="Scroll right" onClick={() => nudge(1)}><ChevronRight size={18} /></button>}
    </div>
  );
}
