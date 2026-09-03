import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Announcer, DataRow, EmptyState, PageHeader } from '@/components/common';
import { EmptyDrawing } from '@/components/visual/EmptyStates';
import { Button } from '@/components/ui/button';
import { DemoNote } from '@/components/ui/misc';
import { FilterChip } from '@/components/ui/toggle';
import { ConcessionCard } from '@/components/concessions/ConcessionCard';
import { concessionById, concessionCategories, concessionsFor, cinemas } from '@/data';
import { useBooking } from '@/store/booking';
import { usePreferences } from '@/store/preferences';
import { money } from '@/lib/format';
import { useAnnouncer } from '@/hooks';
import { Trans, useTranslation } from 'react-i18next';

const dietaryFilters = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'halal', label: 'Halal' },
] as const;

export function Concessions() {
  const { t } = useTranslation();
  const cinemaId = usePreferences((s) => s.cinemaId);
  const cinema = cinemas.find((c) => c.id === cinemaId) ?? null;
  const concessions = useBooking((s) => s.concessions);
  const setConcession = useBooking((s) => s.setConcession);
  const clearConcessions = useBooking((s) => s.clearConcessions);
  const movieId = useBooking((s) => s.movieId);
  const { message, announce } = useAnnouncer();

  const [category, setCategory] = useState<string | null>(null);
  const [dietary, setDietary] = useState<string[]>([]);
  const [excludeIncomplete, setExcludeIncomplete] = useState(false);

  const available = useMemo(() => concessionsFor(cinemaId), [cinemaId]);

  const items = useMemo(
    () =>
      available.filter((item) => {
        if (category && item.category !== category) return false;
        if (dietary.length && !dietary.every((tag) => item.dietary.includes(tag as 'vegan'))) {
          return false;
        }
        if (excludeIncomplete && !item.allergenDataComplete) return false;
        return true;
      }),
    [available, category, dietary, excludeIncomplete],
  );

  const lines = Object.entries(concessions)
    .map(([id, quantity]) => ({ item: concessionById.get(id), quantity }))
    .filter((line) => line.item && line.quantity > 0);

  const subtotal = lines.reduce((sum, line) => sum + (line.item?.price ?? 0) * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function change(itemId: string, quantity: number, name: string) {
    setConcession(itemId, quantity);
    announce(quantity === 0 ? `${name} removed` : `${name}, quantity ${quantity}`);
  }

  return (
    <div className="shell">
      <Announcer message={message} />

      <PageHeader
        eyebrow={t('concessions.eyebrow')}
        title={t('concessions.title')}
        lede={
          cinema
            ? t('concessions.ledeCinema', { cinema: cinema.name })
            : 'What the counter serves across the circuit. Add anything here and it carries into your booking — a couple of items are only stocked at some houses.'
        }
      />

      {/* Discrete, once, under the header — not stamped over every image. */}
      <p className="flex items-center gap-2 border-b border-hairline py-3 text-[0.8125rem] text-content-muted">
        <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-content-faint" />
        {t('concessions.aiDisclosure')}
      </p>

      <div className="flex flex-col gap-8 py-8 lg:flex-row lg:gap-12">
        <div className="min-w-0 flex-1">
          <div className="mb-6 space-y-4 border-b border-hairline pb-5">
            <div>
              <p className="eyebrow mb-2.5">Category</p>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip checked={category === null} onCheckedChange={() => setCategory(null)}>
                  Everything
                </FilterChip>
                {concessionCategories.map((c) => (
                  <FilterChip
                    key={c.id}
                    checked={category === c.id}
                    onCheckedChange={(checked) => setCategory(checked ? c.id : null)}
                  >
                    {c.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2.5">Dietary</p>
              <div className="flex flex-wrap gap-1.5">
                {dietaryFilters.map((d) => (
                  <FilterChip
                    key={d.id}
                    checked={dietary.includes(d.id)}
                    onCheckedChange={(checked) =>
                      setDietary((current) =>
                        checked ? [...current, d.id] : current.filter((t) => t !== d.id),
                      )
                    }
                  >
                    {d.label}
                  </FilterChip>
                ))}
                <FilterChip checked={excludeIncomplete} onCheckedChange={setExcludeIncomplete}>
                  {t('concessions.fullAllergenOnly')}
                </FilterChip>
              </div>
            </div>
          </div>

          <p className="mb-5 text-sm text-content-muted" role="status" aria-live="polite">
            <Trans
              i18nKey="concessions.onTheCounter"
              values={{ items: t('concessions.itemCount', { count: items.length }) }}
              components={{ strong: <span className="font-semibold text-content" /> }}
            />
          </p>

          {items.length === 0 ? (
            <EmptyState
              title={t('concessions.emptyTitle')}
              variant="index"
              body={t('concessions.emptyBody')}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setDietary([]);
                    setExcludeIncomplete(false);
                    setCategory(null);
                  }}
                >
                  {t('concessions.clearFilters')}
                </Button>
              }
            />
          ) : (
            /* Deliberately not a uniform grid. Every fifth plate runs the
               full width of the two-column half of the shelf, which breaks the
               catalogue rhythm without changing the order of anything or
               hiding a single control. */
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, i) => {
                const wide = i % 5 === 0;
                return (
                  <li key={item.id} className={wide ? 'sm:col-span-2 xl:col-span-2' : undefined}>
                    <ConcessionCard
                      item={item}
                      layout={wide ? 'wide' : 'stacked'}
                      quantity={concessions[item.id] ?? 0}
                      onQuantityChange={(quantity) => change(item.id, quantity, item.name)}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          <DemoNote className="mt-8" tone="loud">
            {t('concessions.demoNote')}
          </DemoNote>
        </div>

        {/* ── Order summary ─────────────────────────────────────────── */}
        <aside className="lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-28">
            <section
              aria-labelledby="counter-summary"
              className="border-2 border-content bg-surface-raised p-5"
            >
              <h2 id="counter-summary" className="font-display text-xl leading-none">
                {t('concessions.orderHeading')}
              </h2>

              {lines.length === 0 ? (
                <>
                  {/* A till roll with nothing printed on it yet. */}
                  <EmptyDrawing variant="receipt" className="mx-auto mt-4 max-w-36" />
                  <p className="mt-3 text-[0.9375rem] leading-7 text-content-muted">
                    {t('concessions.orderEmpty')}
                  </p>
                </>
              ) : (
                <>
                  <dl className="mt-4">
                    {lines.map((line) => (
                      <DataRow
                        key={line.item!.id}
                        label={
                          <>
                            {line.item!.name}
                            {line.item!.size ? ` (${line.item!.size})` : ''}
                            <span className="text-content-muted"> × {line.quantity}</span>
                          </>
                        }
                      >
                        {money(line.item!.price * line.quantity)}
                      </DataRow>
                    ))}
                    <DataRow
                      label={t('concessions.subtotal', {
                        items: t('concessions.itemCount', { count: itemCount }),
                      })}
                      emphasis
                    >
                      {money(subtotal)}
                    </DataRow>
                  </dl>

                  <div className="mt-5 space-y-2">
                    <Button asChild block>
                      <Link to={movieId ? `/booking/${movieId}` : '/showtimes'}>
                        {movieId
                          ? t('concessions.backToBooking')
                          : t('concessions.pickAFilm')}
                      </Link>
                    </Button>
                    <Button variant="ghost" block onClick={clearConcessions}>
                      {t('concessions.clearOrder')}
                    </Button>
                  </div>

                  <p className="mt-3 text-[0.75rem] leading-5 text-content-muted">
                    {t('concessions.orderNote')}
                  </p>
                </>
              )}
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
