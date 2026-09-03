import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trans, useTranslation } from 'react-i18next';
import { useFormatters } from '@/i18n/useFormatters';
import {
  Banknote,
  CreditCard,
  Gift,
  Landmark,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Badge, DemoNote, RuleHeading } from '@/components/ui/misc';
import { Checkbox, RadioGroup, RadioGroupItem } from '@/components/ui/toggle';
import { FilterChip } from '@/components/ui/toggle';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateStrip } from '@/components/showtime/DateStrip';
import { SeatMap } from '@/components/booking/SeatMap';
import { ConcessionCard } from '@/components/concessions/ConcessionCard';
import { AccessibilityChips } from '@/components/movie/Chips';
import { SelectedMovieStory } from '@/components/movie/SelectedMovieStory';
import { DataRow, EmptyState } from '@/components/common';
import {
  availabilityFor,
  cinemaById,
  cinemas,
  cities,
  concessionCategories,
  concessionsFor,
  formatLabels,
  languageLabels,
  screenFor,
  showtimesForCinemaDate,
} from '@/data';
import { certificates, ticketCategories } from '@/data/pricing';
import { insurancePolicy } from '@/data/policies';
import { useBooking, type GuestDetails, type PaymentMethodId } from '@/store/booking';
import { useBookings, findDuplicate } from '@/store/bookings';
import { checkAgeCategories, totalTickets, type Quote } from '@/lib/bookingMath';
import { dateWindow, displayTime, formatRuntime, timeFromMinutes } from '@/lib/datetime';
import { screeningEndMinutes } from '@/data/schedule';
import { money, pluralise, seatRanges } from '@/lib/format';
import type { Movie, Showtime, TicketCategory } from '@/data/types';
import { cn } from '@/lib/utils';

/* ══════════════════════════════════════════════════════════════════════
   STEP 1 — SCREENING
   ══════════════════════════════════════════════════════════════════════ */

