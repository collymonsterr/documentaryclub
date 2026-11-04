import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SiteLogo } from '@/components/site-logo';
import { Button } from '@/components/ui/button';

const home = { film: '', q: '', list: '', cat: 'all', era: 'all', len: 'all', type: 'all', sort: 'random', award: '', mood: '', pick: '', maker: '', tag: '', like: '', soon: '', browse: 'topics' } as const;
export function SimplePage({ title, children }: { title: string; children: ReactNode }) {
  return <main className="mx-auto max-w-2xl px-4 pb-10 sm:px-6">
    <header className="flex items-center justify-between gap-2 py-3"><SiteLogo /><Button asChild size="sm" variant="ghost"><Link to="/" search={home}><ArrowLeft />Gallery</Link></Button></header>
    <h1 className="mt-4 font-display text-3xl font-semibold">{title}</h1>
    {children}
  </main>;
}
