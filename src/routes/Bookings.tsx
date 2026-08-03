import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Printer, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge, DemoNote } from '@/components/ui/misc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay';
import { useBookings, upcomingBookings, pastBookings } from '@/store/bookings';
import type { CompletedBooking } from '@/store/bookings';
import { cinemaById, formatLabels, movieById } from '@/data';
import { insurancePolicy } from '@/data/policies';
import { dayLabel, displayTime, longDayLabel, screeningStart } from '@/lib/datetime';
import { money, seatRanges } from '@/lib/format';
import { buildIcs, downloadUrl } from '@/lib/external';
import { screeningEndMinutes, getShowtime } from '@/data/schedule';
import { useTranslation } from 'react-i18next';

function BookingRow({
  booking,
  past,
  onRemove,
}: {
  booking: CompletedBooking;
  past: boolean;
  onRemove: (reference: string) => void;
}) {
  const { t } = useTranslation();
  const movie = movieById.get(booking.movieId);
  const cinema = cinemaById.get(booking.cinemaId);

  function addToCalendar() {
    const showtime = getShowtime(booking.showtimeId);
    const runtime = showtime ? screeningEndMinutes(showtime) : 0;
    const start = screeningStart(booking.date, booking.time);
    const durationMinutes = showtime
      ? runtime - Number(booking.time.slice(0, 2)) * 60 - Number(booking.time.slice(3))
      : 150;

    const url = buildIcs({
      uid: booking.reference,
      title: `${booking.movieTitle} — ${booking.cinemaName}`,
      description: [
        `Booking ${booking.reference}`,
        `Seats ${seatRanges(booking.seats.map((s) => s.seatId))} in ${booking.screenName}`,
        '',
        'Nokshi Cinemas demonstration booking — not a real ticket.',
      ].join('\n'),
      location: cinema ? cinema.addressLines.join(', ') : booking.cinemaName,
      start,
      durationMinutes: Math.max(60, durationMinutes),
    });
    downloadUrl(url, `${booking.reference}.ics`);
  }

  return (
    <article
      className={`border border-hairline-strong bg-surface-raised p-5 ${past ? 'opacity-75' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-1.5">
            {dayLabel(booking.date)} · {displayTime(booking.time)}
          </p>
          <h3 className="font-display text-2xl leading-tight tracking-[-0.02em]">
            {movie ? (
              <Link to={`/movies/${movie.slug}`} className="underline-offset-4 hover:underline">
                {booking.movieTitle}
              </Link>
            ) : (
              booking.movieTitle
            )}
          </h3>
          <p className="mt-1.5 text-[0.9375rem] text-content-muted">
            {cinema ? (
              <Link to={`/cinemas/${cinema.slug}`} className="underline-offset-4 hover:underline">
                {booking.cinemaName}
              </Link>
            ) : (
              booking.cinemaName
            )}
            <span aria-hidden="true"> · </span>
            {booking.screenName}
            <span aria-hidden="true"> · </span>
            {formatLabels[booking.format]}
          </p>
        </div>

        <div className="text-right">
          <p className="numeral font-mono text-lg font-semibold tracking-[0.06em]">
            {booking.reference}
          </p>
          <p className="numeral mt-0.5 text-sm text-content-muted">{money(booking.total)}</p>
          {booking.insurance ? (
            <Badge tone="ok" className="mt-1.5">
              {insurancePolicy.name}
            </Badge>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid gap-x-8 gap-y-2 border-t border-hairline pt-4 sm:grid-cols-3">
        <div>
          <dt className="eyebrow mb-0.5">Seats</dt>
          <dd className="numeral text-[0.9375rem]">
            {seatRanges(booking.seats.map((s) => s.seatId))}
          </dd>
        </div>
        <div>
          <dt className="eyebrow mb-0.5">Tickets</dt>
          <dd className="text-[0.9375rem]">
            {Object.entries(
              booking.seats.reduce<Record<string, number>>((acc, seat) => {
                acc[seat.category] = (acc[seat.category] ?? 0) + 1;
                return acc;
              }, {}),
            )
              .map(([category, count]) => `${count} ${category}`)
              .join(', ')}
          </dd>
        </div>
        <div>
          <dt className="eyebrow mb-0.5">Booked for</dt>
          <dd className="text-[0.9375rem]">{booking.guestName}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-4">
        <Button asChild size="sm">
          <Link to={`/booking-confirmation/${booking.reference}`}>
            <Printer aria-hidden="true" />
            {t('bookings.viewTicket')}
          </Link>
        </Button>
        {!past ? (
          <Button size="sm" variant="outline" onClick={addToCalendar}>
            <CalendarPlus aria-hidden="true" />
            {t('bookings.addToCalendar')}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-danger hover:bg-danger/10"
          onClick={() => onRemove(booking.reference)}
        >
          <Trash2 aria-hidden="true" />
          Remove
        </Button>
      </div>

      <p className="sr-only">Screening on {longDayLabel(booking.date)}.</p>
    </article>
  );
}

export function Bookings() {
  const { t } = useTranslation();
  const bookings = useBookings((s) => s.bookings);
  const remove = useBookings((s) => s.remove);
  const clear = useBookings((s) => s.clear);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const upcoming = upcomingBookings(bookings);
  const past = pastBookings(bookings);

  return (
    <div className="shell">
      <PageHeader
        eyebrow={t('bookings.eyebrow')}
        title={t('bookings.title')}
        lede={t('bookings.lede')}
        aside={
          bookings.length > 0 ? (
            <Button variant="outline" onClick={() => setConfirmClear(true)}>
              <Trash2 aria-hidden="true" />
              {t('bookings.clearHistory')}
            </Button>
          ) : undefined
        }
      />

      {bookings.length === 0 ? (
        <div className="py-10">
          <EmptyState
            title={t('bookings.emptyTitle')}
            variant="ticket-book"
            body={<p>{t('bookings.emptyBody')}</p>}
            action={
              <Button asChild>
                <Link to="/showtimes">{t('bookings.findScreening')}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-12 py-10">
          {upcoming.length > 0 ? (
            <section aria-labelledby="upcoming">
              <h2 id="upcoming" className="eyebrow mb-4 border-b border-hairline pb-2">
                Coming up · {upcoming.length}
              </h2>
              <ul className="space-y-5">
                {upcoming.map((booking) => (
                  <li key={booking.reference}>
                    <BookingRow booking={booking} past={false} onRemove={setPendingRemove} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section aria-labelledby="past">
              <h2 id="past" className="eyebrow mb-4 border-b border-hairline pb-2">
                Past · {past.length}
              </h2>
              <ul className="space-y-5">
                {past.map((booking) => (
                  <li key={booking.reference}>
                    <BookingRow booking={booking} past onRemove={setPendingRemove} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <DemoNote className="mb-10" tone="loud">
        {t('bookings.demoNote')}
      </DemoNote>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bookings.clearTitle')}</DialogTitle>
            <DialogDescription>
              {t('bookings.clearBody', { count: bookings.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>
              {t('bookings.keepThem')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clear();
                setConfirmClear(false);
              }}
            >
              {t('bookings.deleteEverything')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingRemove !== null} onOpenChange={(open) => !open && setPendingRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this booking?</DialogTitle>
            <DialogDescription>
              Booking {pendingRemove} will be deleted from this browser. You cannot get it back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (pendingRemove) remove(pendingRemove);
                setPendingRemove(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
