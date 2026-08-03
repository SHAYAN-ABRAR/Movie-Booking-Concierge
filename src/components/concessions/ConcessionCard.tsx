import { Minus, Plus, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { InfoTip } from '@/components/ui/popover';
import { ConcessionPhoto } from '@/components/visual/ConcessionPhoto';
import { money } from '@/lib/format';
import type { ConcessionItem } from '@/data/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const dietaryLabels: Record<string, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  halal: 'Halal',
  'contains-dairy': 'Contains dairy',
  spicy: 'Spicy',
};

const allergenLabels: Record<string, string> = {
  milk: 'Milk',
  nuts: 'Nuts',
  peanuts: 'Peanuts',
  gluten: 'Gluten',
  soy: 'Soy',
  egg: 'Egg',
};

/**
 * A counter item.
 *
 * Allergen data is shown exactly as complete or incomplete as it actually is.
 * Where the kitchen has not confirmed a full declaration, the card says so
 * rather than presenting a partial list as if it were exhaustive.
 */
export function ConcessionCard({
  item,
  quantity,
  onQuantityChange,
  className,
}: {
  item: ConcessionItem;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const inputId = `qty-${item.id}`;

  return (
    <article
      className={cn(
        'group flex h-full flex-col border border-hairline-strong bg-surface-raised',
        'transition-[border-color,box-shadow] duration-200 ease-out',
        quantity > 0
          ? 'border-content shadow-[0_10px_24px_-18px_rgb(20_22_31_/_0.45)]'
          : 'hover:border-content/50',
        className,
      )}
    >
      <div className="relative">
        <ConcessionPhoto
          item={item}
          className="border-b border-hairline"
          imgClassName={cn(
            'transition-transform duration-[--dur-slow] ease-[--ease-out]',
            'group-hover:scale-[1.04] group-focus-within:scale-[1.04]',
            'motion-reduce:transform-none',
          )}
        />
        {/* Immediate confirmation that the item is in the order, without a toast
            on every quantity change. `aria-hidden` — the quantity is already
            announced by the labelled number input below. */}
        {quantity > 0 ? (
          <span
            aria-hidden="true"
            className="numeral absolute right-0 top-0 bg-content px-2 py-1 text-[0.6875rem] font-semibold text-surface"
          >
            ×{quantity}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg leading-tight">
            {item.name}
            {item.size ? <span className="text-content-muted"> · {item.size}</span> : null}
          </h3>
          <p className="numeral shrink-0 font-semibold">{money(item.price)}</p>
        </div>

        <p lang="bn" className="mt-0.5 text-[0.8125rem] text-content-faint">
          {item.nameBn}
        </p>

        <p className="mt-2 flex-1 text-[0.875rem] leading-6 text-content-muted">{item.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.dietary.map((tag) => (
            <Badge key={tag} tone={tag === 'spicy' ? 'marigold' : 'outline'}>
              {dietaryLabels[tag] ?? tag}
            </Badge>
          ))}
        </div>

        <div className="mt-2.5 text-[0.75rem] leading-5">
          {item.allergens.length > 0 ? (
            <p className="text-content-muted">
              <span className="font-semibold text-content">Allergens: </span>
              {item.allergens.map((a) => allergenLabels[a] ?? a).join(', ')}
            </p>
          ) : item.allergenDataComplete ? (
            <p className="text-content-muted">
              <span className="font-semibold text-content">Allergens: </span>none declared
            </p>
          ) : null}

          {!item.allergenDataComplete ? (
            <InfoTip label={t('concessionCard.allergenIncompleteTip')}>
              <p className="mt-1 inline-flex cursor-help items-center gap-1.5 font-medium text-warn">
                <TriangleAlert aria-hidden="true" className="size-3.5" />
                {t('concessionCard.allergenIncomplete')}
              </p>
            </InfoTip>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3">
          <span className="text-[0.75rem] text-content-faint">
            Serves {item.serves === 1 ? 'one' : item.serves}
          </span>

          {quantity === 0 ? (
            <Button size="sm" variant="outline" onClick={() => onQuantityChange(1)}>
              <Plus aria-hidden="true" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="icon-sm"
                variant="outline"
                aria-label={`Remove one ${item.name}`}
                onClick={() => onQuantityChange(quantity - 1)}
              >
                <Minus aria-hidden="true" />
              </Button>
              <label htmlFor={inputId} className="sr-only">
                Quantity of {item.name}
              </label>
              <input
                id={inputId}
                type="number"
                inputMode="numeric"
                min={0}
                max={20}
                value={quantity}
                onChange={(event) =>
                  onQuantityChange(Math.max(0, Math.min(20, Number(event.target.value) || 0)))
                }
                className="numeral h-9 w-12 border border-hairline-strong bg-surface text-center text-sm"
              />
              <Button
                size="icon-sm"
                variant="outline"
                aria-label={`Add one ${item.name}`}
                disabled={quantity >= 20}
                onClick={() => onQuantityChange(quantity + 1)}
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
