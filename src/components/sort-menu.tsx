import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const OPTIONS = [['random', 'Shuffled'], ['score', 'Highest score'], ['newest', 'Newest first'], ['oldest', 'Oldest first']] as const;
export const SORTS: readonly string[] = OPTIONS.map(([id]) => id);

export function SortMenu({ value, onChange }: { value: string; onChange: (sort: string) => void }) {
  const active = value === 'random' ? undefined : OPTIONS.find(([id]) => id === value)?.[1];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Sort: ${active ?? 'Shuffled'}`}>
          <ArrowUpDown />
          {active && <span>{active}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {OPTIONS.map(([id, label]) => <DropdownMenuRadioItem key={id} value={id}>{label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
