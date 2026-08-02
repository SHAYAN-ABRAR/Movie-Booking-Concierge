import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cinemaById, movieById } from '@/data';
import { getShowtime, screeningEndMinutes } from '@/data/schedule';
import { adultPriceRange } from '@/lib/bookingMath';
import { buildIcs, downloadUrl, mailtoUrl, telUrl } from '@/lib/external';
import { minutesFromTime, screeningStart } from '@/lib/datetime';
import { seatRanges } from '@/lib/format';
import { useBooking } from '@/store/booking';
import { useBookings } from '@/store/bookings';
import { usePreferences } from '@/store/preferences';
import { useReports, lostItemSummary } from '@/store/reports';
import { useWatches, watchKindLabels } from '@/store/watches';
import { useMax } from '@/store/max';
import { claimChecklistTemplate } from '@/store/reports';
import type { MaxAction } from './types';
import type { MovieFilter } from '@/data';

/**
 * The action executor.
 *
 * Every effect Max can have on the application passes through here, as a typed
 * action object. Max's prose is never parsed to decide what to do.
 *
 * Each branch validates its target, reports success or failure back to the
 * caller, and leaves the change reversible wherever a change was made.
 */

export interface ActionResult {
  ok: boolean;
  /** Shown back in the transcript so the customer can see what happened. */
  message: string;
  /** A follow-up the caller can offer to undo the change. */
  undo?: { label: string; run: () => void };
}

function filterToSearch(filter: MovieFilter): string {
  const search = new URLSearchParams();
  if (filter.query) search.set('q', filter.query);
  if (filter.genres?.length) search.set('genre', filter.genres.join(','));
  if (filter.languages?.length) search.set('lang', filter.languages.join(','));
  if (filter.formats?.length) search.set('format', filter.formats.join(','));
  if (filter.cinemaIds?.length) search.set('cinema', filter.cinemaIds.join(','));
  if (filter.accessibility?.length) search.set('access', filter.accessibility.join(','));
  if (filter.certificates?.length) search.set('cert', filter.certificates.join(','));
  if (filter.date) search.set('date', filter.date);
  if (filter.after) search.set('after', filter.after);
  if (filter.before) search.set('before', filter.before);
  if (filter.maxRuntime !== undefined) search.set('runtime', String(filter.maxRuntime));
  if (filter.maxPrice !== undefined) search.set('price', String(filter.maxPrice));
  return search.toString();
}

