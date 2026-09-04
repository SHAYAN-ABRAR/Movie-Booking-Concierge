import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarPlus, Home, MessageSquare, Printer, Ticket as TicketIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoNote } from '@/components/ui/misc';
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
import { money, seatRanges } from '@/lib/format';
import { buildIcs, downloadUrl, mapUrl } from '@/lib/external';
import { Trans, useTranslation } from 'react-i18next';
import { brand } from '@/config/brand';
import { useFormatters } from '@/i18n/useFormatters';
import { Logo } from '@/components/brand/Logo';
import { ReceiptPrinter, useReceiptPrinterStage } from '@/components/receipt';
import { Ticket } from '@/components/receipt/Ticket';
import { MovieImageDecorative } from '@/components/visual/MovieImage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay';

export function BookingConfirmation() {
  const { t } = useTranslation();
  const f = useFormatters();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [, setParams] = useSearchParams();
  const bookings = useBookings((s) => s.bookings);
  const booking = bookings.find((b) => b.reference === bookingId);

  const movie = booking ? movieById.get(booking.movieId) : null;
  const cinema = booking ? cinemaById.get(booking.cinemaId) : null;
  const showtime = booking ? getShowtime(booking.showtimeId) : null;

  const endTime = useMemo(() => {
    if (!showtime) return null;
    return timeFromMinutes(screeningEndMinutes(showtime));
  }, [showtime]);

  /*
   * The printer runs once, for the customer who has just paid.
   *
   * Opening the same reference again from My Bookings, or reloading the page a
   * minute later, is not a purchase — reprinting the ticket every time would be
   * a toy rather than a confirmation. The booking's own `createdAt` is the
   * honest signal, and it survives a reload without needing router state.
   */
  const justBooked = useMemo(() => {
    if (!booking) return false;
    const age = Date.now() - new Date(booking.createdAt).getTime();
    return Number.isFinite(age) && age >= 0 && age < 15_000;
  }, [booking]);

  const stage = useReceiptPrinterStage(justBooked);
  const [ticketOpen, setTicketOpen] = useState(false);

  if (!booking) {
    return (
      <div className="shell py-16">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">{t('confirmation.notFoundEyebrow')}</p>
          <h1 className="font-display text-[2.5rem] leading-[1] tracking-[-0.03em] sm:text-[3.5rem]">
            {t('confirmation.notFoundTitle')}
          </h1>
          <p className="mt-5 text-[1.0625rem] leading-7 text-content-muted">
            {t('confirmation.notFoundBody')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/bookings">{t('confirmation.seeBookings')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/showtimes">{t('confirmation.bookAScreening')}</Link>
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
        'GrandPlex demonstration booking — not a valid ticket.',
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
        <p className="eyebrow mb-3 text-accent">{t('confirmation.complete')}</p>
        <h1
          className="font-display uppercase leading-[0.9] tracking-[-0.03em] [overflow-wrap:anywhere]"
          style={{ fontSize: 'clamp(2.25rem, 6vw, 4.25rem)' }}
        >
          {t('confirmation.bookedFor', { title: booking.movieTitle })}
        </h1>
        <p className="mt-5 text-[1.0625rem] leading-7 text-content-muted">
          <Trans
            i18nKey="confirmation.referenceNote"
            values={{ reference: booking.reference }}
            components={{
              1: <span className="numeral font-semibold tracking-[0.06em] text-content" />,
            }}
          />
        </p>
      </div>

      {/* ── The printer ────────────────────────────────────────────
          The ticket is printed rather than revealed. It is in the DOM,
          complete, from the first frame — the machine only moves it — so
          nothing here is gated behind an animation, and a customer who
          arrives from their bookings, reloads, or asks for reduced motion
          simply finds the paper already out. */}
      {/* The printer holds a fixed measure, so everything that follows a
          booking sits beside it rather than under it. Stacked below `lg`,
          where there is no room to put anything next to a receipt. */}
      <div className="mt-9 grid items-start gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-14">
        <div className="flex justify-center lg:block">
        <ReceiptPrinter.Root stage={stage}>
          <ReceiptPrinter.Machine aria-label={t('receipt.machineLabel')}>
            <ReceiptPrinter.Header>
              {/* `onDark` — the machine is charcoal in both themes, so the
                  wordmark cannot follow the page's ink. */}
              <Logo size="sm" onDark />
              <p className="eyebrow">{t('receipt.machineLabel')}</p>
            </ReceiptPrinter.Header>

            <ReceiptPrinter.Screen>
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate font-display text-[1.125rem] uppercase leading-none text-house-ink">
                  {booking.movieTitle}
                </p>
                <p className="numeral shrink-0 text-[0.9375rem] font-bold text-house-ink">
                  {money(booking.total)}
                </p>
              </div>
              <p className="numeral mt-1.5 truncate text-[0.75rem] text-house-muted">
                {booking.cinemaName} · {displayTime(booking.time)}
              </p>
              <div className="mt-3 border-t border-house-rule pt-3">
                <ReceiptPrinter.Status />
              </div>
            </ReceiptPrinter.Screen>
          </ReceiptPrinter.Machine>

          <ReceiptPrinter.Output>
            <ReceiptPrinter.Paper>
              <header className="text-center">
                <p className="font-display text-[1.5rem] uppercase leading-none tracking-[-0.02em]">
                  {brand.name}
                </p>
                <p className="mt-1.5 text-[0.625rem] uppercase tracking-[0.18em] text-ink/60">
                  {t('confirmation.admit', { brand: '', count: booking.seats.length })
                    .replace(/^\s*·\s*/, '')}
                </p>
              </header>

              <div aria-hidden="true" className="my-4 h-px bg-ink/25" />

              <h2 className="font-display text-[1.625rem] uppercase leading-[0.95] [overflow-wrap:anywhere]">
                {booking.movieTitle}
              </h2>
              {movie?.titleBn ? (
                <p lang="bn" className="mt-1 font-sans text-[0.9375rem] text-ink/70">
                  {movie.titleBn}
                </p>
              ) : null}

              <div aria-hidden="true" className="my-4 h-px bg-ink/25" />

              <dl className="space-y-2 text-[0.8125rem] leading-5">
                {[
                  { label: t('confirmation.field.cinema'), value: booking.cinemaName },
                  {
                    label: t('confirmation.field.screen'),
                    value: `${booking.screenName} · ${formatLabels[booking.format]}`,
                  },
                  { label: t('confirmation.field.date'), value: longDayLabel(booking.date) },
                  {
                    label: t('confirmation.field.time'),
                    value: endTime
                      ? `${displayTime(booking.time)} — ${t('confirmation.endsAbout', { time: displayTime(endTime) })}`
                      : displayTime(booking.time),
                  },
                  {
                    label: t('confirmation.field.seats'),
                    value: seatRanges(booking.seats.map((s) => s.seatId)),
                  },
                  {
                    label: t('confirmation.field.tickets'),
                    value: Object.entries(categoryTally)
                      .map(([category, count]) => {
                        const rule = ticketCategories.find((c) => c.id === category);
                        return `${count} × ${rule?.label ?? category}`;
                      })
                      .join(', '),
                  },
                  { label: t('confirmation.field.bookedFor'), value: booking.guestName },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4">
                    <dt className="shrink-0 text-[0.625rem] uppercase tracking-[0.14em] text-ink/55">
                      {row.label}
                    </dt>
                    <dd className="min-w-0 text-right font-semibold [overflow-wrap:anywhere]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {booking.insurance ? (
                <p className="mt-3 border border-ink/25 px-2 py-1 text-center text-[0.625rem] uppercase tracking-[0.12em]">
                  {t('confirmation.coverIncluded', { name: insurancePolicy.name })}
                </p>
              ) : null}

              <div aria-hidden="true" className="my-4 h-px bg-ink/25" />

              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[0.625rem] uppercase tracking-[0.14em] text-ink/55">
                  {t('confirmation.field.paid')}
                </p>
                <p className="text-[1.25rem] font-bold">{money(booking.total)}</p>
              </div>

              <div aria-hidden="true" className="my-4 h-px bg-ink/25" />

              {/* The code. Raw paper and ink, deliberately: a QR is only
                  scannable as dark modules on a light field. */}
              <div className="flex flex-col items-center">
                <QRCodeSVG
                  value={booking.reference}
                  size={132}
                  level="M"
                  bgColor="#F4F1EB"
                  fgColor="#111113"
                  title={t('confirmation.reference', { reference: booking.reference })}
                />
                <p className="mt-3 text-[1.0625rem] font-bold tracking-[0.14em]">
                  {booking.reference}
                </p>
                <p className="mt-2 max-w-[14rem] text-center text-[0.625rem] leading-4 text-ink/55">
                  {t('confirmation.qrNote')}
                </p>
              </div>

              <p className="mt-4 border-2 border-signal px-2 py-1.5 text-center text-[0.625rem] font-bold uppercase tracking-[0.12em] text-signal">
                {t('confirmation.demoTicket')}
                <span className="block font-normal tracking-normal">
                  {t('confirmation.notValid')}
                </span>
              </p>

              <p className="mt-4 text-[0.6875rem] leading-5 text-ink/70">
                {t('confirmation.doorBy', { time: displayTime(arriveBy) })}
                {cinema ? ` ${t('confirmation.trailersRun', { count: cinema.trailerMinutes })}` : ''}
              </p>

              <p
                aria-hidden="true"
                className="mt-5 text-center text-[0.5625rem] uppercase tracking-[0.2em] text-ink/45"
              >
                {t('receipt.tearOff')}
              </p>
            </ReceiptPrinter.Paper>
          </ReceiptPrinter.Output>
        </ReceiptPrinter.Root>
        </div>

        {/* ── Everything a customer does next ─────────────────────── */}
        <div className="min-w-0">
      {/* ── Actions ──────────────────────────────────────────────── */}
      <div data-print="hide" className="flex flex-wrap gap-3">
        {/* The one accented action on this page. The receipt is what the
            machine produced; this is the thing you actually hold. */}
        <Button variant="accent" onClick={() => setTicketOpen(true)}>
          <TicketIcon aria-hidden="true" />
          {t('confirmation.viewTicket')}
        </Button>
        <Button variant="primary" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          {t('confirmation.print')}
        </Button>
        <Button variant="outline" onClick={addToCalendar}>
          <CalendarPlus aria-hidden="true" />
          {t('confirmation.addToCalendar')}
        </Button>
        <Button variant="outline" onClick={() => setParams({ max: 'open' })}>
          <MessageSquare aria-hidden="true" />
          {t('confirmation.askMax')}
        </Button>
      </div>

      {/* ── What next ────────────────────────────────────────────── */}
      <div data-print="hide" className="mt-10 grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="next-heading">
          <h2 id="next-heading" className="eyebrow mb-4 border-b-2 border-content pb-2 text-content">
            {t('confirmation.onTheDay')}
          </h2>
          <ul className="space-y-3 text-[0.9375rem] leading-7 text-content-muted">
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-[0.7em] block size-1.5 shrink-0 bg-accent" />
              <span>{t('confirmation.arriveBy', { time: displayTime(arriveBy) })}</span>
            </li>
            {cinema ? (
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[0.7em] block size-1.5 shrink-0 bg-accent" />
                <span>{cinema.lateArrivalPolicy}</span>
              </li>
            ) : null}
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-[0.7em] block size-1.5 shrink-0 bg-accent" />
              <span>
                {cinema ? (
                  <>
                    <a
                      href={mapUrl(cinema.mapQuery)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-content underline underline-offset-4"
                    >
                      {t('confirmation.directionsTo', { cinema: cinema.shortName })}
                    </a>{' '}
                    — {cinema.addressLines.join(', ')}.
                  </>
                ) : (
                  // The venue is no longer in the programme; the ticket still
                  // knows where it was, so print that rather than nothing.
                  <>
                    <span className="font-semibold text-content">{booking.cinemaName}</span>
                    {booking.cinemaAddress ? ` — ${booking.cinemaAddress}.` : '.'}
                  </>
                )}
              </span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="cost-heading">
          <h2 id="cost-heading" className="eyebrow mb-4 border-b-2 border-content pb-2 text-content">
            {t('confirmation.whatYouPaid')}
          </h2>
          <dl>
            <DataRow label={t('confirmation.tickets', { count: booking.seats.length })}>
              {money(booking.ticketSubtotal)}
            </DataRow>
            {booking.concessions.length > 0 ? (
              <DataRow label={t('confirmation.addOns')}>{money(booking.concessionSubtotal)}</DataRow>
            ) : null}
            {booking.insurance ? (
              <DataRow label={insurancePolicy.name}>{money(booking.insuranceFee)}</DataRow>
            ) : null}
            <DataRow label={t('confirmation.bookingFee')}>{money(booking.bookingFee)}</DataRow>
            <DataRow label={t('confirmation.total')} emphasis>
              {money(booking.total)}
            </DataRow>
          </dl>
          <p className="mt-3 text-[0.8125rem] leading-6 text-content-muted">
            {t('confirmation.noPaymentNote')}
          </p>
        </section>
      </div>

      <div data-print="hide" className="slab mt-10 flex flex-wrap gap-3 pt-6">
        <Button asChild variant="outline">
          <Link to="/bookings">
            <TicketIcon aria-hidden="true" />
            {t('nav.myBookings')}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/movies">{t('confirmation.bookAnother')}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">
            <Home aria-hidden="true" />
            {t('errors.home')}
          </Link>
        </Button>
      </div>

      <DemoNote className="mt-8" tone="loud">
        {t('confirmation.demoNote')}
      </DemoNote>

      {/* ── The ticket ─────────────────────────────────────────── */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        {/* The printable deliverable is the receipt, not this. A dialog left
            open when someone reaches for Ctrl+P must not end up on the page. */}
        <DialogContent data-print="hide" className="max-w-[22rem] bg-surface">
          <DialogHeader>
            <DialogTitle>{t('confirmation.ticketDialogTitle')}</DialogTitle>
            <DialogDescription>{t('confirmation.ticketDialogBody')}</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center pb-1 pt-2">
            <Ticket
              aria-label={t('confirmation.ticketFor', { title: booking.movieTitle })}
              className="h-[30rem]"
              body={
                <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-3.5 p-5">
                  <div className="flex items-baseline justify-between gap-3 font-mono text-[0.5625rem] font-bold uppercase leading-none tracking-[0.12em]">
                    <span className="text-[var(--ticket-accent)]">{brand.name}</span>
                    <span className="opacity-60">{cinema?.city ?? booking.cinemaName}</span>
                  </div>

                  {/* The film, in its own colour. On a near-black card the
                      artwork is the brightest thing on the surface, which is
                      the whole point of putting it there. Falls back to the
                      sprocket rhythm when a film has left the programme and its
                      artwork with it. */}
                  <div className="relative -mx-5 min-h-0 overflow-hidden border-y border-[var(--ticket-ink)]/12">
                    {movie ? (
                      <MovieImageDecorative
                        movie={movie}
                        role="backdrop"
                        sizes="272px"
                        className="size-full aspect-auto!"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="size-full opacity-30"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 18px)',
                          backgroundSize: '100% 10px',
                          backgroundRepeat: 'repeat-y',
                        }}
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col justify-end">
                    <h3 className="font-display text-[1.75rem] uppercase leading-[0.86] [overflow-wrap:anywhere]">
                      {booking.movieTitle}
                    </h3>
                    <p className="mt-2 font-mono text-[0.625rem] leading-[1.5] opacity-65">
                      {booking.cinemaName}
                      <br />
                      {booking.screenName} · {formatLabels[booking.format]}
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                    {[
                      {
                        label: t('confirmation.field.date'),
                        // The long-form date overruns a half-width column on a
                        // 17rem card; the ticket gets the short form.
                        value: f.date(booking.date, 'weekdayDayMonth'),
                      },
                      { label: t('confirmation.field.time'), value: displayTime(booking.time) },
                      {
                        label: t('confirmation.field.seats'),
                        value: seatRanges(booking.seats.map((seat) => seat.seatId)),
                      },
                      { label: t('confirmation.field.paid'), value: money(booking.total) },
                    ].map((row) => (
                      <div key={row.label} className="flex min-w-0 flex-col gap-1">
                        <dt className="font-mono text-[0.5rem] font-bold uppercase leading-none tracking-[0.1em] opacity-55">
                          {row.label}
                        </dt>
                        <dd className="truncate font-mono text-[0.6875rem] font-bold leading-none">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              }
              stub={
                <div className="flex h-full flex-col justify-between gap-3 bg-black/[0.035] p-5 pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[0.5rem] font-bold uppercase leading-none tracking-[0.1em] opacity-55">
                        {t('confirmation.admitLabel')}
                      </span>
                      <strong className="font-display text-[1.375rem] uppercase leading-none text-[var(--ticket-accent)]">
                        {booking.seats.length}
                      </strong>
                    </div>
                    <div className="flex min-w-0 flex-col items-end gap-1.5 text-right">
                      <span className="font-mono text-[0.5rem] font-bold uppercase leading-none tracking-[0.1em] opacity-55">
                        {t('confirmation.referenceLabel')}
                      </span>
                      <strong className="font-mono text-[0.75rem] font-bold leading-none tracking-[0.04em] text-[var(--ticket-accent)]">
                        {booking.reference}
                      </strong>
                    </div>
                  </div>

                  {/* Decorative. The scannable code is the QR on the receipt,
                      and saying so is cheaper than implying this scans. */}
                  <div
                    aria-hidden="true"
                    className="h-5 w-full"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px, currentColor 4px 5px, transparent 5px 8px, currentColor 8px 12px, transparent 12px 14px)',
                    }}
                  />
                  <p className="sr-only">{t('confirmation.barcodeNote')}</p>
                </div>
              }
            />
          </div>

          <p className="text-center text-[0.6875rem] uppercase tracking-[0.12em] text-content-faint">
            {t('confirmation.demoTicket')} · {t('confirmation.notValid')}
          </p>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}
