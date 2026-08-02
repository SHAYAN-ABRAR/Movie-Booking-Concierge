import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff, Mail, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import {
  accessibilityLabels,
  cinemaById,
  concessionById,
  formatLabels,
  movieById,
} from '@/data';
import { getShowtime, availabilityFor, screenFor } from '@/data/schedule';
import { adultPriceRange } from '@/lib/bookingMath';
import { dayLabel, displayTime, formatRuntime } from '@/lib/datetime';
import { money, seatRanges } from '@/lib/format';
import { telUrl } from '@/lib/external';
import { useBookings } from '@/store/bookings';
import { useWatches, watchKindLabels } from '@/store/watches';
import type { MaxBlock } from '@/max/types';
import { cn } from '@/lib/utils';

/**
 * Typed response blocks.
 *
 * Max never renders raw HTML and never interpolates markup — every block is a
 * discriminated union member with its own component, so a reply can only ever
 * produce structures the application already knows how to draw.
 */

function ShowtimeLine({ id, showCinema }: { id: string; showCinema?: boolean }) {
  const showtime = getShowtime(id);
  if (!showtime) return null;

  const movie = movieById.get(showtime.movieId);
  const cinema = cinemaById.get(showtime.cinemaId);
  const availability = availabilityFor(showtime);
  const price = adultPriceRange(showtime);
  const soldOut = availability.level === 'sold-out';

  const body = (
    <>
      <span className="flex items-baseline justify-between gap-3">
        <span className="numeral text-base font-semibold leading-none">
          {displayTime(showtime.time)}
        </span>
        <span className="numeral shrink-0 text-[0.75rem] text-content-muted">
          {soldOut ? 'Sold out' : `from ${money(price.min)}`}
        </span>
      </span>
      <span className="mt-1 block truncate text-[0.8125rem] text-content-muted">
        {movie?.title}
        {showCinema && cinema ? ` · ${cinema.shortName}` : ''}
        {` · ${formatLabels[showtime.format]}`}
      </span>
      <span className="mt-0.5 block text-[0.6875rem] text-content-faint">
        {dayLabel(showtime.date)}
        {' · '}
        {screenFor(showtime)?.name}
        {!soldOut ? ` · ${availability.available} seats left` : ''}
        {showtime.accessibility.length
          ? ` · ${showtime.accessibility.map((a) => accessibilityLabels[a]).join(', ')}`
          : ''}
      </span>
    </>
  );

  if (soldOut) {
    return (
      <div className="block border border-hairline bg-surface-sunken/60 p-2.5 opacity-70">{body}</div>
    );
  }

  return (
    <Link
      to={`/booking/${movie?.slug ?? ''}?showtime=${encodeURIComponent(showtime.id)}`}
      className="block border border-hairline-strong bg-surface-raised p-2.5 transition-colors hover:border-content"
    >
      {body}
    </Link>
  );
}

function Spoiler({ summary, detail }: { summary: string; detail: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="border border-hairline-strong bg-surface-sunken/50 p-3">
      <p className="flex items-center gap-2 text-[0.8125rem] font-semibold">
        <EyeOff aria-hidden="true" className="size-4 shrink-0 text-content-muted" />
        {summary}
      </p>
      {revealed ? (
        <p className="mt-2 whitespace-pre-line text-[0.8125rem] leading-6 text-content-muted">
          {detail}
        </p>
      ) : (
        <>
          <p className="mt-1 text-[0.75rem] leading-5 text-content-faint">
            This describes what is on screen at those moments. Reveal only if you do not mind a
            light spoiler.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setRevealed(true)}>
            Reveal
          </Button>
        </>
      )}
    </div>
  );
}