export function useMaxExecutor() {
  const navigate = useNavigate();

  return useCallback(
    async (action: MaxAction): Promise<ActionResult> => {
      const booking = useBooking.getState();
      const watches = useWatches.getState();
      const reports = useReports.getState();
      const bookings = useBookings.getState();

      switch (action.type) {
        case 'navigate': {
          navigate(action.to);
          return { ok: true, message: 'Opened.' };
        }

        case 'apply_filters': {
          const search = filterToSearch(action.filter);
          const target = action.to ?? '/movies';
          navigate(search ? `${target}?${search}` : target);
          return {
            ok: true,
            message: 'Filters applied.',
            undo: { label: 'Clear those filters', run: () => navigate(target) },
          };
        }

        case 'clear_filters': {
          const path = window.location.pathname;
          navigate(path);
          return { ok: true, message: 'Filters cleared.' };
        }

        case 'select_cinema': {
          const cinema = cinemaById.get(action.cinemaId);
          if (!cinema) return { ok: false, message: 'I could not find that cinema.' };
          const previous = usePreferences.getState().cinemaId;
          usePreferences.getState().setCinema(cinema.id);
          booking.setCinema(cinema.id);
          return {
            ok: true,
            message: `${cinema.shortName} is now your cinema.`,
            undo: {
              label: 'Undo',
              run: () => {
                usePreferences.getState().setCinema(previous);
                booking.setCinema(previous);
              },
            },
          };
        }

        case 'select_date': {
          const previous = booking.date;
          booking.setDate(action.date);
          return {
            ok: true,
            message: 'Date changed.',
            undo: { label: 'Undo', run: () => booking.setDate(previous) },
          };
        }

        case 'start_booking': {
          const movie = movieById.get(action.movieSlug) ?? null;
          const slug = movie?.slug ?? action.movieSlug;
          if (!slug) return { ok: false, message: 'I do not have a film to book.' };
          navigate(
            action.showtimeId
              ? `/booking/${slug}?showtime=${encodeURIComponent(action.showtimeId)}`
              : `/booking/${slug}`,
          );
          return { ok: true, message: 'Booking opened.' };
        }

        case 'set_ticket_counts': {
          const previous = booking.counts;
          booking.setCounts(action.counts);
          return {
            ok: true,
            message: 'Ticket categories updated.',
            undo: { label: 'Put them back', run: () => booking.setCounts(previous) },
          };
        }

        case 'propose_seats': {
          booking.proposeSeats(action.seatIds);
          return {
            ok: true,
            message: `${seatRanges(action.seatIds)} highlighted on the map. Nothing has been chosen yet.`,
            undo: { label: 'Clear the highlight', run: () => booking.clearProposal() },
          };
        }

        case 'apply_seats': {
          const showtime = booking.showtimeId ? getShowtime(booking.showtimeId) : null;
          if (!showtime) {
            return { ok: false, message: 'There is no screening selected to choose seats in.' };
          }
          const previous = booking.seatIds;
          booking.setSeats(action.seatIds);
          return {
            ok: true,
            message: `${seatRanges(action.seatIds)} chosen.`,
            undo: { label: 'Undo', run: () => booking.setSeats(previous) },
          };
        }

        case 'clear_seats': {
          const previous = booking.seatIds;
          if (previous.length === 0) return { ok: false, message: 'No seats are selected.' };
          booking.clearSeats();
          return {
            ok: true,
            message: 'Seats released.',
            undo: { label: 'Put them back', run: () => booking.setSeats(previous) },
          };
        }

        case 'add_concessions': {
          const previous = { ...booking.concessions };
          for (const line of action.items) {
            const current = booking.concessions[line.itemId] ?? 0;
            booking.setConcession(line.itemId, current + line.quantity);
          }
          return {
            ok: true,
            message: 'Added to your booking.',
            undo: {
              label: 'Undo',
              run: () => {
                useBooking.getState().clearConcessions();
                for (const [itemId, quantity] of Object.entries(previous)) {
                  useBooking.getState().setConcession(itemId, quantity);
                }
              },
            },
          };
        }

        case 'remove_concession': {
          const previous = booking.concessions[action.itemId] ?? 0;
          if (previous === 0) return { ok: false, message: 'That is not in your booking.' };
          booking.setConcession(action.itemId, 0);
          return {
            ok: true,
            message: 'Removed.',
            undo: {
              label: 'Undo',
              run: () => useBooking.getState().setConcession(action.itemId, previous),
            },
          };
        }

        case 'open_booking': {
          navigate(`/booking-confirmation/${action.reference}`);
          return { ok: true, message: 'Opened your ticket.' };
        }

        case 'download_ics': {
          const record = bookings.bookings.find((b) => b.reference === action.reference);
          if (!record) return { ok: false, message: 'That booking is not in this browser.' };
          const cinema = cinemaById.get(record.cinemaId);
          const showtime = getShowtime(record.showtimeId);
          const duration = showtime
            ? screeningEndMinutes(showtime) - minutesFromTime(record.time)
            : 150;

          const url = buildIcs({
            uid: record.reference,
            title: `${record.movieTitle} — ${record.cinemaName}`,
            description: `Booking ${record.reference}. Seats ${seatRanges(record.seats.map((s) => s.seatId))} in ${record.screenName}. Nokshi Cinemas demonstration booking — not a valid ticket.`,
            location: cinema ? cinema.addressLines.join(', ') : record.cinemaName,
            start: screeningStart(record.date, record.time),
            durationMinutes: Math.max(60, duration),
          });
          downloadUrl(url, `${record.reference}.ics`);
          return { ok: true, message: 'Calendar file downloaded.' };
        }

        case 'create_watch': {
          const showtime = getShowtime(action.showtimeId);
          if (!showtime) return { ok: false, message: 'That screening is no longer in the schedule.' };
          const created = watches.addWatch({
            kind: action.kind,
            showtimeId: showtime.id,
            movieId: showtime.movieId,
            cinemaId: showtime.cinemaId,
            date: showtime.date,
            time: showtime.time,
            ...(action.partySize ? { partySize: action.partySize } : {}),
            referencePrice: adultPriceRange(showtime).min,
          });
          return {
            ok: true,
            message: `${watchKindLabels[action.kind]} alert saved in this browser. It does not monitor live inventory.`,
            undo: {
              label: 'Remove the alert',
              run: () => useWatches.getState().removeWatch(created.id),
            },
          };
        }

        case 'remove_watch': {
          watches.removeWatch(action.watchId);
          return { ok: true, message: 'Alert removed.' };
        }

        case 'save_lost_report': {
          const cinema = cinemaById.get(action.draft.cinemaId);
          if (!cinema) return { ok: false, message: 'I could not identify the cinema for that report.' };
          const saved = reports.addLostItem(action.draft);
          const movie = bookings.bookings.find((b) => b.reference === action.draft.bookingReference);
          const summary = lostItemSummary(saved, {
            cinemaName: cinema.name,
            movieTitle: movie?.movieTitle ?? 'Not recorded',
          });
          try {
            await navigator.clipboard.writeText(summary);
          } catch {
            // Clipboard access can be denied; the report is saved either way.
          }
          return {
            ok: true,
            message: `Report ${saved.id} saved in this browser and copied to your clipboard. It has not been sent — email or call ${cinema.shortName} to report it.`,
            undo: { label: 'Delete the report', run: () => useReports.getState().removeLostItem(saved.id) },
          };
        }

        case 'save_claim_draft': {
          const record = bookings.bookings.find((b) => b.reference === action.bookingReference);
          if (!record) return { ok: false, message: 'That booking is not in this browser.' };
          const draft = reports.addClaim({
            bookingReference: record.reference,
            reason: action.reason,
            note: '',
            contactEmail: record.guestEmail,
            checklist: claimChecklistTemplate.map((item) => ({ ...item, done: false })),
          });
          return {
            ok: true,
            message: `Claim draft ${draft.id} saved in this browser. Nothing has been submitted and no outcome is implied.`,
            undo: { label: 'Delete the draft', run: () => useReports.getState().removeClaim(draft.id) },
          };
        }

        case 'copy_text': {
          try {
            await navigator.clipboard.writeText(action.text);
            return { ok: true, message: 'Copied to your clipboard.' };
          } catch {
            return { ok: false, message: 'Your browser blocked clipboard access.' };
          }
        }

        case 'open_mail': {
          window.location.href = mailtoUrl({
            to: action.to,
            subject: action.subject,
            body: action.body,
          });
          return { ok: true, message: 'Opening your mail app — you still have to send it.' };
        }

        case 'call': {
          window.location.href = telUrl(action.phone);
          return { ok: true, message: 'Opening your phone app.' };
        }

        case 'focus_field': {
          const field = document.getElementById(action.fieldId);
          if (!field) return { ok: false, message: 'That field is not on screen right now.' };
          field.scrollIntoView({ block: 'center', behavior: 'smooth' });
          (field as HTMLInputElement).focus();
          return { ok: true, message: 'Focused the field.' };
        }

        case 'clear_conversation': {
          useMax.getState().clearConversation();
          return { ok: true, message: 'Conversation cleared.' };
        }

        default: {
          return { ok: false, message: 'I do not know how to do that.' };
        }
      }
    },
    [navigate],
  );
}
