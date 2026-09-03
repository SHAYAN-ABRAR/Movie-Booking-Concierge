import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { RuleHeading } from '@/components/ui/misc';
import { cinemas, COMPANY } from '@/data';
import { assetSummary } from '@/data/assetManifest';

export function About() {
  const screens = cinemas.reduce((sum, cinema) => sum + cinema.screens.length, 0);
  const seats = cinemas.reduce(
    (sum, cinema) => sum + cinema.screens.reduce((s, screen) => s + screen.capacity, 0),
    0,
  );

  return (
    <div className="shell">
      <PageHeader
        eyebrow="About"
        title="GrandPlex"
        lede={`Five houses, ${screens} screens, one programme that changes every Thursday. And a note about how this site was built, because it matters to how it looks.`}
      />

      <div className="grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
        <div className="min-w-0 max-w-prose">
          <section aria-labelledby="name">
            <RuleHeading id="name" index="01" className="mb-6">
              The name
            </RuleHeading>
            <p className="text-[1.0625rem] leading-[1.7]">
              <em className="not-italic font-semibold">Grand</em> is the room — the volume of it, the
              rake of the seats, the moment the lights go. <em className="not-italic font-semibold">Plex</em>{' '}
              is what is thrown onto the wall at the front of it. The wordmark sets the two halves
              differently for exactly that reason: the first is printed, the second is projected.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-[1.7]">
              In Bangla the house is written গ্র্যান্ডপ্লেক্স. The wordmark itself stays Latin in both
              languages, because a logo is a piece of artwork rather than a translatable string.
            </p>
          </section>

          <section aria-labelledby="look" className="mt-14">
            <RuleHeading id="look" index="02" className="mb-6">
              The design
            </RuleHeading>
            <p className="text-[1.0625rem] leading-[1.7]">
              The system is called <strong className="font-semibold">Cinematic Monolith</strong>, and
              it has three rules. Type is condensed, heavy and set large, the way a title card is.
              Structure is drawn with rules of exactly three weights — a hairline inside a block, a
              2px edge around it, a 3px slab above a section — and never with a shadow or a rounded
              corner. And there is one colour: vermilion.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-[1.7]">
              That last rule is the strict one. Vermilion is not decoration here. If something on
              this site is vermilion it is because it is the thing you are meant to act on, the seat
              you have chosen, or the screening that is about to start. Nothing else is allowed to
              take it, which is what lets it mean something.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-[1.7]">
              Light and dark are not an inversion of one another. Light is a printed festival
              programme: bone paper, black ink, generous margins. Dark is the auditorium after the
              house lights drop. The seat map and your ticket stay dark in <em>both</em>, because a
              room does not change colour when you change your preferences.
            </p>
          </section>

          <section aria-labelledby="houses" className="mt-14">
            <RuleHeading id="houses" index="03" className="mb-6">
              The houses
            </RuleHeading>
            <p className="text-[1.0625rem] leading-[1.7]">
              We opened in Dhanmondi in {COMPANY.foundedYear} with two screens and a projectionist who
              refused to run adverts. There are {screens} screens now, across {cinemas.length} houses
              in three cities, seating {seats.toLocaleString('en-US')} between them — but the
              programming principle has not changed: first-run features pay for the repertory strand,
              and the repertory strand is why anyone remembers us.
            </p>
            <ul className="mt-7 border-y-2 border-content">
              {cinemas.map((cinema, i) => (
                <li key={cinema.id} className="border-b border-hairline last:border-b-0">
                  <Link
                    to={`/cinemas/${cinema.slug}`}
                    className="group flex flex-wrap items-baseline gap-x-5 gap-y-1 py-4"
                  >
                    <span aria-hidden="true" className="numeral text-[0.6875rem] font-bold text-accent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-2xl uppercase leading-none group-hover:text-accent">
                      {cinema.name}
                    </span>
                    <span className="ml-auto text-[0.8125rem] text-content-muted">
                      {cinema.signature}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* The honest note about the build. */}
          <section aria-labelledby="build" className="mt-14">
            <RuleHeading id="build" index="04" className="mb-6">
              About this build
            </RuleHeading>
            <p className="text-[1.0625rem] leading-[1.7]">
              GrandPlex is not a real cinema chain. It is a demonstration of a complete booking
              product, built as a frontend-only application: there is no server, no database, no
              account system and no payment processor anywhere in it. The films, venues, schedules,
              seat availability, prices, offers and policies are all sample data written for this
              project.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-[1.7]">
              Everything you do here happens in your browser. Bookings are written to local storage
              on this device, and nowhere else. Clear your browsing data and they are gone.
            </p>

            <h3 className="mt-9 font-display text-[1.5rem] uppercase leading-none">
              Where the pictures come from
            </h3>
            <p className="mt-3 text-[1.0625rem] leading-[1.7]">{assetSummary.rationale}</p>
            <p className="mt-4 text-[1.0625rem] leading-[1.7]">
              Every one of them was downloaded once at authoring time and committed to the
              repository. The running site never contacts an image host, and there is no API key of
              any kind in the browser. Venues are drawn as true diagrams of their screens, sized by
              seat count; offers are set as type.
            </p>

            <h3 className="mt-9 font-display text-[1.5rem] uppercase leading-none">
              The one exception: the counter
            </h3>
            <p className="mt-3 text-[1.0625rem] leading-[1.7]">
              The concession items carry generated food photography, produced once with an AI image
              model and committed as local files. They are illustrations, not photographs of real
              GrandPlex servings, and every counter surface says so. Film posters and backdrops are
              never AI-generated: inventing a face or a piece of studio artwork would be a
              different, dishonest thing.
            </p>

            <h3 className="mt-9 font-display text-[1.5rem] uppercase leading-none">About Max</h3>
            <p className="mt-3 text-[1.0625rem] leading-[1.7]">
              Max is the booking concierge in the bottom-right corner. It runs entirely on this
              device: a typed intent parser, a date and time resolver, and the same catalogue and
              pricing functions the rest of the site uses. It has no connection to a remote AI
              service by default, no API key, and it never sends your conversation anywhere.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-[1.7]">
              Max will tell you when it does not know something rather than inventing an answer, and
              it will never change your seats, tickets or basket without asking you first.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="accent">
                <Link to="/showtimes">See what is on</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <section aria-labelledby="facts" className="edge p-6">
            <h2 id="facts" className="eyebrow mb-5">
              In numbers
            </h2>
            <dl className="space-y-4">
              {[
                { label: 'Houses', value: cinemas.length },
                { label: 'Screens', value: screens },
                { label: 'Seats', value: seats.toLocaleString('en-US') },
                { label: 'Cities', value: 3 },
                { label: 'Opened', value: COMPANY.foundedYear },
              ].map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-content-faint">
                    {fact.label}
                  </dt>
                  <dd className="index-mark text-[2rem]">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-hairline pt-3 text-[0.75rem] leading-5 text-content-faint">
              Figures describe the sample circuit in this demonstration, not a real business.
            </p>
          </section>

          <section aria-labelledby="office" className="mt-6 edge p-6">
            <h2 id="office" className="eyebrow mb-3">
              Registered office
            </h2>
            <address className="not-italic text-[0.9375rem] leading-7 text-content-muted">
              {COMPANY.registeredOffice.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-3 text-[0.8125rem] text-content-faint">
              A fictional address for a fictional company.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
