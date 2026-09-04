import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge, DemoNote } from '@/components/ui/misc';
import { VenueImage } from '@/components/visual/VenueImage';
import { HouseDiagram } from '@/components/cinema/HouseDiagram';
import { cinemas, cities, moviesAtCinema } from '@/data';
import { todayIso } from '@/lib/datetime';
import { mapUrl } from '@/lib/external';
import { accessLabels, amenityLabels } from '@/i18n/domain';


export function Cinemas() {
  const { t } = useTranslation();
  const today = todayIso();
  const showing = useMemo(
    () => Object.fromEntries(cinemas.map((c) => [c.id, moviesAtCinema(c.id, today)])),
    [today],
  );

  return (
    <div className="shell">
      <PageHeader
        eyebrow={t('cinemas.eyebrow')}
        title={t('cinemas.title')}
        lede={t('cinemas.lede')}
      />

      {cities.map((city) => (
        <section key={city} aria-labelledby={`city-${city}`} className="py-10">
          <h2 id={`city-${city}`} className="eyebrow mb-6 border-b border-hairline pb-2">
            {city}
          </h2>

          <ul className="space-y-12">
            {cinemas
              .filter((cinema) => cinema.city === city)
              .map((cinema) => (
                <li key={cinema.id}>
                  <article>
                    {/* The foyer. A venue is a room before it is an address,
                        and five identical text blocks told you nothing about
                        which one you were choosing. */}
                    <Link
                      to={`/cinemas/${cinema.slug}`}
                      className="group mb-7 block overflow-hidden border-2 border-content"
                    >
                      <VenueImage
                        slug={cinema.slug}
                        sizes="(max-width: 1024px) 100vw, 1100px"
                        imgClassName="transition-transform duration-[--dur-slow] ease-[--ease-out] group-hover:scale-[1.02] motion-reduce:transform-none"
                      />
                    </Link>

                    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
                    <div>
                      <h3 className="font-display text-[1.75rem] leading-tight tracking-[-0.025em] sm:text-[2.25rem]">
                        <Link to={`/cinemas/${cinema.slug}`} className="underline-offset-4 hover:underline">
                          {cinema.name}
                        </Link>
                      </h3>
                      <p lang="bn" className="mt-1 text-base text-content-muted">
                        {cinema.nameBn}
                      </p>

                      <p className="mt-4 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
                        {cinema.description}
                      </p>

                      <p className="mt-4 border-l-2 border-accent pl-4 font-display text-lg leading-snug">
                        {cinema.signature}
                      </p>

                      <address className="mt-5 not-italic text-[0.9375rem] leading-7 text-content-muted">
                        {cinema.addressLines.join(', ')}
                      </address>

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                        <a
                          href={`tel:${cinema.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1.5 underline underline-offset-4"
                        >
                          <Phone aria-hidden="true" className="size-4" />
                          {cinema.phone}
                        </a>
                        <a
                          href={mapUrl(cinema.mapQuery)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 underline underline-offset-4"
                        >
                          <MapPin aria-hidden="true" className="size-4" />
                          Directions
                          <ExternalLink aria-hidden="true" className="size-3.5" />
                        </a>
                      </div>

                      <p className="numeral mt-3 text-[0.8125rem] text-content-muted">
                        Open {cinema.openingHours} · Box office {cinema.boxOfficeHours}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {cinema.amenities.map((amenity) => (
                          <Badge key={amenity} tone="outline">
                            {amenityLabels[amenity] ?? amenity}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cinema.accessibility.map((feature) => (
                          <Badge key={feature} tone="accent">
                            {accessLabels[feature] ?? feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild>
                          <Link to={`/cinemas/${cinema.slug}`}>This cinema</Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link to={`/showtimes?cinema=${cinema.id}`}>Today's showtimes</Link>
                        </Button>
                      </div>
                    </div>

                    <div className="lg:pt-3">
                      <div className="border-2 border-hairline-strong p-5">
                        <h4 className="eyebrow mb-4">The houses</h4>
                        <HouseDiagram screens={cinema.screens} />
                      </div>

                      <div className="mt-5 border-2 border-hairline-strong p-5">
                        <h4 className="eyebrow mb-3">On today</h4>
                        {showing[cinema.id]?.length ? (
                          <ul className="space-y-1.5">
                            {showing[cinema.id]!.slice(0, 6).map((movie) => (
                              <li key={movie.id}>
                                <Link
                                  to={`/movies/${movie.slug}`}
                                  className="text-[0.9375rem] underline-offset-4 hover:underline"
                                >
                                  {movie.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[0.9375rem] text-content-muted">
                            {t('cinemas.nothingToday')}
                          </p>
                        )}
                      </div>
                    </div>
                    </div>
                  </article>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <DemoNote className="pb-4" tone="loud">
        {t('cinemas.aiDisclosure')}
      </DemoNote>
    </div>
  );
}
