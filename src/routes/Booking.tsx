import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { AnimatedNumber, stepTransition, useMotionPreferences } from '@/motion';
import { spring } from '@/motion/tokens';
import { Button } from '@/components/ui/button';
import { DemoNote } from '@/components/ui/misc';
import { Announcer, DataRow } from '@/components/common';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay';
import {
  ConcessionsStep,
  GuestStep,
  PaymentStep,
  ReviewStep,
  SeatsStep,
  SessionStep,
  TicketsStep,
  paymentMethods,
} from '@/components/booking/steps';
import { NotFound } from './NotFound';
import {
  bookingSteps,
  nextStep,
  previousStep,
  stepIndex,
  stepLabels,
  useBooking,
  type BookingStep,
  type GuestDetails,
} from '@/store/booking';
import { useBookings, makeReference } from '@/store/bookings';
import { usePreferences } from '@/store/preferences';
import { getMovie, cinemaById, formatLabels, screenFor } from '@/data';
import { getShowtime, seatMapFor } from '@/data/schedule';
import { checkAgeCategories, quoteBooking, totalTickets } from '@/lib/bookingMath';
import { displayTime, formatRuntime } from '@/lib/datetime';
import { money, pluralise, seatRanges } from '@/lib/format';
import { useAnnouncer } from '@/hooks';
import { cn } from '@/lib/utils';

