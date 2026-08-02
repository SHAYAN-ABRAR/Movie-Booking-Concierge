import { useEffect, useRef } from 'react';
import { useWatches, watchKindLabels } from '@/store/watches';
import { usePreferences } from '@/store/preferences';
import { movieById, cinemaById } from '@/data';
import { getShowtime } from '@/data/schedule';
import { adultPriceRange } from '@/lib/bookingMath';
import { seededInt } from '@/lib/deterministic';
import { dayLabel, displayTime } from '@/lib/datetime';
import { money } from '@/lib/format';

/**
 * Demo alert events.
 *
 * A watch in this build monitors nothing — there is no server and no live
 * inventory. So that the alert *behaviour* can still be seen working, each
 * saved watch fires exactly one deterministic demonstration event a short time
 * after it is created. The event's content is derived from the watch itself,
 * so it is the same every time for the same watch.
 *
 * Every surface that shows one of these says plainly that it is a demo event.
 */

const DEMO_DELAY_MS = 40_000;

export function DemoAlertRunner() {
  const watches = useWatches((s) => s.watches);
  const markFired = useWatches((s) => s.markFired);
  const pushAlert = useWatches((s) => s.pushAlert);
  const browserNotifications = useWatches((s) => s.browserNotifications);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const pending = watches.filter((watch) => !watch.fired);

    for (const watch of pending) {
      if (timers.current.has(watch.id)) continue;

      const elapsed = Date.now() - new Date(watch.createdAt).getTime();
      const delay = Math.max(2_000, DEMO_DELAY_MS - elapsed);

      const handle = window.setTimeout(() => {
        timers.current.delete(watch.id);
        const showtime = getShowtime(watch.showtimeId);
        if (!showtime) {
          markFired(watch.id);
          return;
        }

        const movie = movieById.get(watch.movieId);
        const cinema = cinemaById.get(watch.cinemaId);
        const where = `${movie?.title ?? 'Your screening'} · ${dayLabel(watch.date)} ${displayTime(watch.time)}${cinema ? ` · ${cinema.shortName}` : ''}`;

        // Deterministic per watch: the same watch always produces the same event.
        let title: string;
        let body: string;

        switch (watch.kind) {
          case 'price-drop': {
            const reference = watch.referencePrice ?? adultPriceRange(showtime).min;
            const drop = seededInt(`${watch.id}|drop`, 30, 90);
            title = `Demo: price down ${money(drop)}`;
            body = `${where}. In this demonstration the adult seat price moves from ${money(reference)} to ${money(Math.max(100, reference - drop))}. Sample data — not a real price change.`;
            break;
          }
          case 'premium-seat': {
            const count = seededInt(`${watch.id}|premium`, 1, 4);
            title = `Demo: ${count} premium ${count === 1 ? 'seat' : 'seats'} free`;
            body = `${where}. A demonstration event showing what a premium-seat alert would look like. Nothing has actually changed in the seat map.`;
            break;
          }
          case 'adjacent-seats': {
            const size = watch.partySize ?? 2;
            title = `Demo: ${size} seats together`;
            body = `${where}. A demonstration event showing what a seats-together alert would look like for a party of ${size}.`;
            break;
          }
          case 'accessible-seat': {
            title = 'Demo: accessible seat free';
            body = `${where}. A demonstration event showing what an accessible-seat alert would look like. Confirm anything you actually need with the house.`;
            break;
          }
          default: {
            title = `Demo: ${watchKindLabels[watch.kind]}`;
            body = where;
          }
        }

        pushAlert({ watchId: watch.id, kind: watch.kind, title, body, showtimeId: watch.showtimeId });
        markFired(watch.id);

        // Only if the customer opted in *and* the browser already granted it.
        if (browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, { body, tag: watch.id, silent: true });
          } catch {
            // Some browsers block constructing notifications outside a service
            // worker; the in-app notification centre already has the alert.
          }
        }
      }, delay);

      timers.current.set(watch.id, handle);
    }

    const active = timers.current;
    return () => {
      for (const handle of active.values()) window.clearTimeout(handle);
      active.clear();
    };
  }, [watches, markFired, pushAlert, browserNotifications]);

  return null;
}

/** Requests notification permission once, and never asks again. */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  usePreferences.getState().markNotificationPromptShown();

  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}
