import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { m } from 'framer-motion';
import { CalendarPlus, Home, MessageSquare, Printer, Ticket } from 'lucide-react';
import { useMotionPreferences } from '@/motion';
import { ease } from '@/motion/tokens';
import { Button } from '@/components/ui/button';
import { Badge, DemoNote } from '@/components/ui/misc';
import { DataRow } from '@/components/common';
import { useBookings } from '@/store/bookings';
import { cinemaById, formatLabels, movieById } from '@/data';
import { insurancePolicy } from '@/data/policies';
import { getShowtime, screeningEndMinutes } from '@/data/schedule';
import { ticketCategories } from '@/data/pricing';
import {
  displayTime,
  longDayLabel,
  minutesFromTime,
  screeningStart,
  timeFromMinutes,
} from '@/lib/datetime';
import { money, pluralise, seatRanges } from '@/lib/format';
import { buildIcs, downloadUrl, mapUrl } from '@/lib/external';

export function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [, setParams] = useSearchParams();
  const motionPrefs = useMotionPreferences();
  const bookings = useBookings((s) => s.bookings);
  const booking = bookings.find((b) => b.reference === bookingId);

  const movie = booking ? movieById.get(booking.movieId) : null;
  const cinema = booking ? cinemaById.get(booking.cinemaId) : null;
  const showtime = booking ? getShowtime(booking.showtimeId) : null;

  const endTime = useMemo(() => {
    if (!showtime) return null;
    return timeFromMinutes(screeningEndMinutes(showtime));
  }, [showtime]);

  if (!booking) {
    return (
      <div className="shell py-16">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Not found on this device</p>
          <h1 className="font-display text-[2.5rem] leading-[1] tracking-[-0.03em] sm:text-[3.5rem]">
            We have no booking with that reference.
          </h1>
          <p className="mt-5 text-[1.0625rem] leading-7 text-ink-muted">
            Bookings in this demonstration are stored in the browser that made them. If you booked in
            a different browser, on another device, or since cleared your browsing data, there is
            nothing here to show — and no server to look it up on.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/bookings">See bookings on this device</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/showtimes">Book a screening</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // The ticket renders from the booking's own snapshot. The live catalogue only
  // *enhances* it — a Bengali title, the venue's trailer policy, a map link.
  // A completed booking must survive the programme changing underneath it, so
  // a missing movie or cinema record degrades the extras rather than the page.
  // This used to `return <NotFound />` here, which threw away a real ticket.

  const categoryTally = booking.seats.reduce<Record<string, number>>((acc, seat) => {
    acc[seat.category] = (acc[seat.category] ?? 0) + 1;
    return acc;
  }, {});

  const arriveBy = timeFromMinutes(minutesFromTime(booking.time) - 20);

  function addToCalendar() {
    if (!booking) return;
    const start = screeningStart(booking.date, booking.time);
    const duration = endTime
      ? minutesFromTime(endTime) - minutesFromTime(booking.time)
      : 150;

    // Snapshot first, catalogue second — the calendar file must still be
    // correct for a venue that has since left the programme.
    const venueName = cinema?.shortName ?? booking.cinemaName;
    const venueAddress = cinema?.addressLines.join(', ') ?? booking.cinemaAddress ?? booking.cinemaName;

    const url = buildIcs({
      uid: booking.reference,
      title: `${booking.movieTitle} — ${venueName}`,
      description: [
        `Booking ${booking.reference}`,
        `Seats ${seatRanges(booking.seats.map((s) => s.seatId))} in ${booking.screenName}`,
        `Doors: aim to arrive by ${displayTime(arriveBy)}.`,
        '',
        'Nokshi Cinemas demonstration booking — not a valid ticket.',
      ].join('\n'),
      location: venueAddress,
      start,
      durationMinutes: Math.max(60, duration),
    });
    downloadUrl(url, `${booking.reference}.ics`);
  }

  return (
    <div className="shell py-10">
      {/* ── Confirmation heading ─────────────────────────────────── */}
      <div className="max-w-2xl" data-print="hide">
        <p className="eyebrow mb-3">Booking complete</p>
        <h1 className="font-display text-[2.25rem] leading-[1.02] tracking-[-0.03em] sm:text-[3rem]">
          You're booked for {booking.movieTitle}.
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-7 text-ink-muted">
          Your reference is{' '}
          <span className="font-mono font-semibold tracking-[0.06em] text-ink">
            {booking.reference}
          </span>
          . It is saved in this browser and shown on the ticket below.
        </p>
      </div>

      {/* ── The ticket ─────────────────────────────────────────────
          A reveal rather than an appearance: the stock settles, a projection
          light passes once across it, and the QR fades in only after the
          surface is stable. Under reduced motion the finished ticket is
          simply there, and the print layout is unaffected either way. */}
      <m.div
        data-print="page"
        className="mt-8 max-w-3xl"
        initial={motionPrefs.reduced ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={motionPrefs.reduced ? { duration: 0 } : { duration: 0.55, ease: ease.entrance }}
      >
        <div className="auditorium relative overflow-hidden border-2 border-ink">
          {/* One pass of projected light across the stock. */}
          {!motionPrefs.reduced ? (
            <m.span
              aria-hidden="true"
              data-print="hide"
              className="pointer-events-none absolute inset-y-0 z-20 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-projector-lit/20 to-transparent"
              initial={{ left: '-40%' }}
              animate={{ left: '130%' }}
              transition={{ duration: 1.15, ease: ease.projection, delay: 0.45 }}
            />
          ) : null}

          {/* Perforated top edge */}
          <div aria-hidden="true" className="sprocket-t h-3 bg-ink" />

          <div className="grid gap-0 sm:grid-cols-[1fr_auto]">
            <div className="p-6 sm:p-8">
              <p className="eyebrow mb-3 text-house-muted">Nokshi Cinemas · admit {booking.seats.length}</p>

              <h2 className="font-display text-[2rem] leading-[1.02] tracking-[-0.03em] text-house-ink">
                {booking.movieTitle}
              </h2>
              {movie?.titleBn ? (
                <p lang="bn" className="mt-1 text-lg text-house-muted">
                  {movie.titleBn}
                </p>
              ) : null}

              <dl className="mt-6 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                <div className="border-b border-house-rule py-2.5">
                  <dt className="eyebrow mb-0.5 text-house-faint">Cinema</dt>
                  <dd className="text-house-ink">{booking.cinemaName}</dd>
                </div>
                <div className="border-b border-house-rule py-2.5">
                  <dt className="eyebrow mb-0.5 text-house-faint">Screen</dt>
                  <dd className="text-house-ink">
                    {booking.screenName} · {formatLabels[booking.format]}
                  </dd>
                </div>
                <div className="border-b border-house-rule py-2.5">
                  <dt className="eyebrow mb-0.5 text-house-faint">Date</dt>
                  <dd className="text-house-ink">{longDayLabel(booking.date)}</dd>
                </div>
                <div className="border-b border-house-rule py-2.5">
                  <dt className="eyebrow mb-0.5 text-house-faint">Time</dt>
                  <dd className="numeral text-house-ink">
                    {displayTime(booking.time)}
                    {endTime ? (
                      <span className="text-house-muted"> — ends ~{displayTime(endTime)}</span>
                    ) : null}
                  </dd>
                </div>
                <div className="border-b border-house-rule py-2.5">
                  <dt className="eyebrow mb-0.5 text-house-faint">Seats</dt>
                  <dd className="numeral text-house-ink">
                    {seatRanges(booking.seats.map((s) => s.seatId))}
                  </dd>
                </div>
                <div className="border-b border-house-rule py-2.5">
                  <dt className="eyebrow mb-0.5 text-house-faint">Tickets</dt>
                  <dd className="text-house-ink">
                    {Object.entries(categoryTally)
                      .map(([category, count]) => {
                        const rule = ticketCategories.find((c) => c.id === category);
                        return `${count} × ${rule?.label ?? category}`;
                      })
                      .join(', ')}
                  </dd>
                </div>
                <div className="border-b border-house-rule py-2.5">
                  <dt className="eyebrow mb-0.5 text-house-faint">Booked for</dt>
                  <dd className="text-house-ink">{booking.guestName}</dd>
                </div>
                <div className="border-b border-house-rule py-2.5">
                  <dt className="eyebrow mb-0.5 text-house-faint">Paid</dt>
                  <dd className="numeral text-house-ink">{money(booking.total)}</dd>
                </div>
              </dl>

              {booking.insurance ? (
                <Badge tone="ok" className="mt-4">
                  {insurancePolicy.name} included
                </Badge>
              ) : null}

              <p className="mt-6 text-[0.8125rem] leading-6 text-house-muted">
                Aim to be at the door by{' '}
                <span className="numeral font-semibold text-house-ink">{displayTime(arriveBy)}</span>.
                {cinema ? ` Trailers run ${cinema.trailerMinutes} minutes before the feature.` : ''}
              </p>
            </div>

            {/* Stub */}
            <div className="border-t border-dashed border-house-rule p-6 sm:border-l sm:border-t-0 sm:p-8">
              <m.div
                className="flex flex-col items-center"
                initial={motionPrefs.reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                  motionPrefs.reduced ? { duration: 0 } : { duration: 0.4, delay: 0.62 }
                }
              >
                <div className="bg-paper p-2.5">
                  <QRCodeSVG
                    value={booking.reference}
                    size={128}
                    level="M"
                    bgColor="#f4f1ea"
                    fgColor="#14161f"
                    title={`Booking reference ${booking.reference}`}
                  />
                </div>
                <p className="numeral mt-3 font-mono text-lg font-semibold tracking-[0.08em] text-house-ink">
                  {booking.reference}
                </p>
                <p className="mt-1 text-center text-[0.6875rem] leading-4 text-house-faint">
                  The code contains this reference and nothing else — no name, contact details or
                  payment information.
                </p>
                <p className="mt-4 border border-marigold px-2 py-1 text-center text-[0.625rem] font-bold uppercase tracking-[0.1em] text-marigold-lit">
                  Demonstration ticket
                  <span className="block font-normal normal-case tracking-normal">
                    Not valid for entry
                  </span>
                </p>
              </m.div>
            </div>
          </div>

          <div aria-hidden="true" className="sprocket-b h-3 bg-ink" />
        </div>
      </m.div>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div data-print="hide" className="mt-8 flex max-w-3xl flex-wrap gap-3">
        <Button onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          Print or save as PDF
        </Button>
        <Button variant="outline" onClick={addToCalendar}>
          <CalendarPlus aria-hidden="true" />
          Add to calendar
        </Button>
        <Button variant="outline" onClick={() => setParams({ max: 'open' })}>
          <MessageSquare aria-hidden="true" />
          Ask Max about this booking
        </Button>
      </div>

      {/* ── What next ────────────────────────────────────────────── */}
      <div data-print="hide" className="mt-12 grid max-w-4xl gap-8 sm:grid-cols-2">
        <section aria-labelledby="next-heading">
          <h2 id="next-heading" className="eyebrow mb-4 border-b border-hairline pb-2">
            On the day
          </h2>
          <ul className="space-y-3 text-[0.9375rem] leading-7 text-ink-muted">
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-[0.7em] block size-1.5 shrink-0 bg-marigold" />
              <span>
                Arrive by <span className="numeral font-semibold text-ink">{displayTime(arriveBy)}</span>{' '}
                for tickets, the counter and finding your seat.
              </span>
            </li>
            {cinema ? (
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[0.7em] block size-1.5 shrink-0 bg-marigold" />
                <span>{cinema.lateArrivalPolicy}</span>
              </li>
            ) : null}
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-[0.7em] block size-1.5 shrink-0 bg-marigold" />
              <span>
                {cinema ? (
                  <>
                    <a
                      href={mapUrl(cinema.mapQuery)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-ink underline underline-offset-4"
                    >
                      Directions to {cinema.shortName}
                    </a>{' '}
                    — {cinema.addressLines.join(', ')}.
                  </>
                ) : (
                  // The venue is no longer in the programme; the ticket still
                  // knows where it was, so print that rather than nothing.
                  <>
                    <span className="font-semibold text-ink">{booking.cinemaName}</span>
                    {booking.cinemaAddress ? ` — ${booking.cinemaAddress}.` : '.'}
                  </>
                )}
              </span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="cost-heading">
          <h2 id="cost-heading" className="eyebrow mb-4 border-b border-hairline pb-2">
            What you paid
          </h2>
          <dl>
            <DataRow label={pluralise(booking.seats.length, 'ticket')}>
              {money(booking.ticketSubtotal)}
            </DataRow>
            {booking.concessions.length > 0 ? (
              <DataRow label="Add-ons">{money(booking.concessionSubtotal)}</DataRow>
            ) : null}
            {booking.insurance ? (
              <DataRow label={insurancePolicy.name}>{money(booking.insuranceFee)}</DataRow>
            ) : null}
            <DataRow label="Booking fee">{money(booking.bookingFee)}</DataRow>
            <DataRow label="Total" emphasis>
              {money(booking.total)}
            </DataRow>
          </dl>
          <p className="mt-3 text-[0.8125rem] leading-6 text-ink-muted">
            No payment was actually taken. This is a record of what the booking would have cost.
          </p>
        </section>
      </div>

      <div data-print="hide" className="mt-10 flex max-w-3xl flex-wrap gap-3 border-t border-hairline pt-6">
        <Button asChild variant="outline">
          <Link to="/bookings">
            <Ticket aria-hidden="true" />
            My bookings
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/movies">Book another film</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">
            <Home aria-hidden="true" />
            Home
          </Link>
        </Button>
      </div>

      <DemoNote className="mt-8 max-w-3xl" tone="loud">
        This ticket is part of a demonstration build. No payment was taken, no cinema has been
        notified, and the ticket admits you nowhere. The booking exists only in this browser's local
        storage and will be lost if you clear your browsing data.
      </DemoNote>
    </div>
  );
}