export function SessionStep({ movie, showtime }: { movie: Movie; showtime: Showtime | null }) {
  const { t } = useTranslation();
  const cinemaId = useBooking((s) => s.cinemaId);
  const date = useBooking((s) => s.date);
  const setCinema = useBooking((s) => s.setCinema);
  const setDate = useBooking((s) => s.setDate);
  const setShowtime = useBooking((s) => s.setShowtime);

  const dates = useMemo(() => dateWindow(10), []);
  const activeDate = date ?? dates[0]!;

  const options = useMemo(() => {
    if (!cinemaId) return [];
    return showtimesForCinemaDate(cinemaId, activeDate).filter((s) => s.movieId === movie.id);
  }, [cinemaId, activeDate, movie.id]);

  const screen = showtime ? screenFor(showtime) : null;

  return (
    <div className="space-y-8">
      {/* What you're booking, before the mechanics of where and when. */}
      <SelectedMovieStory movie={movie} showDetailsLink={false} />

      <div>
        <RuleHeading as="h2" index="01" className="mb-4">
          {t('bookingSteps.session.whichCinema')}
        </RuleHeading>
        <Select value={cinemaId ?? ''} onValueChange={setCinema}>
          <SelectTrigger aria-label={t('bookingSteps.session.cinema')} className="max-w-sm">
            <SelectValue placeholder={t('bookingSteps.session.chooseCinema')} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectGroup key={city}>
                <SelectLabel>{city}</SelectLabel>
                {cinemas.map((cinema) =>
                  cinema.city === city ? (
                    <SelectItem key={cinema.id} value={cinema.id}>
                      {cinema.name}
                    </SelectItem>
                  ) : null,
                )}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <RuleHeading as="h2" index="02" className="mb-4">
          {t('bookingSteps.session.whichDay')}
        </RuleHeading>
        <DateStrip value={activeDate} onChange={setDate} />
      </div>

      <div>
        <RuleHeading as="h2" index="03" className="mb-4">
          {t('bookingSteps.session.whichScreening')}
        </RuleHeading>

        {!cinemaId ? (
          <p className="text-[0.9375rem] text-content-muted">
            {t('bookingSteps.session.cinemaFirst')}
          </p>
        ) : options.length === 0 ? (
          <EmptyState
            title={t('bookingSteps.session.nothingScheduled')}
            variant="schedule"
            body={t('bookingSteps.session.nothingScheduledBody', {
              title: movie.title,
              cinema:
                cinemaById.get(cinemaId)?.name ?? t('bookingSteps.session.thisCinema'),
            })}
          />
        ) : (
          <ul className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(11rem,1fr))]">
            {options.map((option) => {
              const availability = availabilityFor(option);
              const soldOut = availability.level === 'sold-out';
              const chosen = showtime?.id === option.id;
              const ends = timeFromMinutes(screeningEndMinutes(option));

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={soldOut}
                    onClick={() => setShowtime(option.id)}
                    aria-pressed={chosen}
                    className={cn(
                      'w-full border p-3 text-left transition-colors',
                      soldOut
                        ? 'cursor-not-allowed border-hairline bg-surface-sunken/60 opacity-70'
                        : chosen
                          ? 'border-content bg-content text-surface'
                          : 'border-hairline-strong bg-surface-raised hover:border-content',
                    )}
                  >
                    <span className="numeral block text-lg font-semibold leading-none">
                      {displayTime(option.time)}
                    </span>
                    <span className="mt-1 block text-[0.75rem] opacity-80">
                      {formatLabels[option.format]} · ends ~{displayTime(ends)}
                    </span>
                    <span className="mt-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.06em] opacity-80">
                      {soldOut ? 'Sold out' : `${availability.available} seats left`}
                    </span>
                    {option.accessibility.length && !chosen ? (
                      <AccessibilityChips features={option.accessibility} size="sm" className="mt-2" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showtime && screen ? (
        <div className="edge bg-surface-raised p-5">
          <h3 className="eyebrow mb-3">{t('bookingSteps.session.yourScreening')}</h3>
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            <DataRow label={t('bookingSteps.session.screen')}>{screen.name}</DataRow>
            <DataRow label={t('bookingSteps.session.format')}>
              {formatLabels[showtime.format]}
            </DataRow>
            <DataRow label={t('bookingSteps.session.language')}>
              {languageLabels[showtime.language]}
            </DataRow>
            <DataRow label={t('bookingSteps.session.subtitles')}>
              {showtime.subtitles.length
                ? showtime.subtitles.map((s) => languageLabels[s]).join(', ')
                : t('bookingSteps.session.none')}
            </DataRow>
            <DataRow label={t('bookingSteps.session.runningTime')}>
              {formatRuntime(movie.runtimeMinutes)}
            </DataRow>
            <DataRow label={t('bookingSteps.session.certificate')}>
              {certificates[movie.certificate].label}
            </DataRow>
          </dl>
          {showtime.accessibility.length ? (
            <div className="mt-3 border-t border-hairline pt-3">
              <p className="eyebrow mb-2">{t('bookingSteps.session.accessHeading')}</p>
              <AccessibilityChips features={showtime.accessibility} />
            </div>
          ) : (
            <p className="mt-3 border-t border-hairline pt-3 text-[0.8125rem] text-content-muted">
              {t('bookingSteps.session.noAccessListed')}{' '}
              <Link
                to={`/cinemas/${cinemaById.get(showtime.cinemaId)?.slug ?? ''}`}
                className="font-semibold underline underline-offset-4"
              >
                {t('bookingSteps.session.cinemaPage')}
              </Link>
              .
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 2 — TICKETS
   ══════════════════════════════════════════════════════════════════════ */

export function TicketsStep({
  movie,
  showtime,
  quote,
}: {
  movie: Movie;
  showtime: Showtime;
  quote: Quote;
}) {
  const { t } = useTranslation();
  const counts = useBooking((s) => s.counts);
  const setCount = useBooking((s) => s.setCount);
  const ageAcknowledged = useBooking((s) => s.ageAcknowledged);
  const acknowledgeAge = useBooking((s) => s.acknowledgeAge);

  const total = totalTickets(counts);
  const ageCheck = checkAgeCategories(movie.certificate, counts);
  const availability = availabilityFor(showtime);

  return (
    <div className="space-y-8">
      <div>
        <RuleHeading as="h2" className="mb-2">
          {t('bookingSteps.tickets.heading')}
        </RuleHeading>
        <p className="mb-5 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          {t('bookingSteps.tickets.lede')}
        </p>

        <ul className="divide-y divide-hairline border-y border-hairline">
          {ticketCategories.map((category) => {
            const value = counts[category.id];
            const blocked =
              movie.certificate === 'A18' && category.id === 'child';

            return (
              <li key={category.id} className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {category.label}
                    <span lang="bn" className="ml-2 font-normal text-content-muted">
                      {category.labelBn}
                    </span>
                    {category.multiplier !== 1 ? (
                      <Badge tone="ok" className="ml-2">
                        {Math.round((1 - category.multiplier) * 100)}% off
                      </Badge>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] leading-5 text-content-muted">
                    {blocked
                      ? 'Not available for an 18-rated film.'
                      : category.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`One fewer ${category.label} ticket`}
                    disabled={value === 0}
                    onClick={() => setCount(category.id, value - 1)}
                  >
                    <Minus aria-hidden="true" />
                  </Button>
                  <span
                    className="numeral w-8 text-center text-lg font-semibold"
                    aria-live="polite"
                    aria-label={`${value} ${category.label} tickets`}
                  >
                    {value}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`One more ${category.label} ticket`}
                    disabled={blocked || total >= Math.min(10, availability.available)}
                    onClick={() => setCount(category.id, value + 1)}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-[0.8125rem] text-content-muted">
          Up to 10 tickets per booking, and no more than the {availability.available} seats still
          free at this screening.
        </p>
      </div>

      {/* ── Age-category check ─────────────────────────────────────── */}
      {total > 0 && ageCheck.message ? (
        <div
          className={cn(
            'flex gap-3 border-l-2 px-4 py-4',
            ageCheck.ok ? 'border-hairline-strong bg-surface-sunken/50' : 'border-accent bg-signal-wash/50',
          )}
          role={ageCheck.ok ? undefined : 'alert'}
        >
          <TriangleAlert
            aria-hidden="true"
            className={cn('mt-0.5 size-5 shrink-0', ageCheck.ok ? 'text-content-muted' : 'text-accent')}
          />
          <div className="min-w-0">
            <p className="font-semibold">{ageCheck.certificateLabel}</p>
            <p className="mt-1 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
              {ageCheck.message}
            </p>

            {!ageCheck.ok && !ageCheck.blocking ? (
              <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[0.9375rem]">
                <Checkbox
                  checked={ageAcknowledged}
                  onCheckedChange={(checked) => acknowledgeAge(checked === true)}
                  className="mt-0.5"
                />
                <span>
                  I understand, and an adult will accompany the under-{certificates[movie.certificate].minAge}s
                  in this booking.
                </span>
              </label>
            ) : null}

            {ageCheck.blocking ? (
              <p className="mt-2 text-[0.875rem] font-semibold text-danger">
                {t('bookingSteps.tickets.changeChild')}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Running cost ───────────────────────────────────────────── */}
      {total > 0 ? (
        <div className="edge bg-surface-raised p-5">
          <h3 className="eyebrow mb-3">{t('bookingSteps.tickets.costHeading')}</h3>
          <p className="mb-3 text-[0.875rem] leading-6 text-content-muted">
            {t('bookingSteps.tickets.costLede')}
          </p>
          <dl>
            <DataRow label={t('bookingSteps.tickets.estimated', { count: total })}>
              {money(quote.ticketSubtotal)}
            </DataRow>
            {quote.categorySavings > 0 ? (
              <DataRow label={t('bookingSteps.tickets.categoryDiscount')}>
                − {money(quote.categorySavings)}
              </DataRow>
            ) : null}
            {showtime.matinee ? (
              <DataRow label={t('bookingSteps.tickets.beforeThree')}>
                − {money(quote.matineeSavings || 60 * total)}
              </DataRow>
            ) : null}
            <DataRow
              label={t('bookingSteps.tickets.bookingFeeLine', { fee: money(20), count: total })}
            >
              {money(20 * total)}
            </DataRow>
          </dl>
        </div>
      ) : null}

      <DemoNote>{t('bookingSteps.tickets.samplePricing')}</DemoNote>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 3 — SEATS
   ══════════════════════════════════════════════════════════════════════ */

export function SeatsStep({
  showtime,
  onAnnounce,
}: {
  showtime: Showtime;
  onAnnounce: (message: string) => void;
}) {
  const { t } = useTranslation();
  const counts = useBooking((s) => s.counts);
  const seatIds = useBooking((s) => s.seatIds);
  const proposedSeatIds = useBooking((s) => s.proposedSeatIds);
  const toggleSeat = useBooking((s) => s.toggleSeat);
  const clearSeats = useBooking((s) => s.clearSeats);

  const limit = totalTickets(counts);
  const short = limit - seatIds.length;

  return (
    <div className="space-y-6">
      <div>
        <RuleHeading as="h2" className="mb-2">
          {t('bookingSteps.seats.heading')}
        </RuleHeading>
        <p className="max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          {limit === 0
            ? t('bookingSteps.seats.needTickets')
            : t('bookingSteps.seats.pick', { count: limit })}
        </p>
      </div>

      {limit > 0 ? (
        <>
          <SeatMap
            showtime={showtime}
            selected={seatIds}
            proposed={proposedSeatIds}
            limit={limit}
            onToggle={(seatId) => toggleSeat(seatId, limit)}
            onReset={clearSeats}
            onAnnounce={onAnnounce}
          />

          {short > 0 ? (
            <p className="text-[0.9375rem] font-medium text-warn" role="status">
              {pluralise(short, 'more seat')} to choose.
            </p>
          ) : (
            <p className="text-[0.9375rem] font-medium text-ok" role="status">
              {seatRanges(seatIds)} chosen. That matches your {pluralise(limit, 'ticket')}.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 4 — ADD-ONS
   ══════════════════════════════════════════════════════════════════════ */

export function ConcessionsStep({ quote }: { quote: Quote }) {
  const { t } = useTranslation();
  const cinemaId = useBooking((s) => s.cinemaId);
  const concessions = useBooking((s) => s.concessions);
  const setConcession = useBooking((s) => s.setConcession);
  const clearConcessions = useBooking((s) => s.clearConcessions);
  const insurance = useBooking((s) => s.insurance);
  const setInsurance = useBooking((s) => s.setInsurance);
  const [category, setCategory] = useState<string | null>(null);

  const items = useMemo(() => {
    const available = concessionsFor(cinemaId);
    return category ? available.filter((i) => i.category === category) : available;
  }, [cinemaId, category]);

  const added = Object.values(concessions).reduce((sum, q) => sum + q, 0);

  return (
    <div className="space-y-8">
      <div>
        <RuleHeading as="h2" className="mb-2">
          {t('bookingSteps.concessions.heading')}
        </RuleHeading>
        <p className="mb-3 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          {t('bookingSteps.concessions.lede')}
        </p>
        {/* The generated-image disclosure, once, before the grid. */}
        <p className="mb-5 flex items-center gap-2 text-[0.8125rem] text-content-muted">
          <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-content-faint" />
          {t('concessions.aiDisclosure')}
        </p>

        <div className="mb-5 flex flex-wrap gap-1.5">
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

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <ConcessionCard
                item={item}
                quantity={concessions[item.id] ?? 0}
                onQuantityChange={(quantity) => setConcession(item.id, quantity)}
              />
            </li>
          ))}
        </ul>

        {added > 0 ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <p className="numeral text-[0.9375rem]">
              {pluralise(added, 'item')} · {money(quote.concessionSubtotal)}
              {quote.concessionSavings > 0 ? (
                <span className="ml-2 text-ok">
                  {t('bookingSteps.concessions.familySaved', {
                    amount: money(quote.concessionSavings),
                  })}
                </span>
              ) : null}
            </p>
            <Button variant="ghost" size="sm" onClick={clearConcessions}>
              {t('bookingSteps.concessions.clear')}
            </Button>
          </div>
        ) : null}
      </div>

      {/* ── Ticket Cover ───────────────────────────────────────────── */}
      <div className="edge p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[1.25rem] uppercase leading-none">
              {t('bookingSteps.concessions.coverTitle', {
                name: insurancePolicy.name,
                fee: money(insurancePolicy.fee),
              })}
            </h3>
            <p className="mt-1.5 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
              {insurancePolicy.coverageSummary}
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[0.9375rem]">
              <Checkbox
                checked={insurance}
                onCheckedChange={(checked) => setInsurance(checked === true)}
                className="mt-0.5"
              />
              <span>
                {t('bookingSteps.concessions.addCover', { name: insurancePolicy.name })}
              </span>
            </label>
            <DemoNote className="mt-3">{t('bookingSteps.concessions.coverNote')}</DemoNote>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 5 — GUEST DETAILS
   ══════════════════════════════════════════════════════════════════════ */

const guestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please give the name the booking is for.')
    .max(80, 'That is longer than we can print on a ticket.'),
  email: z
    .string()
    .trim()
    .min(1, 'We need an email to put on the booking.')
    .email('That does not look like an email address.'),
  phone: z
    .string()
    .trim()
    .min(6, 'A mobile number helps the house reach you on the day.')
    .max(20, 'That is longer than a phone number should be.')
    .regex(/^[\d\s+()-]+$/, 'Digits, spaces, and + ( ) - only.'),
  note: z.string().trim().max(400, 'Please keep the note under 400 characters.').optional(),
});

export function GuestStep({ onValid }: { onValid: (guest: GuestDetails | null) => void }) {
  const { t } = useTranslation();
  const guest = useBooking((s) => s.guest);

  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof guestSchema>>({
    resolver: zodResolver(guestSchema),
    mode: 'onBlur',
    defaultValues: {
      name: guest?.name ?? '',
      email: guest?.email ?? '',
      phone: guest?.phone ?? '',
      note: guest?.note ?? '',
    },
  });

  const values = watch();

  useEffect(() => {
    const parsed = guestSchema.safeParse(values);
    onValid(
      parsed.success
        ? {
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone,
            note: parsed.data.note ?? '',
          }
        : null,
    );
    // `onValid` is stable at the call site; watching values is the intent here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, values.email, values.phone, values.note, isValid]);

  return (
    <div className="space-y-8">
      <div>
        <RuleHeading as="h2" className="mb-2">
          {t('bookingSteps.guest.heading')}
        </RuleHeading>
        <p className="max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          {t('bookingSteps.guest.lede')}
        </p>
      </div>

      <form className="max-w-xl space-y-5" noValidate>
        <Field
          label={t('bookingSteps.guest.name')}
          htmlFor="guest-name"
          error={errors.name?.message}
        >
          <Input
            id="guest-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>

        <Field
          label={t('bookingSteps.guest.email')}
          htmlFor="guest-email"
          error={errors.email?.message}
          hint={t('bookingSteps.guest.emailHint')}
        >
          <Input
            id="guest-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>

        <Field
          label={t('bookingSteps.guest.phone')}
          htmlFor="guest-phone"
          error={errors.phone?.message}
        >
          <Input
            id="guest-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </Field>

        <Field
          label={t('bookingSteps.guest.note')}
          htmlFor="guest-note"
          optional
          error={errors.note?.message}
          hint={t('bookingSteps.guest.noteHint')}
        >
          <Textarea id="guest-note" rows={3} {...register('note')} />
        </Field>
      </form>

      <DemoNote tone="loud">{t('bookingSteps.guest.privacy')}</DemoNote>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 6 — PAYMENT SIMULATION
   ══════════════════════════════════════════════════════════════════════ */

const paymentMethods: Array<{
  id: PaymentMethodId;
  label: string;
  blurb: string;
  icon: typeof CreditCard;
}> = [
  {
    id: 'card',
    label: 'Credit or debit card',
    blurb: 'The usual route. In a real build this would hand off to a payment provider.',
    icon: CreditCard,
  },
  {
    id: 'mfs',
    label: 'Mobile financial service',
    blurb: 'A mobile wallet payment, confirmed in the wallet app rather than here.',
    icon: Smartphone,
  },
  {
    id: 'net-banking',
    label: 'Internet banking',
    blurb: 'A direct bank transfer, authorised in your bank’s own app.',
    icon: Landmark,
  },
  {
    id: 'gift-card',
    label: 'GrandPlex gift card',
    blurb: 'Redeem a gift card balance against the booking.',
    icon: Gift,
  },
  {
    id: 'counter',
    label: 'Pay at the counter',
    blurb: 'Hold the seats and pay when you arrive. Held until 20 minutes before the screening.',
    icon: Banknote,
  },
];

export function PaymentStep({ quote }: { quote: Quote }) {
  const { t } = useTranslation();
  const paymentMethod = useBooking((s) => s.paymentMethod);
  const setPaymentMethod = useBooking((s) => s.setPaymentMethod);

  return (
    <div className="space-y-8">
      <div>
        <RuleHeading as="h2" className="mb-2">
          {t('bookingSteps.payment.heading')}
        </RuleHeading>
        <p className="max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          {t('bookingSteps.payment.lede')}
        </p>
      </div>

      <div
        className="flex items-start gap-3 border-2 border-accent bg-signal-wash/50 px-4 py-4"
        role="note"
      >
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="font-semibold">{t('bookingSteps.payment.warningTitle')}</p>
          <p className="mt-1 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
            {t('bookingSteps.payment.warningBody')}
          </p>
        </div>
      </div>

      <RadioGroup
        value={paymentMethod ?? ''}
        onValueChange={(value) => setPaymentMethod(value as PaymentMethodId)}
        aria-label={t('bookingSteps.payment.method')}
        className="gap-3"
      >
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const selected = paymentMethod === method.id;
          return (
            <label
              key={method.id}
              className={cn(
                'flex cursor-pointer items-start gap-3.5 border p-4 transition-colors',
                selected
                  ? 'border-content bg-content/[0.04]'
                  : 'border-hairline-strong hover:border-content/50',
              )}
            >
              <RadioGroupItem value={method.id} id={`pay-${method.id}`} className="mt-0.5" />
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-content-muted" />
              <span className="min-w-0">
                <span className="block font-semibold">{method.label}</span>
                <span className="mt-0.5 block text-[0.875rem] leading-6 text-content-muted">
                  {method.blurb}
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>

      <div className="edge bg-surface-raised p-5">
        <h3 className="eyebrow mb-3">{t('bookingSteps.payment.amountHeading')}</h3>
        <p className="index-mark text-[2.75rem]">{money(quote.total)}</p>
        <p className="mt-2 text-[0.8125rem] text-content-muted">
          {quote.insuranceFee > 0
            ? t('bookingSteps.payment.includingCover', {
                fee: money(quote.bookingFee),
                cover: money(quote.insuranceFee),
                name: insurancePolicy.name,
              })
            : t('bookingSteps.payment.including', { fee: money(quote.bookingFee) })}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP 7 — REVIEW
   ══════════════════════════════════════════════════════════════════════ */

export function ReviewStep({
  movie,
  showtime,
  quote,
  onEdit,
}: {
  movie: Movie;
  showtime: Showtime;
  quote: Quote;
  onEdit: (step: 'session' | 'tickets' | 'seats' | 'concessions' | 'guest' | 'payment') => void;
}) {
  const { t } = useTranslation();
  const f = useFormatters();
  const guest = useBooking((s) => s.guest);
  const paymentMethod = useBooking((s) => s.paymentMethod);
  const insurance = useBooking((s) => s.insurance);
  const seatIds = useBooking((s) => s.seatIds);
  const duplicateAcknowledged = useBooking((s) => s.duplicateAcknowledged);
  const acknowledgeDuplicate = useBooking((s) => s.acknowledgeDuplicate);
  const bookings = useBookings((s) => s.bookings);

  const cinema = cinemaById.get(showtime.cinemaId);
  const screen = screenFor(showtime);
  const method = paymentMethods.find((m) => m.id === paymentMethod);

  const duplicate = useMemo(
    () =>
      guest
        ? findDuplicate(bookings, {
            movieId: movie.id,
            cinemaId: showtime.cinemaId,
            date: showtime.date,
            time: showtime.time,
            email: guest.email,
          })
        : null,
    [bookings, guest, movie.id, showtime],
  );

  const categoryTally = quote.seatLines.reduce<Record<string, number>>((acc, line) => {
    acc[line.category] = (acc[line.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <RuleHeading as="h2">{t('bookingSteps.review.heading')}</RuleHeading>

      {/* ── Duplicate warning ──────────────────────────────────────── */}
      {duplicate ? (
        <div className="border-2 border-accent bg-signal-wash/40 p-5" role="alert">
          <div className="flex items-start gap-3">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <h3 className="font-display text-[1.25rem] uppercase leading-none">
                {t('bookingSteps.review.duplicateTitle')}
              </h3>
              <p className="mt-1.5 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
                <Trans
                  i18nKey="bookingSteps.review.duplicateBody"
                  values={{
                    reference: duplicate.booking.reference,
                    reasons: duplicate.reasons.join(', '),
                  }}
                  components={{
                    ref: (
                      <Link
                        to={`/booking-confirmation/${duplicate.booking.reference}`}
                        className="numeral font-semibold text-content underline underline-offset-4"
                      />
                    ),
                  }}
                />
              </p>
              <p className="mt-2 text-[0.8125rem] leading-6 text-content-muted">
                {t('bookingSteps.review.duplicateScope')}
              </p>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[0.9375rem] font-medium">
                <Checkbox
                  checked={duplicateAcknowledged}
                  onCheckedChange={(checked) => acknowledgeDuplicate(checked === true)}
                  className="mt-0.5"
                />
                <span>{t('bookingSteps.review.duplicateAcknowledge')}</span>
              </label>

              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={`/booking-confirmation/${duplicate.booking.reference}`}>
                  {t('bookingSteps.review.duplicateReview')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Screening ──────────────────────────────────────────────── */}
      <section className="edge p-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="eyebrow">{t('bookingSteps.review.theScreening')}</h3>
          <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('session')}>
            {t('bookingSteps.review.change')}
          </Button>
        </div>
        <p className="font-display text-[1.5rem] uppercase leading-none">{movie.title}</p>
        <dl className="mt-3">
          <DataRow label={t('bookingSteps.session.cinema')}>{cinema?.name}</DataRow>
          <DataRow label={t('bookingSteps.session.screen')}>{screen?.name}</DataRow>
          {/* Was `toLocaleDateString('en-GB')`, which pinned the review step's
              date to English however the rest of the page was set. The shared
              formatter follows the active locale and its numeral system. */}
          <DataRow label={t('confirmation.field.date')}>
            {f.date(showtime.date, 'full')}
          </DataRow>
          <DataRow label={t('confirmation.field.time')}>
            {displayTime(showtime.time)}
            {' · '}
            {t('confirmation.endsAbout', {
              time: displayTime(timeFromMinutes(screeningEndMinutes(showtime))),
            })}
          </DataRow>
          <DataRow label={t('bookingSteps.session.format')}>
            {formatLabels[showtime.format]}
          </DataRow>
          <DataRow label={t('bookingSteps.session.certificate')}>
            {certificates[movie.certificate].label}
          </DataRow>
        </dl>
        {showtime.accessibility.length ? (
          <div className="mt-3 border-t border-hairline pt-3">
            <p className="eyebrow mb-2">Access at this screening</p>
            <AccessibilityChips features={showtime.accessibility} />
          </div>
        ) : null}
      </section>

      {/* ── Seats & tickets ────────────────────────────────────────── */}
      <section className="edge p-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="eyebrow">{t('bookingSteps.review.seatsAndTickets')}</h3>
          <div className="flex gap-3">
            <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('tickets')}>
              {t('bookingSteps.review.ticketsLink')}
            </Button>
            <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('seats')}>
              {t('bookingSteps.review.seatsLink')}
            </Button>
          </div>
        </div>
        <dl>
          <DataRow label={t('bookingSteps.review.seats')}>{seatRanges(seatIds)}</DataRow>
          {Object.entries(categoryTally).map(([category, count]) => {
            const rule = ticketCategories.find((c) => c.id === (category as TicketCategory));
            return (
              <DataRow key={category} label={`${rule?.label ?? category} × ${count}`}>
                {money(
                  quote.seatLines
                    .filter((line) => line.category === category)
                    .reduce((sum, line) => sum + line.price, 0),
                )}
              </DataRow>
            );
          })}
          {quote.categorySavings > 0 ? (
            <DataRow label={t('bookingSteps.tickets.categoryDiscount')}>
              − {money(quote.categorySavings)}
            </DataRow>
          ) : null}
          {quote.matineeSavings > 0 ? (
            <DataRow label={t('bookingSteps.tickets.beforeThree')}>
              − {money(quote.matineeSavings)}
            </DataRow>
          ) : null}
          <DataRow label={t('bookingSteps.review.ticketSubtotal')} emphasis>
            {money(quote.ticketSubtotal)}
          </DataRow>
        </dl>
      </section>

      {/* ── Add-ons ────────────────────────────────────────────────── */}
      <section className="edge p-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="eyebrow">{t('bookingSteps.review.addOns')}</h3>
          <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('concessions')}>
            {t('bookingSteps.review.change')}
          </Button>
        </div>
        {quote.concessionLines.length === 0 && !insurance ? (
          <p className="text-[0.9375rem] text-content-muted">
            {t('bookingSteps.review.nothingAdded')}
          </p>
        ) : (
          <dl>
            {quote.concessionLines.map((line) => (
              <DataRow key={line.itemId} label={`${line.name} × ${line.quantity}`}>
                {money(line.total)}
              </DataRow>
            ))}
            {quote.concessionSavings > 0 ? (
              <DataRow label={t('bookingSteps.review.familyOfFour')}>
                − {money(quote.concessionSavings)}
              </DataRow>
            ) : null}
            {insurance ? (
              <DataRow label={insurancePolicy.name}>{money(quote.insuranceFee)}</DataRow>
            ) : null}
          </dl>
        )}
      </section>

      {/* ── Guest & payment ────────────────────────────────────────── */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="edge p-5">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="eyebrow">{t('bookingSteps.review.bookedFor')}</h3>
            <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('guest')}>
              {t('bookingSteps.review.change')}
            </Button>
          </div>
          {guest ? (
            <div className="space-y-1 text-[0.9375rem]">
              <p className="font-semibold">{guest.name}</p>
              <p className="break-all text-content-muted">{guest.email}</p>
              <p className="numeral text-content-muted">{guest.phone}</p>
              {guest.note ? (
                <p className="mt-2 border-t border-hairline pt-2 text-[0.875rem] leading-6 text-content-muted">
                  {guest.note}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[0.9375rem] text-danger">Details still needed.</p>
          )}
        </div>

        <div className="edge p-5">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="eyebrow">Payment</h3>
            <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('payment')}>
              {t('bookingSteps.review.change')}
            </Button>
          </div>
          <p className="text-[0.9375rem] font-semibold">
            {method?.label ?? t('bookingSteps.review.notChosen')}
          </p>
          <p className="mt-1 text-[0.875rem] leading-6 text-content-muted">
            {t('bookingSteps.review.paymentNote')}
          </p>
        </div>
      </section>

      {/* ── Total ──────────────────────────────────────────────────── */}
      <section className="border-2 border-content p-5">
        <dl>
          <DataRow label={t('bookingSteps.review.ticketsLink')}>
            {money(quote.ticketSubtotal)}
          </DataRow>
          <DataRow label={t('bookingSteps.review.addOns')}>
            {money(quote.concessionSubtotal)}
          </DataRow>
          {insurance ? <DataRow label={insurancePolicy.name}>{money(quote.insuranceFee)}</DataRow> : null}
          <DataRow
            label={t('bookingSteps.tickets.bookingFeeLine', {
              fee: money(20),
              count: quote.seatCount,
            })}
          >
            {money(quote.bookingFee)}
          </DataRow>
        </dl>
        <div className="mt-3 flex items-baseline justify-between gap-6 border-t-2 border-content pt-3">
          <p className="font-display text-[1.375rem] uppercase leading-none">
            {t('bookingSteps.review.total')}
          </p>
          <p className="index-mark text-[2.5rem]">{money(quote.total)}</p>
        </div>
        <p className="mt-2 text-[0.8125rem] text-content-muted">
          {t('bookingSteps.review.totalNote')}
        </p>
      </section>
    </div>
  );
}

export { paymentMethods };
