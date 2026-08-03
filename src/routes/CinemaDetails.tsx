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

const accessLabels: Record<string, string> = {
  'step-free-access': 'Step-free access from the street',
  'accessible-toilet': 'Accessible toilet on the cinema floor',
  'hearing-loop': 'Induction loop in every house',
  'companion-seat': 'Companion seats beside every wheelchair space',
  'assistance-dogs': 'Assistance dogs welcome throughout',
  'lift-access': 'Lift access to the cinema floor',
  'accessible-parking': 'Accessible parking bays',
};

const amenityLabels: Record<string, string> = {
  parking: 'Parking',
  cafe: 'Café',
  lounge: 'Lounge',
  atm: 'ATM',
  'prayer-room': 'Prayer room',
  'baby-change': 'Baby change',
  cloakroom: 'Cloakroom',
  'gift-card': 'Gift cards',
};

export function CinemaDetails() {
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
      <header className="border-b-2 border-ink">
        <div className="shell py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link to="/cinemas" className="eyebrow underline-offset-4 hover:underline">
              ← All cinemas
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
              <p lang="bn" className="mt-2 font-display text-2xl text-ink-muted">
                {cinema.nameBn}
              </p>

              <p className="mt-6 max-w-prose text-[1.0625rem] leading-8">{cinema.description}</p>

              <p className="mt-5 border-l-2 border-marigold pl-5 font-display text-xl leading-snug">
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
              <dl className="border-t-2 border-ink text-sm">
                <div className="border-b border-hairline py-3.5">
                  <dt className="eyebrow mb-1.5">Address</dt>
                  <dd>
                    <address className="not-italic leading-7 text-ink-muted">
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
                  <dd className="numeral leading-7 text-ink-muted">
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
                  <dd className="numeral text-ink-muted">
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
              Showtimes
            </RuleHeading>
            <DateStrip value={date} onChange={setDate} className="mb-5" />
            <p className="eyebrow mb-4">{longDayLabel(date)}</p>

            {byMovie.length === 0 ? (
              <EmptyState
                title="Nothing scheduled"
            variant="schedule"
                body={`${cinema.name} has no screenings listed for this date in the sample programme. Try another day on the strip above.`}
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
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-ink-muted">
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
              Sample schedule generated locally. Not a real listing for any cinema.
            </DemoNote>

            <div className="mt-8 border-t border-hairline pt-6">
              <AccessibilityLegend />
            </div>
          </section>

          <section aria-labelledby="cin-access" className="mt-14">
            <RuleHeading id="cin-access" className="mb-5">
              Access
            </RuleHeading>
            <ul className="space-y-2.5">
              {cinema.accessibility.map((feature) => (
                <li key={feature} className="flex gap-3 text-[0.9375rem] leading-7">
                  <span aria-hidden="true" className="mt-[0.7em] block size-1.5 shrink-0 bg-marigold" />
                  {accessLabels[feature] ?? feature}
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-prose text-[0.9375rem] leading-7 text-ink-muted">
              Wheelchair spaces appear on the seat map with their own marker and are always charged at
              the regular seat rate. If you need something that is not listed here, call the house on{' '}
              <a href={telUrl(cinema.phone)} className="font-semibold underline underline-offset-4">
                {cinema.phone}
              </a>{' '}
              — this site cannot arrange it for you.
            </p>
          </section>

          <section aria-labelledby="cin-getting" className="mt-14">
            <RuleHeading id="cin-getting" className="mb-5">
              Getting here
            </RuleHeading>
            <div className="space-y-5 text-[0.9375rem] leading-7 text-ink-muted">
              <div>
                <h3 className="mb-1 font-semibold text-ink">Transport</h3>
                <p className="max-w-prose">{cinema.transportNote}</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-ink">Parking</h3>
                <p className="max-w-prose">{cinema.parkingNote}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="cin-policies" className="mt-14">
            <RuleHeading id="cin-policies" className="mb-5">
              House policies
            </RuleHeading>
            <div className="space-y-6 text-[0.9375rem] leading-7 text-ink-muted">
              <div>
                <h3 className="mb-1 font-semibold text-ink">Arriving late</h3>
                <p className="max-w-prose">{cinema.lateArrivalPolicy}</p>
              </div>
              <div id="lost-found" className="scroll-mt-24">
                <h3 className="mb-1 font-semibold text-ink">Lost property</h3>
                <p className="max-w-prose">
                  Items found in this house are kept for {cinema.lostAndFound.holdingPeriodDays} days.
                  The lost property desk is open {cinema.lostAndFound.hours}.
                </p>
                <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  <a
                    href={`mailto:${cinema.lostAndFound.email}`}
                    className="break-all font-semibold text-ink underline underline-offset-4"
                  >
                    {cinema.lostAndFound.email}
                  </a>
                  <a
                    href={telUrl(cinema.lostAndFound.phone)}
                    className="font-semibold text-ink underline underline-offset-4"
                  >
                    {cinema.lostAndFound.phone}
                  </a>
                </p>
                <p className="mt-2 max-w-prose text-[0.875rem]">
                  Max can assemble a lost-item report with your booking, screen and seat already
                  filled in — you then send it yourself using the details above.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <section aria-labelledby="cin-houses" className="border border-hairline-strong p-5">
            <h2 id="cin-houses" className="eyebrow mb-4">
              The houses
            </h2>
            <HouseDiagram screens={cinema.screens} />
            <ul className="mt-5 space-y-3 border-t border-hairline pt-4">
              {cinema.screens.map((screen) => (
                <li key={screen.id}>
                  <p className="text-sm font-semibold">
                    {screen.name}{' '}
                    <span className="font-normal text-ink-muted">— {formatLabels[screen.format]}</span>
                  </p>
                  <AccessibilityChips features={screen.accessibility} size="sm" className="mt-1.5" />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="cin-amenities" className="mt-6 border border-hairline-strong p-5">
            <h2 id="cin-amenities" className="eyebrow mb-3">
              Amenities
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
