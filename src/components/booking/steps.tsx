import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Banknote,
  CreditCard,
  Gift,
  Landmark,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
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
      <div>
        <RuleHeading as="h2" className="mb-4">
          Which cinema
        </RuleHeading>
        <Select value={cinemaId ?? ''} onValueChange={setCinema}>
          <SelectTrigger aria-label="Cinema" className="max-w-sm">
            <SelectValue placeholder="Choose a cinema" />
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
        <RuleHeading as="h2" className="mb-4">
          Which day
        </RuleHeading>
        <DateStrip value={activeDate} onChange={setDate} />
      </div>

      <div>
        <RuleHeading as="h2" className="mb-4">
          Which screening
        </RuleHeading>

        {!cinemaId ? (
          <p className="text-[0.9375rem] text-content-muted">Choose a cinema first.</p>
        ) : options.length === 0 ? (
          <EmptyState
            title="Nothing scheduled that day"
            variant="schedule"
            body={`${movie.title} is not on at ${cinemaById.get(cinemaId)?.name ?? 'this cinema'} on the day you picked. Try another date above, or another house.`}
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
        <div className="border border-hairline-strong bg-surface-raised p-5">
          <h3 className="eyebrow mb-3">Your screening</h3>
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            <DataRow label="Screen">{screen.name}</DataRow>
            <DataRow label="Format">{formatLabels[showtime.format]}</DataRow>
            <DataRow label="Language">{languageLabels[showtime.language]}</DataRow>
            <DataRow label="Subtitles">
              {showtime.subtitles.length
                ? showtime.subtitles.map((s) => languageLabels[s]).join(', ')
                : 'None'}
            </DataRow>
            <DataRow label="Running time">{formatRuntime(movie.runtimeMinutes)}</DataRow>
            <DataRow label="Certificate">{certificates[movie.certificate].label}</DataRow>
          </dl>
          {showtime.accessibility.length ? (
            <div className="mt-3 border-t border-hairline pt-3">
              <p className="eyebrow mb-2">Access at this screening</p>
              <AccessibilityChips features={showtime.accessibility} />
            </div>
          ) : (
            <p className="mt-3 border-t border-hairline pt-3 text-[0.8125rem] text-content-muted">
              No additional access provisions are listed for this particular screening. The house's
              permanent facilities still apply — see the{' '}
              <Link
                to={`/cinemas/${cinemaById.get(showtime.cinemaId)?.slug ?? ''}`}
                className="font-semibold underline underline-offset-4"
              >
                cinema page
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
          How many, and who for
        </RuleHeading>
        <p className="mb-5 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          Pick a category for each person. We never ask for a date of birth — the category is enough
          to price the ticket, and the door checks ID where it needs to.
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
            ageCheck.ok ? 'border-hairline-strong bg-surface-sunken/50' : 'border-marigold bg-marigold-wash/50',
          )}
          role={ageCheck.ok ? undefined : 'alert'}
        >
          <TriangleAlert
            aria-hidden="true"
            className={cn('mt-0.5 size-5 shrink-0', ageCheck.ok ? 'text-content-muted' : 'text-marigold')}
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
                Change the child ticket to another category to continue.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Running cost ───────────────────────────────────────────── */}
      {total > 0 ? (
        <div className="border border-hairline-strong bg-surface-raised p-5">
          <h3 className="eyebrow mb-3">What that costs</h3>
          <p className="mb-3 text-[0.875rem] leading-6 text-content-muted">
            Seats have not been chosen yet, so this uses the cheapest seat class still free at this
            screening. It will settle once you pick seats.
          </p>
          <dl>
            <DataRow label={`${pluralise(total, 'ticket')} · estimated`}>
              {money(quote.ticketSubtotal)}
            </DataRow>
            {quote.categorySavings > 0 ? (
              <DataRow label="Age-category discount">− {money(quote.categorySavings)}</DataRow>
            ) : null}
            {showtime.matinee ? (
              <DataRow label="Before three">− {money(quote.matineeSavings || 60 * total)}</DataRow>
            ) : null}
            <DataRow label={`Booking fee · ${money(20)} × ${total}`}>{money(20 * total)}</DataRow>
          </dl>
        </div>
      ) : null}

      <DemoNote>
        Sample pricing. Nothing is charged at any point in this demonstration.
      </DemoNote>
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
          Choose your seats
        </RuleHeading>
        <p className="max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          {limit === 0
            ? 'Go back a step and choose how many tickets you need first.'
            : `Pick ${pluralise(limit, 'seat')} to match your tickets. Use the arrow keys to move around the map and Enter or Space to choose a seat.`}
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
          Anything from the counter
        </RuleHeading>
        <p className="mb-5 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          Entirely optional — you can go straight on. Anything you add is paid for with your tickets
          and collected at the counter on the day.
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
                <span className="ml-2 text-ok">Family of Four saved {money(quote.concessionSavings)}</span>
              ) : null}
            </p>
            <Button variant="ghost" size="sm" onClick={clearConcessions}>
              Clear add-ons
            </Button>
          </div>
        ) : null}
      </div>

      {/* ── Ticket Cover ───────────────────────────────────────────── */}
      <div className="border border-hairline-strong p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg leading-tight">
              {insurancePolicy.name} · {money(insurancePolicy.fee)} per booking
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
              <span>Add {insurancePolicy.name} to this booking</span>
            </label>
            <DemoNote className="mt-3">
              A sample product for this demonstration. No policy is issued, no premium is taken, and
              no claim can actually be made — Max can walk you through what a claim would involve.
            </DemoNote>
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
          Who is the booking for
        </RuleHeading>
        <p className="max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          Four fields, and only because a booking needs a name on it. There is no account to create,
          no password to choose, and nothing to verify by email.
        </p>
      </div>

      <form className="max-w-xl space-y-5" noValidate>
        <Field label="Full name" htmlFor="guest-name" error={errors.name?.message}>
          <Input
            id="guest-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>

        <Field
          label="Email"
          htmlFor="guest-email"
          error={errors.email?.message}
          hint="Your booking reference is shown on screen — this is only kept on the booking record in this browser."
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

        <Field label="Mobile number" htmlFor="guest-phone" error={errors.phone?.message}>
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
          label="Anything the house should know"
          htmlFor="guest-note"
          optional
          error={errors.note?.message}
          hint="Access needs, a wheelchair transfer, a birthday — anything useful on the night."
        >
          <Textarea id="guest-note" rows={3} {...register('note')} />
        </Field>
      </form>

      <DemoNote tone="loud">
        Your details stay in this browser tab and are written onto the local booking record when you
        confirm. They are never transmitted, because there is nowhere to transmit them to.
      </DemoNote>
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
  const paymentMethod = useBooking((s) => s.paymentMethod);
  const setPaymentMethod = useBooking((s) => s.setPaymentMethod);

  return (
    <div className="space-y-8">
      <div>
        <RuleHeading as="h2" className="mb-2">
          How you would pay
        </RuleHeading>
        <p className="max-w-prose text-[0.9375rem] leading-7 text-content-muted">
          Choose a method and carry on. This step records which kind of payment you would have used —
          nothing more happens.
        </p>
      </div>

      <div
        className="flex items-start gap-3 border-2 border-marigold bg-marigold-wash/50 px-4 py-4"
        role="note"
      >
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marigold" />
        <div>
          <p className="font-semibold">This is a demonstration. No payment will be taken.</p>
          <p className="mt-1 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
            There is no payment form on this page and never will be. This site does not ask for card
            numbers, account details, PINs, OTPs or passwords, and it has no server to send them to
            even if it did.
          </p>
        </div>
      </div>

      <RadioGroup
        value={paymentMethod ?? ''}
        onValueChange={(value) => setPaymentMethod(value as PaymentMethodId)}
        aria-label="Payment method"
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

      <div className="border border-hairline-strong bg-surface-raised p-5">
        <h3 className="eyebrow mb-3">Amount that would be charged</h3>
        <p className="numeral font-display text-3xl leading-none">{money(quote.total)}</p>
        <p className="mt-2 text-[0.8125rem] text-content-muted">
          Including the {money(quote.bookingFee)} booking fee
          {quote.insuranceFee > 0 ? ` and ${money(quote.insuranceFee)} Ticket Cover` : ''}. No other
          charges.
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
      <RuleHeading as="h2">Check it over</RuleHeading>

      {/* ── Duplicate warning ──────────────────────────────────────── */}
      {duplicate ? (
        <div className="border-2 border-marigold bg-marigold-wash/40 p-5" role="alert">
          <div className="flex items-start gap-3">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marigold" />
            <div className="min-w-0">
              <h3 className="font-display text-lg leading-tight">
                You may already have this booking
              </h3>
              <p className="mt-1.5 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
                Booking{' '}
                <Link
                  to={`/booking-confirmation/${duplicate.booking.reference}`}
                  className="font-mono font-semibold text-content underline underline-offset-4"
                >
                  {duplicate.booking.reference}
                </Link>{' '}
                in this browser has {duplicate.reasons.join(', ')}. Buying a second set of tickets may
                be exactly what you intend — more people joining, or a separate group — so this is a
                check, not a block.
              </p>
              <p className="mt-2 text-[0.8125rem] leading-6 text-content-muted">
                Only this browser's history was checked. Bookings made on another device or in another
                browser cannot be seen from here.
              </p>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[0.9375rem] font-medium">
                <Checkbox
                  checked={duplicateAcknowledged}
                  onCheckedChange={(checked) => acknowledgeDuplicate(checked === true)}
                  className="mt-0.5"
                />
                <span>Continue with another booking anyway</span>
              </label>

              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to={`/booking-confirmation/${duplicate.booking.reference}`}>
                  Review the existing booking
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Screening ──────────────────────────────────────────────── */}
      <section className="border border-hairline-strong p-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="eyebrow">The screening</h3>
          <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('session')}>
            Change
          </Button>
        </div>
        <p className="font-display text-2xl leading-tight">{movie.title}</p>
        <dl className="mt-3">
          <DataRow label="Cinema">{cinema?.name}</DataRow>
          <DataRow label="Screen">{screen?.name}</DataRow>
          <DataRow label="Date">
            {new Date(showtime.date).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </DataRow>
          <DataRow label="Time">
            {displayTime(showtime.time)} · ends ~
            {displayTime(timeFromMinutes(screeningEndMinutes(showtime)))}
          </DataRow>
          <DataRow label="Format">{formatLabels[showtime.format]}</DataRow>
          <DataRow label="Certificate">{certificates[movie.certificate].label}</DataRow>
        </dl>
        {showtime.accessibility.length ? (
          <div className="mt-3 border-t border-hairline pt-3">
            <p className="eyebrow mb-2">Access at this screening</p>
            <AccessibilityChips features={showtime.accessibility} />
          </div>
        ) : null}
      </section>

      {/* ── Seats & tickets ────────────────────────────────────────── */}
      <section className="border border-hairline-strong p-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="eyebrow">Seats and tickets</h3>
          <div className="flex gap-3">
            <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('tickets')}>
              Tickets
            </Button>
            <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('seats')}>
              Seats
            </Button>
          </div>
        </div>
        <dl>
          <DataRow label="Seats">{seatRanges(seatIds)}</DataRow>
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
            <DataRow label="Age-category discount">− {money(quote.categorySavings)}</DataRow>
          ) : null}
          {quote.matineeSavings > 0 ? (
            <DataRow label="Before three">− {money(quote.matineeSavings)}</DataRow>
          ) : null}
          <DataRow label="Ticket subtotal" emphasis>
            {money(quote.ticketSubtotal)}
          </DataRow>
        </dl>
      </section>

      {/* ── Add-ons ────────────────────────────────────────────────── */}
      <section className="border border-hairline-strong p-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="eyebrow">Add-ons</h3>
          <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('concessions')}>
            Change
          </Button>
        </div>
        {quote.concessionLines.length === 0 && !insurance ? (
          <p className="text-[0.9375rem] text-content-muted">Nothing added.</p>
        ) : (
          <dl>
            {quote.concessionLines.map((line) => (
              <DataRow key={line.itemId} label={`${line.name} × ${line.quantity}`}>
                {money(line.total)}
              </DataRow>
            ))}
            {quote.concessionSavings > 0 ? (
              <DataRow label="Family of Four">− {money(quote.concessionSavings)}</DataRow>
            ) : null}
            {insurance ? (
              <DataRow label={insurancePolicy.name}>{money(quote.insuranceFee)}</DataRow>
            ) : null}
          </dl>
        )}
      </section>

      {/* ── Guest & payment ────────────────────────────────────────── */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="border border-hairline-strong p-5">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="eyebrow">Booked for</h3>
            <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('guest')}>
              Change
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

        <div className="border border-hairline-strong p-5">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="eyebrow">Payment</h3>
            <Button variant="link" size="sm" className="px-0" onClick={() => onEdit('payment')}>
              Change
            </Button>
          </div>
          <p className="text-[0.9375rem] font-semibold">{method?.label ?? 'Not chosen'}</p>
          <p className="mt-1 text-[0.875rem] leading-6 text-content-muted">
            Recorded as a category only. No payment is taken and no payment details were requested.
          </p>
        </div>
      </section>

      {/* ── Total ──────────────────────────────────────────────────── */}
      <section className="border-2 border-content p-5">
        <dl>
          <DataRow label="Tickets">{money(quote.ticketSubtotal)}</DataRow>
          <DataRow label="Add-ons">{money(quote.concessionSubtotal)}</DataRow>
          {insurance ? <DataRow label={insurancePolicy.name}>{money(quote.insuranceFee)}</DataRow> : null}
          <DataRow label={`Booking fee · ${money(20)} × ${quote.seatCount}`}>
            {money(quote.bookingFee)}
          </DataRow>
        </dl>
        <div className="mt-3 flex items-baseline justify-between gap-6 border-t-2 border-content pt-3">
          <p className="font-display text-xl">Total</p>
          <p className="numeral font-display text-3xl leading-none">{money(quote.total)}</p>
        </div>
        <p className="mt-2 text-[0.8125rem] text-content-muted">
          That is everything. No service charge, no card fee, nothing added at the end.
        </p>
      </section>
    </div>
  );
}

export { paymentMethods };
