import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Trash2 } from 'lucide-react';
import { requestNotificationPermission } from '@/components/max/DemoAlertRunner';
import { usePreferences } from '@/store/preferences';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DemoNote } from '@/components/ui/misc';
import { EmptyDrawing } from '@/components/visual/EmptyStates';
import { useWatches, unreadAlertCount, watchKindKeys } from '@/store/watches';
import { movieById } from '@/data/movies';
import { cinemaById } from '@/data/cinemas';
import { displayTime, dayLabel } from '@/lib/datetime';
import { cn } from '@/lib/utils';

/**
 * The in-app notification centre.
 *
 * This is the fallback that always works, whether or not the customer ever
 * grants browser notification permission — and the only place demo alerts are
 * guaranteed to appear.
 */
export function AlertBell() {
  const { t } = useTranslation();
  const alerts = useWatches((s) => s.alerts);
  const watches = useWatches((s) => s.watches);
  const markAllRead = useWatches((s) => s.markAllRead);
  const dismissAlert = useWatches((s) => s.dismissAlert);
  const clearAll = useWatches((s) => s.clearAll);
  const setBrowserNotifications = useWatches((s) => s.setBrowserNotifications);
  const promptShown = usePreferences((s) => s.notificationPromptShown);

  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied',
  );

  const unread = unreadAlertCount(alerts);
  const hasAnything = alerts.length > 0 || watches.length > 0;

  // Asked at most once, and only when there is actually something to notify about.
  const canAskForNotifications =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    permission === 'default' &&
    !promptShown;

  return (
    <Popover onOpenChange={(open) => open && unread > 0 && markAllRead()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread > 0
              ? t('alerts.labelUnread', { count: unread })
              : hasAnything
                ? t('alerts.title')
                : t('alerts.labelNone')
          }
        >
          <Bell aria-hidden="true" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="numeral absolute right-1.5 top-1.5 grid min-w-[1.1rem] place-items-center bg-signal px-1 text-[0.625rem] font-bold leading-[1.1rem] text-surface"
            >
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <h2 className="font-display text-lg leading-none">{t('alerts.title')}</h2>
          {hasAnything ? (
            <Button variant="link" size="sm" className="px-0 text-xs" onClick={clearAll}>
              {t('alerts.clearAll')}
            </Button>
          ) : null}
        </div>

        <div className="max-h-[24rem] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="px-4 pb-6 pt-4">
              {/* The strip, lying flat — nothing has come through. */}
              <EmptyDrawing variant="alerts" className="mx-auto max-w-36" />
              <p className="mt-2 text-sm leading-6 text-content-muted">
                {watches.length > 0
                  ? t('alerts.emptyWithWatches', { count: watches.length })
                  : t('alerts.empty')}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {alerts.map((alert) => {
                const movie = movieById.get(
                  watches.find((w) => w.id === alert.watchId)?.movieId ?? '',
                );
                return (
                  <li key={alert.id} className={cn('px-4 py-3', !alert.read ? 'bg-signal-wash/40' : '')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="eyebrow mb-1">{t(watchKindKeys[alert.kind])}</p>
                        <p className="text-sm font-semibold leading-snug">{alert.title}</p>
                        <p className="mt-1 text-[0.8125rem] leading-5 text-content-muted">{alert.body}</p>
                        {movie ? (
                          <Link
                            to={`/movies/${movie.slug}`}
                            className="mt-1.5 inline-block text-[0.8125rem] font-semibold underline underline-offset-4"
                          >
                            {t('alerts.view', { title: movie.title })}
                          </Link>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('alerts.dismiss', { title: alert.title })}
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {watches.length > 0 ? (
          <div className="border-t border-hairline px-4 py-3">
            <p className="eyebrow mb-2">{t('alerts.savedWatches')}</p>
            <ul className="space-y-1.5">
              {watches.slice(0, 4).map((watch) => {
                const movie = movieById.get(watch.movieId);
                const cinema = cinemaById.get(watch.cinemaId);
                return (
                  <li key={watch.id} className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
                    <span className="min-w-0 truncate">
                      {movie?.title ?? t('alerts.screening')} · {dayLabel(watch.date)}{' '}
                      {displayTime(watch.time)}
                      {cinema ? ` · ${cinema.shortName}` : ''}
                    </span>
                    <span className="shrink-0 text-content-faint">{t(watchKindKeys[watch.kind])}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {watches.length > 0 && canAskForNotifications ? (
          <div className="border-t border-hairline px-4 py-3">
            <p className="mb-2 text-[0.8125rem] leading-5 text-content-muted">
              {t('alerts.browserPitch')}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const result = await requestNotificationPermission();
                setBrowserNotifications(result === 'granted');
                setPermission(result === 'unsupported' ? 'denied' : result);
              }}
            >
              {t('alerts.allowBrowser')}
            </Button>
          </div>
        ) : null}

        <div className="border-t border-hairline px-4 py-3">
          <DemoNote>{t('alerts.demoNote')}</DemoNote>
        </div>
      </PopoverContent>
    </Popover>
  );
}
