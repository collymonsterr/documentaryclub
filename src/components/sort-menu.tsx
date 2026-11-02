import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const OPTIONS = [['random', 'Shuffled'], ['shuffle', 'Shuffled'], ['score', 'Highest score'], ['newest', 'Newest first'], ['oldest', 'Oldest first']] as const;
export const SORTS: readonly string[] = OPTIONS.map(([id]) => id);

// A list with its own natural order can name it in place of Shuffled, and then offers shuffling as a separate choice.
export function SortMenu({ value, onChange, defaultLabel = 'Shuffled' }: { value: string; onChange: (sort: string) => void; defaultLabel?: string }) {
  const active = value === 'random' ? undefined : OPTIONS.find(([id]) => id === value)?.[1];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Sort: ${active ?? defaultLabel}`}>
          <ArrowUpDown />
          {active && <span>{active}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {OPTIONS.filter(([id]) => id !== 'shuffle' || defaultLabel !== 'Shuffled').map(([id, label]) => <DropdownMenuRadioItem key={id} value={id}>{id === 'random' ? defaultLabel : label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
