import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { statClick, statPage } from '@/lib/stats-client';

// Anonymous page and click counts for the owner's Stats page (no cookies, nothing about who; see /privacy).
export function StatsTracker() {
  const router = useRouter();
  useEffect(() => {
    statPage(location.pathname);
    const off = router.subscribe('onResolved', () => statPage(location.pathname));
    document.addEventListener('click', statClick, true);
    return () => { off(); document.removeEventListener('click', statClick, true); };
  }, [router]);
  return null;
}