export function MaxBlocks({ blocks }: { blocks: MaxBlock[] }) {
  const bookings = useBookings((s) => s.bookings);
  const watches = useWatches((s) => s.watches);
  const removeWatch = useWatches((s) => s.removeWatch);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'text':
            return (
              <p
                key={index}
                className={cn(
                  'text-[0.9375rem] leading-6',
                  block.tone === 'caution' ? 'border-l-2 border-warn pl-3 text-content' : '',
                )}
              >
                {block.text}
              </p>
            );

          case 'read-as':
            return block.chips.length === 0 ? null : (
              <div key={index}>
                <p className="eyebrow mb-1.5">I read that as</p>
                <ul className="flex flex-wrap gap-1">
                  {block.chips.map((chip) => (
                    <li key={chip.id}>
                      <Badge tone="outline" className="normal-case tracking-normal">
                        {chip.label}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            );

          case 'movies':
            return (
              <div key={index}>
                {block.note ? <p className="eyebrow mb-1.5">{block.note}</p> : null}
                <ul className="space-y-1.5">
                  {block.movieIds.map((id) => {
                    const movie = movieById.get(id);
                    if (!movie) return null;
                    return (
                      <li key={id}>
                        <Link
                          to={`/movies/${movie.slug}`}
                          className="block border border-hairline-strong bg-surface-raised p-2.5 transition-colors hover:border-content"
                        >
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="truncate font-display text-base leading-tight">
                              {movie.title}
                            </span>
                            <span className="numeral shrink-0 text-[0.75rem] text-content-muted">
                              {formatRuntime(movie.runtimeMinutes)}
                            </span>
                          </span>
                          <span className="mt-1 block truncate text-[0.8125rem] text-content-muted">
                            {movie.tagline}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );

          case 'showtimes':
            return (
              <div key={index}>
                {block.note ? <p className="eyebrow mb-1.5">{block.note}</p> : null}
                <ul className="space-y-1.5">
                  {block.showtimeIds.map((id) => (
                    <li key={id}>
                      <ShowtimeLine id={id} {...(block.showCinema ? { showCinema: true } : {})} />
                    </li>
                  ))}
                </ul>
              </div>
            );

          case 'seats': {
            return (
              <div key={index} className="border border-hairline-strong bg-surface-raised p-3">
                <p className="eyebrow mb-2">Suggested seats</p>
                <p className="numeral font-display text-xl leading-none">
                  {seatRanges(block.seatIds)}
                </p>
                <p className="numeral mt-1.5 text-[0.8125rem] text-content-muted">
                  {money(block.total)} before category discounts and the booking fee
                </p>
                {block.split ? (
                  <ul className="mt-2 space-y-0.5">
                    {block.groups.map((group) => (
                      <li key={group.row} className="text-[0.8125rem] text-content-muted">
                        Row {group.row}: {seatRanges(group.seatIds)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ul className="mt-2.5 space-y-1 border-t border-hairline pt-2.5">
                  {block.reasons.map((reason) => (
                    <li key={reason} className="flex gap-2 text-[0.8125rem] leading-5 text-content-muted">
                      <span aria-hidden="true" className="mt-[0.55em] block size-1 shrink-0 bg-marigold" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          case 'price':
            return (
              <div key={index} className="border border-hairline-strong bg-surface-raised p-3">
                <p className="eyebrow mb-2">{block.title}</p>
                <dl>
                  {block.lines.map((line) => (
                    <div
                      key={line.label}
                      className="flex items-baseline justify-between gap-4 border-b border-hairline py-1.5 text-[0.8125rem]"
                    >
                      <dt className="text-content-muted">{line.label}</dt>
                      <dd className="numeral shrink-0">
                        {line.amount < 0 ? `− ${money(Math.abs(line.amount))}` : money(line.amount)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 pt-2 font-semibold">
                    <dt>Total</dt>
                    <dd className="numeral">{money(block.total)}</dd>
                  </div>
                </dl>
                {block.footnote ? (
                  <p className="mt-2 text-[0.75rem] leading-5 text-content-faint">{block.footnote}</p>
                ) : null}
              </div>
            );

          case 'concessions':
            return (
              <div key={index}>
                {block.note ? <p className="eyebrow mb-1.5">{block.note}</p> : null}
                <ul className="space-y-1.5">
                  {block.itemIds.map((id) => {
                    const item = concessionById.get(id);
                    if (!item) return null;
                    return (
                      <li
                        key={id}
                        className="flex items-baseline justify-between gap-3 border border-hairline-strong bg-surface-raised p-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[0.9375rem] font-medium">
                            {item.name}
                            {item.size ? ` · ${item.size}` : ''}
                          </span>
                          <span className="block text-[0.75rem] text-content-faint">
                            Serves {item.serves}
                            {!item.allergenDataComplete ? ' · allergen list incomplete' : ''}
                          </span>
                        </span>
                        <span className="numeral shrink-0 text-[0.8125rem] font-semibold">
                          {money(item.price)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );

          case 'booking': {
            const record = bookings.find((b) => b.reference === block.reference);
            if (!record) return null;
            return (
              <Link
                key={index}
                to={`/booking-confirmation/${record.reference}`}
                className="block border border-hairline-strong bg-surface-raised p-3 transition-colors hover:border-content"
              >
                <p className="font-mono text-[0.8125rem] font-semibold tracking-[0.06em]">
                  {record.reference}
                </p>
                <p className="mt-1 font-display text-base leading-tight">{record.movieTitle}</p>
                <p className="numeral mt-1 text-[0.8125rem] text-content-muted">
                  {dayLabel(record.date)} {displayTime(record.time)} · {record.cinemaName}
                </p>
                <p className="numeral mt-0.5 text-[0.75rem] text-content-faint">
                  {seatRanges(record.seats.map((s) => s.seatId))} · {money(record.total)}
                </p>
              </Link>
            );
          }

          case 'watches':
            return (
              <ul key={index} className="space-y-1.5">
                {block.watchIds.map((id) => {
                  const watch = watches.find((w) => w.id === id);
                  if (!watch) return null;
                  const movie = movieById.get(watch.movieId);
                  return (
                    <li
                      key={id}
                      className="flex items-start justify-between gap-2 border border-hairline-strong bg-surface-raised p-2.5"
                    >
                      <span className="min-w-0">
                        <span className="eyebrow block">{watchKindLabels[watch.kind]}</span>
                        <span className="mt-0.5 block truncate text-[0.8125rem]">
                          {movie?.title} · {dayLabel(watch.date)} {displayTime(watch.time)}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove this alert"
                        onClick={() => removeWatch(id)}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            );

          case 'facts':
            return (
              <div key={index} className="border border-hairline-strong bg-surface-raised p-3">
                <p className="eyebrow mb-2">{block.title}</p>
                <dl className="space-y-1.5">
                  {block.rows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 text-[0.8125rem]">
                      <dt className="text-content-faint">{row.label}</dt>
                      <dd className="leading-5">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );

          case 'checklist':
            return (
              <div key={index} className="border border-hairline-strong bg-surface-raised p-3">
                <p className="eyebrow mb-2">{block.title}</p>
                <ol className="space-y-1.5">
                  {block.items.map((item, i) => (
                    <li key={item} className="flex gap-2.5 text-[0.8125rem] leading-5">
                      <span aria-hidden="true" className="numeral shrink-0 text-content-faint">
                        {i + 1}.
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
                {block.note ? (
                  <p className="mt-2.5 border-t border-hairline pt-2 text-[0.75rem] leading-5 text-content-faint">
                    {block.note}
                  </p>
                ) : null}
              </div>
            );

          case 'contact': {
            const cinema = block.cinemaId ? cinemaById.get(block.cinemaId) : null;
            const email = cinema?.email ?? block.email;
            const phone = cinema?.phone ?? block.phone;
            return (
              <div key={index} className="border border-hairline-strong bg-surface-raised p-3">
                <p className="eyebrow mb-2">{cinema ? cinema.name : 'Contact'}</p>
                <ul className="space-y-1.5 text-[0.8125rem]">
                  {phone ? (
                    <li>
                      <a href={telUrl(phone)} className="inline-flex items-center gap-2 underline underline-offset-4">
                        <Phone aria-hidden="true" className="size-3.5 shrink-0" />
                        {phone}
                      </a>
                    </li>
                  ) : null}
                  {email ? (
                    <li>
                      <a
                        href={`mailto:${email}`}
                        className="inline-flex items-center gap-2 break-all underline underline-offset-4"
                      >
                        <Mail aria-hidden="true" className="size-3.5 shrink-0" />
                        {email}
                      </a>
                    </li>
                  ) : null}
                </ul>
                {block.note ? (
                  <p className="mt-2 text-[0.75rem] leading-5 text-content-faint">{block.note}</p>
                ) : null}
              </div>
            );
          }

          case 'demo-note':
            return (
              <p
                key={index}
                className="flex items-start gap-2 border-t border-hairline pt-2 text-[0.75rem] leading-5 text-content-faint"
              >
                <span aria-hidden="true" className="mt-[0.45em] block size-1 shrink-0 bg-marigold" />
                <span>{block.text}</span>
              </p>
            );

          case 'spoiler':
            return <Spoiler key={index} summary={block.summary} detail={block.detail} />;

          default:
            return null;
        }
      })}
    </div>
  );
}
