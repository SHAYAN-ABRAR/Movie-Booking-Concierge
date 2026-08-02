import { MapPin } from 'lucide-react';
import { cinemas, cities } from '@/data';
import { usePreferences } from '@/store/preferences';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ALL = '__all__';

/**
 * The venue selector. The choice persists across the whole site and is the
 * single source of truth that the showtimes page, the booking wizard and Max
 * all read from.
 */
export function LocationSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const cinemaId = usePreferences((s) => s.cinemaId);
  const setCinema = usePreferences((s) => s.setCinema);

  return (
    <Select
      value={cinemaId ?? ALL}
      onValueChange={(value) => setCinema(value === ALL ? null : value)}
    >
      <SelectTrigger
        aria-label="Choose your cinema"
        className={cn(
          'h-9 gap-1.5 border-transparent bg-transparent px-2 text-[0.8125rem] font-semibold hover:border-hairline-strong',
          fullWidth ? 'w-full' : 'w-auto max-w-52',
        )}
      >
        <MapPin className="size-4 shrink-0 opacity-60" aria-hidden="true" />
        <SelectValue placeholder="All cinemas" />
      </SelectTrigger>
      <SelectContent className="min-w-60">
        <SelectItem value={ALL}>All cinemas</SelectItem>
        {cities.map((city) => (
          <SelectGroup key={city}>
            <SelectLabel>{city}</SelectLabel>
            {cinemas
              .filter((c) => c.city === city)
              .map((cinema) => (
                <SelectItem key={cinema.id} value={cinema.id}>
                  {cinema.shortName}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
