import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, DemoNote, RuleHeading } from '@/components/ui/misc';
import { HouseDiagram } from '@/components/cinema/HouseDiagram';
import { DateStrip } from '@/components/showtime/DateStrip';
import { ShowtimePill } from '@/components/showtime/ShowtimeButton';
import { AccessibilityLegend, AccessibilityChips, CertificateChip } from '@/components/movie/Chips';
import { EmptyState } from '@/components/common';
import { NotFound } from './NotFound';
import {
  formatLabels,
  getCinema,
  groupShowtimesByMovie,
  languageLabels,
  showtimesForCinemaDate,
} from '@/data';
import { dateWindow, formatRuntime, longDayLabel } from '@/lib/datetime';
import { mapUrl, telUrl } from '@/lib/external';
import { usePreferences } from '@/store/preferences';
import { accessDetailLabels as accessLabels, amenityLabels } from '@/i18n/domain';
import { Trans, useTranslation } from 'react-i18next';

export function CinemaDetails() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const cinema = slug ? getCinema(slug) : null;
  const dates = useMemo(() => dateWindow(10), []);
  const [date, setDate] = useState(dates[0]!);
  const setPreferredCinema = usePreferences((s) => s.setCinema);

  const byMovie = useMemo(() => {
    if (!cinema) return [];
    return groupShowtimesByMovie(showtimesForCinemaDate(cinema.id, date));
  }, [cinema, date]);

  if (!cinema) return <NotFound />;

  return (
    <>
      <header className="border-b-2 border-content">
        <div className="shell py-10 sm:py-14">
          <nav aria-label={t('cinemaDetails.breadcrumb')} className="mb-6">
            <Link to="/cinemas" className="eyebrow underline-offset-4 hover:underline">
              {t('cinemaDetails.backToCinemas')}
            </Link>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div>
              <p className="eyebrow mb-3">
                {cinema.area}, {cinema.city}
              </p>
              <h1 className="font-display text-[2.5rem] leading-[0.96] tracking-[-0.035em] sm:text-[3.5rem]">
                {cinema.name}
              </h1>
              <p lang="bn" className="mt-2 font-display text-2xl text-content-muted">
                {cinema.nameBn}
              </p>

              <p className="mt-6 max-w-prose text-[1.0625rem] leading-8">{cinema.description}</p>

              <p className="mt-5 border-l-2 border-accent pl-5 font-display text-xl leading-snug">
                {cinema.signature}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  asChild
                  onClick={() => setPreferredCinema(cinema.id)}
                >
                  <Link to={`/showtimes?cinema=${cinema.id}`}>See showtimes here</Link>
                </Button>
                <Button asChild variant="outline">
                  <a href={mapUrl(cinema.mapQuery)} target="_blank" rel="noreferrer noopener">
                    <MapPin aria-hidden="true" />
                    Directions
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="lg:pt-2">
              <dl className="border-t-2 border-content text-sm">
                <div className="border-b border-hairline py-3.5">
                  <dt className="eyebrow mb-1.5">Address</dt>
                  <dd>
                    <address className="not-italic leading-7 text-content-muted">
                      {cinema.addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </dd>
                </div>
                <div className="border-b border-hairline py-3.5">
                  <dt className="eyebrow mb-1.5">Opening</dt>
                  <dd className="numeral leading-7 text-content-muted">
                    {cinema.openingHours}
                    <span className="block">Box office {cinema.boxOfficeHours}</span>
                  </dd>
                </div>
                <div className="border-b border-hairline py-3.5">
                  <dt className="eyebrow mb-1.5">Contact</dt>
                  <dd className="space-y-1">
                    <a
                      href={telUrl(cinema.phone)}
                      className="inline-flex items-center gap-1.5 underline underline-offset-4"
                    >
                      <Phone aria-hidden="true" className="size-4" />
                      {cinema.phone}
                    </a>
                    <br />
                    <a
                      href={`mailto:${cinema.email}`}
                      className="inline-flex items-center gap-1.5 break-all underline underline-offset-4"
                    >
                      <Mail aria-hidden="true" className="size-4 shrink-0" />
                      {cinema.email}
                    </a>
                  </dd>
                </div>
                <div className="py-3.5">
                  <dt className="eyebrow mb-2">Before the feature</dt>
                  <dd className="numeral text-content-muted">
                    {cinema.trailerMinutes} minutes of trailers and adverts
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </header>

      <div className="shell grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <section aria-labelledby="cin-showtimes">
            <RuleHeading id="cin-showtimes" className="mb-5">
              {t('cinemaDetails.showtimes')}
            </RuleHeading>
            <DateStrip value={date} onChange={setDate} className="mb-5" />
            <p className="eyebrow mb-4">{longDayLabel(date)}</p>

            {byMovie.length === 0 ? (
              <EmptyState
                title={t('cinemaDetails.nothingScheduledTitle')}
                variant="schedule"
                body={t('cinemaDetails.nothingScheduledBody', { cinema: cinema.name })}
              />
            ) : (
              <ul className="divide-y divide-hairline border-y border-hairline">
                {byMovie.map(({ movie, showtimes }) => (
                  <li key={movie.id} className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
                    <div className="min-w-0">
                      <Link
                        to={`/movies/${movie.slug}`}
                        className="font-display text-xl leading-tight underline-offset-4 hover:underline"
                      >
                        {movie.title}
                      </Link>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-content-muted">
                        <CertificateChip code={movie.certificate} />
                        <span className="numeral">{formatRuntime(movie.runtimeMinutes)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{languageLabels[movie.language]}</span>
                      </p>
                    </div>
                    <ul className="flex flex-wrap content-start gap-1.5 md:justify-end">
                      {showtimes.map((showtime) => (
                        <li key={showtime.id} className="flex flex-col items-start gap-1">
                          <ShowtimePill showtime={showtime} />
                          {showtime.accessibility.length ? (
                            <AccessibilityChips features={showtime.accessibility} size="sm" />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}

            <DemoNote className="mt-5" tone="loud">
              {t('cinemaDetails.sampleSchedule')}
            </DemoNote>

            <div className="mt-8 border-t border-hairline pt-6">
              <AccessibilityLegend />
            </div>
          </section>

          <section aria-labelledby="cin-access" className="mt-14">
            <RuleHeading id="cin-access" className="mb-5">
              {t('cinemaDetails.access')}
            </RuleHeading>
            <ul className="space-y-2.5">
              {cinema.accessibility.map((feature) => (
                <li key={feature} className="flex gap-3 text-[0.9375rem] leading-7">
                  <span aria-hidden="true" className="mt-[0.7em] block size-1.5 shrink-0 bg-signal" />
                  {accessLabels[feature] ?? feature}
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
              <Trans
                i18nKey="cinemaDetails.accessNote"
                values={{ phone: cinema.phone }}
                components={{
                  phone: (
                    <a
                      href={telUrl(cinema.phone)}
                      className="font-semibold underline underline-offset-4"
                    />
                  ),
                }}
              />
            </p>
          </section>

          <section aria-labelledby="cin-getting" className="mt-14">
            <RuleHeading id="cin-getting" className="mb-5">
              {t('cinemaDetails.gettingHere')}
            </RuleHeading>
            <div className="space-y-5 text-[0.9375rem] leading-7 text-content-muted">
              <div>
                <h3 className="mb-1 font-semibold text-content">{t('cinemaDetails.transport')}</h3>
                <p className="max-w-prose">{cinema.transportNote}</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-content">{t('cinemaDetails.parking')}</h3>
                <p className="max-w-prose">{cinema.parkingNote}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="cin-policies" className="mt-14">
            <RuleHeading id="cin-policies" className="mb-5">
              {t('cinemaDetails.housePolicies')}
            </RuleHeading>
            <div className="space-y-6 text-[0.9375rem] leading-7 text-content-muted">
              <div>
                <h3 className="mb-1 font-semibold text-content">{t('cinemaDetails.arrivingLate')}</h3>
                <p className="max-w-prose">{cinema.lateArrivalPolicy}</p>
              </div>
              <div id="lost-found" className="scroll-mt-24">
                <h3 className="mb-1 font-semibold text-content">{t('cinemaDetails.lostProperty')}</h3>
                <p className="max-w-prose">
                  {t('cinemaDetails.lostPropertyBody', {
                    days: cinema.lostAndFound.holdingPeriodDays,
                    hours: cinema.lostAndFound.hours,
                  })}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  <a
                    href={`mailto:${cinema.lostAndFound.email}`}
                    className="break-all font-semibold text-content underline underline-offset-4"
                  >
                    {cinema.lostAndFound.email}
                  </a>
                  <a
                    href={telUrl(cinema.lostAndFound.phone)}
                    className="font-semibold text-content underline underline-offset-4"
                  >
                    {cinema.lostAndFound.phone}
                  </a>
                </p>
                <p className="mt-2 max-w-prose text-[0.875rem]">
                  {t('cinemaDetails.lostPropertyMax')}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <section aria-labelledby="cin-houses" className="border-2 border-hairline-strong p-5">
            <h2 id="cin-houses" className="eyebrow mb-4">
              {t('cinemaDetails.theHouses')}
            </h2>
            <HouseDiagram screens={cinema.screens} />
            <ul className="mt-5 space-y-3 border-t border-hairline pt-4">
              {cinema.screens.map((screen) => (
                <li key={screen.id}>
                  <p className="text-sm font-semibold">
                    {screen.name}{' '}
                    <span className="font-normal text-content-muted">— {formatLabels[screen.format]}</span>
                  </p>
                  <AccessibilityChips features={screen.accessibility} size="sm" className="mt-1.5" />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="cin-amenities" className="mt-6 border-2 border-hairline-strong p-5">
            <h2 id="cin-amenities" className="eyebrow mb-3">
              {t('cinemaDetails.amenities')}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {cinema.amenities.map((amenity) => (
                <Badge key={amenity} tone="outline">
                  {amenityLabels[amenity] ?? amenity}
                </Badge>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
