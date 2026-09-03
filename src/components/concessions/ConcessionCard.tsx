import { Minus, Plus, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { InfoTip } from '@/components/ui/popover';
import { ConcessionImage } from '@/components/visual/ConcessionImage';
import { money } from '@/lib/format';
import type { ConcessionItem } from '@/data/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

/**
 * Dietary and allergen vocabulary, as keys.
 *
 * A customer with an allergy reading the counter in Bangla was previously
 * shown "Contains dairy" and "Peanuts" in English. Anything safety-adjacent is
 * the last copy that should be left untranslated.
 */
type DietaryTag = ConcessionItem['dietary'][number];
type Allergen = ConcessionItem['allergens'][number];

const dietaryKeys = {
  vegetarian: 'concessionCard.dietary.vegetarian',
  vegan: 'concessionCard.dietary.vegan',
  halal: 'concessionCard.dietary.halal',
  'contains-dairy': 'concessionCard.dietary.contains-dairy',
  spicy: 'concessionCard.dietary.spicy',
} as const satisfies Record<DietaryTag, string>;

const allergenKeys = {
  milk: 'concessionCard.allergen.milk',
  nuts: 'concessionCard.allergen.nuts',
  peanuts: 'concessionCard.allergen.peanuts',
  gluten: 'concessionCard.allergen.gluten',
  soy: 'concessionCard.allergen.soy',
  egg: 'concessionCard.allergen.egg',
} as const satisfies Record<Allergen, string>;

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
  layout = 'stacked',
}: {
  item: ConcessionItem;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  className?: string;
  /**
   * `wide` sets the picture beside the copy instead of above it, for the
   * item that opens a category. Sixteen identical cards is a spreadsheet;
   * one wide plate per category gives the counter a rhythm without changing
   * how anything is ordered.
   */
  layout?: 'stacked' | 'wide';
}) {
  const { t } = useTranslation();
  const inputId = `qty-${item.id}`;

  return (
    <article
      className={cn(
        'group h-full border-2 bg-surface-raised',
        layout === 'wide'
          ? 'grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]'
          : 'flex flex-col',
        'transition-colors duration-[--dur-base] ease-[--ease-out]',
        // In the basket is a *state*, and the monolith states it with the
        // accent rule rather than with a shadow.
        quantity > 0 ? 'border-accent' : 'border-hairline-strong hover:border-content',
        className,
      )}
    >
      <div className={cn('relative', layout === 'wide' ? 'sm:h-full' : '')}>
        <ConcessionImage
          item={item}
          sizes={
            layout === 'wide'
              ? '(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 34vw'
              : '(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 24vw'
          }
          className={cn(
            'border-b border-hairline',
            layout === 'wide' ? 'sm:h-full sm:border-b-0 sm:border-r sm:aspect-auto' : '',
          )}
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
            className="numeral absolute right-0 top-0 bg-accent px-2 py-1 text-[0.6875rem] font-bold text-accent-contrast"
          >
            ×{quantity}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col p-4',
          // The wide plate shares a grid row with a taller stacked card, so its
          // copy is centred rather than pinned to the top and bottom rules with
          // a void between them.
          layout === 'wide' ? 'sm:justify-center' : '',
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[1.25rem] uppercase leading-none">
            {item.name}
            {item.size ? <span className="text-content-muted"> · {item.size}</span> : null}
          </h3>
          <p className="numeral shrink-0 text-[1.0625rem] font-bold">{money(item.price)}</p>
        </div>

        <p lang="bn" className="mt-0.5 text-[0.8125rem] text-content-faint">
          {item.nameBn}
        </p>

        <p className="mt-2 flex-1 text-[0.875rem] leading-6 text-content-muted">{item.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.dietary.map((tag) => (
            <Badge key={tag} tone={tag === 'spicy' ? 'signal' : 'outline'}>
              {t(dietaryKeys[tag])}
            </Badge>
          ))}
        </div>

        <div className="mt-2.5 text-[0.75rem] leading-5">
          {item.allergens.length > 0 ? (
            <p className="text-content-muted">
              <span className="font-semibold text-content">
                {t('concessionCard.allergensLabel')}:{' '}
              </span>
              {item.allergens.map((a) => t(allergenKeys[a])).join(', ')}
            </p>
          ) : item.allergenDataComplete ? (
            <p className="text-content-muted">
              <span className="font-semibold text-content">
                {t('concessionCard.allergensLabel')}:{' '}
              </span>
              {t('concessionCard.noneDeclared')}
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
            {t('concessionCard.serves', { count: item.serves })}
          </span>

          {quantity === 0 ? (
            <Button size="sm" variant="outline" onClick={() => onQuantityChange(1)}>
              <Plus aria-hidden="true" />
              {t('concessionCard.add')}
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="icon-sm"
                variant="outline"
                aria-label={t('concessionCard.removeOne', { item: item.name })}
                onClick={() => onQuantityChange(quantity - 1)}
              >
                <Minus aria-hidden="true" />
              </Button>
              <label htmlFor={inputId} className="sr-only">
                {t('concessionCard.quantityOf', { item: item.name })}
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
                className="numeral h-9 w-12 border-2 border-hairline-strong bg-surface text-center text-sm font-bold"
              />
              <Button
                size="icon-sm"
                variant="outline"
                aria-label={t('concessionCard.addOne', { item: item.name })}
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