export function Booking() {
  const { movieSlug } = useParams<{ movieSlug: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { message, announce } = useAnnouncer();
  const motionPrefs = useMotionPreferences();

  const movie = movieSlug ? getMovie(movieSlug) : null;

  const booking = useBooking();
  const addBooking = useBookings((s) => s.add);
  const setPreferredCinema = usePreferences((s) => s.setCinema);

  const [guestValid, setGuestValid] = useState<GuestDetails | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const showtime = booking.showtimeId ? getShowtime(booking.showtimeId) : null;

  /* ── Seed from the URL, once ────────────────────────────────────── */
  useEffect(() => {
    if (!movie || seeded) return;
    setSeeded(true);
    booking.startFor(movie.id);

    const showtimeParam = params.get('showtime');
    if (showtimeParam) {
      const target = getShowtime(showtimeParam);
      if (target && target.movieId === movie.id) {
        booking.setCinema(target.cinemaId);
        booking.setDate(target.date);
        booking.setShowtime(target.id);
        setPreferredCinema(target.cinemaId, false);
        booking.setStep('tickets');
        return;
      }
    }
    if (!booking.cinemaId) booking.setCinema(usePreferences.getState().cinemaId);
    // Seeding must run once per mount; the store is intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie, seeded, params]);

  const quote = useMemo(
    () =>
      quoteBooking({
        showtime,
        seatIds: booking.seatIds,
        counts: booking.counts,
        seatCategories: booking.seatCategories,
        concessions: booking.concessions,
        insurance: booking.insurance,
      }),
    [showtime, booking.seatIds, booking.counts, booking.seatCategories, booking.concessions, booking.insurance],
  );

  /* ── A seat can go while you are elsewhere in the flow ──────────── */
  const staleSeats = useMemo(() => {
    if (!showtime || booking.seatIds.length === 0) return [];
    const map = new Map(
      seatMapFor(showtime).flatMap((row) => row.seats.map((seat) => [seat.id, seat.status] as const)),
    );
    return booking.seatIds.filter((id) => map.get(id) !== 'available');
  }, [showtime, booking.seatIds]);

  const ticketCount = totalTickets(booking.counts);
  const ageCheck = movie ? checkAgeCategories(movie.certificate, booking.counts) : null;

  /* ── What blocks each step ──────────────────────────────────────── */
  const blocker = useMemo((): string | null => {
    switch (booking.step) {
      case 'session':
        return showtime ? null : 'Choose a cinema, a day and a screening to continue.';
      case 'tickets':
        if (ticketCount === 0) return 'Add at least one ticket to continue.';
        if (ageCheck?.blocking) return 'Change the child ticket — this film is rated 18 and over.';
        if (ageCheck && !ageCheck.ok && !booking.ageAcknowledged) {
          return 'Confirm that an adult will accompany the under-age tickets.';
        }
        return null;
      case 'seats':
        if (booking.seatIds.length !== ticketCount) {
          return `Choose ${pluralise(ticketCount, 'seat')} to match your tickets.`;
        }
        if (staleSeats.length > 0) return 'One of your seats is no longer available.';
        return null;
      case 'concessions':
        return null;
      case 'guest':
        return guestValid ? null : 'Fill in your name, email and mobile number to continue.';
      case 'payment':
        return booking.paymentMethod ? null : 'Choose how you would pay to continue.';
      case 'review':
        if (!guestValid) return 'Your details are incomplete.';
        return null;
      default:
        return null;
    }
  }, [booking.step, booking.ageAcknowledged, booking.paymentMethod, booking.seatIds.length, showtime, ticketCount, ageCheck, guestValid, staleSeats.length]);

  // Which way the customer is travelling, so the step transition can express
  // "onward" and "back" differently.
  const [stepDirection, setStepDirection] = useState(1);

  const goTo = useCallback(
    (step: BookingStep) => {
      setStepDirection(stepIndex(step) >= stepIndex(booking.step) ? 1 : -1);
      booking.setStep(step);
      announce(`Step ${stepIndex(step) + 1} of ${bookingSteps.length}: ${stepLabels[step]}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [booking, announce],
  );

  /** Persist the guest details when moving on from the details step. */
  useEffect(() => {
    if (guestValid) booking.setGuest(guestValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestValid]);

  function confirm() {
    if (!movie || !showtime || !guestValid) return;
    const cinema = cinemaById.get(showtime.cinemaId);
    const screen = screenFor(showtime);
    if (!cinema || !screen) return;

    const createdAt = new Date().toISOString();
    const reference = makeReference({
      showtimeId: showtime.id,
      seatIds: booking.seatIds,
      email: guestValid.email,
      createdAt,
    });

    addBooking({
      reference,
      createdAt,
      movieId: movie.id,
      movieTitle: movie.title,
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      screenId: screen.id,
      screenName: screen.name,
      showtimeId: showtime.id,
      date: showtime.date,
      time: showtime.time,
      format: showtime.format,
      seats: quote.seatLines.map((line) => ({
        seatId: line.seatId,
        seatClass: line.seatClass,
        category: line.category,
        price: line.price,
      })),
      concessions: quote.concessionLines.map((line) => ({
        itemId: line.itemId,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.total,
      })),
      ticketSubtotal: quote.ticketSubtotal,
      concessionSubtotal: quote.concessionSubtotal,
      bookingFee: quote.bookingFee,
      insuranceFee: quote.insuranceFee,
      total: quote.total,
      insurance: booking.insurance,
      paymentMethod: booking.paymentMethod ?? 'card',
      guestName: guestValid.name,
      guestEmail: guestValid.email,
      guestPhone: guestValid.phone,
      guestNote: guestValid.note,
    });

    booking.reset();
    navigate(`/booking-confirmation/${reference}`);
  }

  if (!movie) return <NotFound />;

  const index = stepIndex(booking.step);
  const isLast = booking.step === 'review';
  const cinema = showtime ? cinemaById.get(showtime.cinemaId) : null;
  const method = paymentMethods.find((m) => m.id === booking.paymentMethod);

  return (
    <div className="shell pb-28 lg:pb-12">
      <Announcer message={message} />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline py-6">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Booking · guest checkout</p>
          <h1 className="font-display text-[1.75rem] leading-tight tracking-[-0.025em] sm:text-[2.25rem]">
            {movie.title}
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
          <RotateCcw aria-hidden="true" />
          Start over
        </Button>
      </div>

      {/* ── The transport ─────────────────────────────────────────────
          A strip of film moving through a gate: perforations above, one frame
          per step, and a marker that travels rather than jumps. On small
          screens it collapses to a legible progress strip instead of a row of
          unreadable dots. */}
      <nav aria-label="Booking steps" className="border-b border-hairline py-4">
        {/* Perforation rail */}
        <div aria-hidden="true" className="mb-2.5 flex gap-[7px]">
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              className={cn(
                'block h-[5px] w-[5px] shrink-0 rounded-[1px] transition-colors duration-[--dur-base]',
                i / 28 <= (index + 1) / bookingSteps.length ? 'bg-marigold' : 'bg-hairline-strong',
              )}
            />
          ))}
        </div>

        {/* Desktop: every frame, with a travelling marker */}
        <ol className="hidden items-stretch gap-1 sm:flex">
          {bookingSteps.map((step, i) => {
            const done = i < index;
            const current = i === index;
            const reachable = i <= index;
            return (
              <li key={step} className="min-w-0 flex-1">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && goTo(step)}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'group relative flex w-full flex-col items-start gap-1.5 px-1 pb-2.5 pt-1 text-left',
                    reachable ? '' : 'cursor-not-allowed',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'numeral grid size-5 shrink-0 place-items-center border text-[0.625rem] transition-colors duration-[--dur-fast]',
                        current
                          ? 'border-content bg-content text-surface'
                          : done
                            ? 'border-content bg-transparent text-content'
                            : 'border-hairline-strong text-content-faint',
                      )}
                    >
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        'truncate text-[0.8125rem] font-semibold transition-colors duration-[--dur-fast]',
                        current
                          ? 'text-content'
                          : done
                            ? 'text-content-muted group-hover:text-content'
                            : 'text-content-faint',
                      )}
                    >
                      {stepLabels[step]}
                    </span>
                  </span>

                  {/* The gate. One marker, shared across all steps. */}
                  <span aria-hidden="true" className="relative block h-[2px] w-full bg-hairline">
                    {current ? (
                      <m.span
                        layoutId="booking-transport"
                        className="absolute inset-0 bg-marigold"
                        transition={motionPrefs.reduced ? { duration: 0 } : spring.marker}
                      />
                    ) : done ? (
                      <span className="absolute inset-0 bg-content/35" />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Mobile: the same information, readable */}
        <div className="sm:hidden">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-content">
              <span className="numeral text-content-muted">
                {index + 1}/{bookingSteps.length}
              </span>{' '}
              {stepLabels[booking.step]}
            </p>
            {index < bookingSteps.length - 1 ? (
              <p className="text-[0.75rem] text-content-faint">
                Next: {stepLabels[bookingSteps[index + 1]!]}
              </p>
            ) : null}
          </div>
          <div aria-hidden="true" className="mt-2 h-[2px] w-full bg-hairline">
            <m.span
              className="block h-full bg-marigold"
              initial={false}
              animate={{ width: `${((index + 1) / bookingSteps.length) * 100}%` }}
              transition={motionPrefs.reduced ? { duration: 0 } : spring.marker}
            />
          </div>
        </div>
      </nav>

      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        {/* ── Step body ──────────────────────────────────────────── */}
        <div className="min-w-0">
          {staleSeats.length > 0 && booking.step !== 'seats' ? (
            <div className="mb-6 border-2 border-danger bg-danger-wash/50 p-4" role="alert">
              <p className="font-semibold">
                {pluralise(staleSeats.length, 'seat')} you chose{' '}
                {staleSeats.length === 1 ? 'is' : 'are'} no longer available
              </p>
              <p className="mt-1 text-[0.9375rem] leading-6 text-content-muted">
                {seatRanges(staleSeats)} went while you were elsewhere in the flow. Go back to the
                seat map and pick again.
              </p>
              <Button size="sm" className="mt-3" onClick={() => goTo('seats')}>
                Back to seats
              </Button>
            </div>
          ) : null}

          {/* Steps enter from the direction you are travelling and leave the
              opposite way, so forward and back feel different. `mode="wait"`
              keeps only one step mounted, and form state lives in the store,
              so nothing valid is lost across the transition. */}
          <AnimatePresence mode="wait" custom={stepDirection} initial={false}>
            <m.div
              key={booking.step}
              custom={stepDirection}
              variants={motionPrefs.reduced ? undefined : stepTransition}
              initial={motionPrefs.reduced ? false : 'initial'}
              animate="animate"
              exit={motionPrefs.reduced ? undefined : 'exit'}
            >
              {booking.step === 'session' ? <SessionStep movie={movie} showtime={showtime} /> : null}
              {booking.step === 'tickets' && showtime ? (
                <TicketsStep movie={movie} showtime={showtime} quote={quote} />
              ) : null}
              {booking.step === 'seats' && showtime ? (
                <SeatsStep showtime={showtime} onAnnounce={announce} />
              ) : null}
              {booking.step === 'concessions' ? <ConcessionsStep quote={quote} /> : null}
              {booking.step === 'guest' ? <GuestStep onValid={setGuestValid} /> : null}
              {booking.step === 'payment' ? <PaymentStep quote={quote} /> : null}
              {booking.step === 'review' && showtime ? (
                <ReviewStep movie={movie} showtime={showtime} quote={quote} onEdit={goTo} />
              ) : null}
            </m.div>
          </AnimatePresence>

          {/* ── Navigation ───────────────────────────────────────── */}
          <div className="mt-10 hidden items-center justify-between gap-4 border-t border-hairline pt-6 lg:flex">
            <Button
              variant="outline"
              onClick={() => goTo(previousStep(booking.step))}
              disabled={index === 0}
            >
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>

            <div className="flex items-center gap-4">
              {blocker ? (
                <p className="text-[0.8125rem] text-content-muted" role="status">
                  {blocker}
                </p>
              ) : null}
              {isLast ? (
                <Button
                  size="lg"
                  disabled={Boolean(blocker)}
                  onClick={confirm}
                  className="min-w-52"
                >
                  Confirm booking · {money(quote.total)}
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={Boolean(blocker)}
                  onClick={() => goTo(nextStep(booking.step))}
                  className="min-w-40"
                >
                  Continue
                  <ArrowRight aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Summary ────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <section
            aria-labelledby="booking-summary"
            className="border-2 border-ink bg-paper-raised p-5"
          >
            <h2 id="booking-summary" className="font-display text-xl leading-none">
              Your booking
            </h2>

            {showtime && cinema ? (
              <div className="mt-4 space-y-1 border-b border-hairline pb-4 text-[0.9375rem]">
                <p className="font-semibold">{movie.title}</p>
                <p className="text-content-muted">
                  {cinema.shortName} · {screenFor(showtime)?.name}
                </p>
                <p className="numeral text-content-muted">
                  {new Date(showtime.date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {' · '}
                  {displayTime(showtime.time)}
                </p>
                <p className="text-content-muted">
                  {formatLabels[showtime.format]} · {formatRuntime(movie.runtimeMinutes)}
                </p>
              </div>
            ) : (
              <p className="mt-4 border-b border-hairline pb-4 text-[0.9375rem] text-content-muted">
                No screening chosen yet.
              </p>
            )}

            <dl className="mt-4">
              {ticketCount > 0 ? (
                <DataRow label={pluralise(ticketCount, 'ticket')}>
                  {money(quote.ticketSubtotal)}
                </DataRow>
              ) : null}
              {booking.seatIds.length > 0 ? (
                <DataRow label="Seats">{seatRanges(booking.seatIds)}</DataRow>
              ) : null}
              {quote.concessionSubtotal > 0 ? (
                <DataRow label="Add-ons">{money(quote.concessionSubtotal)}</DataRow>
              ) : null}
              {quote.insuranceFee > 0 ? (
                <DataRow label="Ticket Cover">{money(quote.insuranceFee)}</DataRow>
              ) : null}
              {quote.bookingFee > 0 ? (
                <DataRow label="Booking fee">{money(quote.bookingFee)}</DataRow>
              ) : null}
              {method ? <DataRow label="Payment">{method.label}</DataRow> : null}
              <DataRow label="Total" emphasis>
                <AnimatedNumber value={quote.total} format={(n) => money(n)} />
              </DataRow>
            </dl>

            <DemoNote className="mt-4">
              Sample prices. Nothing is charged and no payment details are ever requested.
            </DemoNote>
          </section>
        </aside>
      </div>

      {/* ── Sticky mobile action bar ─────────────────────────────── */}
      <div
        data-print="hide"
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper-raised/96 backdrop-blur-[6px] lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, var(--safe-b))' }}
      >
        <div className="shell flex items-center gap-3 pt-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goTo(previousStep(booking.step))}
            disabled={index === 0}
            aria-label="Back a step"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="numeral text-lg font-semibold leading-none">
              <AnimatedNumber value={quote.total} format={(n) => money(n)} />
            </p>
            <p className="truncate text-[0.6875rem] text-content-muted">
              {blocker ?? `${stepLabels[booking.step]} · step ${index + 1} of ${bookingSteps.length}`}
            </p>
          </div>

          {isLast ? (
            <Button disabled={Boolean(blocker)} onClick={confirm} className="shrink-0">
              Confirm
            </Button>
          ) : (
            <Button
              disabled={Boolean(blocker)}
              onClick={() => goTo(nextStep(booking.step))}
              className="shrink-0"
            >
              Continue
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Start over ───────────────────────────────────────────── */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start this booking again?</DialogTitle>
            <DialogDescription>
              Your screening, tickets, seats and add-ons for {movie.title} will be cleared. Bookings
              you have already completed are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Keep going
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                booking.reset();
                booking.startFor(movie.id);
                setGuestValid(null);
                setConfirmReset(false);
                announce('Booking cleared. Back to the first step.');
              }}
            >
              Start over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-10">
        <DemoNote tone="loud">
          A demonstration booking flow. Seat availability is generated locally and is not live, no
          payment is taken, and your completed booking is written only to this browser. See{' '}
          <Link to="/about" className="font-semibold underline underline-offset-4">
            about this build
          </Link>
          .
        </DemoNote>
      </div>
    </div>
  );
}
