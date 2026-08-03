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
        title="Nokshi Cinemas"
        lede="Five houses, nineteen screens, one programme that changes every Thursday. And a note about how this site was built, because it matters to how it looks."
      />

      <div className="grid gap-12 py-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="min-w-0 max-w-prose">
          <section aria-labelledby="name">
            <RuleHeading id="name" className="mb-5">
              The name
            </RuleHeading>
            <p className="text-[1.0625rem] leading-8">
              <em>Nokshi</em> — নকশী — is the running stitch of Bengal, the line of small marks that
              makes a nokshi kantha out of worn cloth. A strip of 35mm film carries the same
              interrupted line down both its edges: sprocket holes, evenly spaced, pulling the
              picture past the lamp.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-8">
              It is the same rhythm, and it is the only ornament this site uses. You will find it in
              the wordmark, along the edge of every film plate, under every section heading, and
              around the perforated edge of your ticket.
            </p>
          </section>

          <section aria-labelledby="houses" className="mt-12">
            <RuleHeading id="houses" className="mb-5">
              The houses
            </RuleHeading>
            <p className="text-[1.0625rem] leading-8">
              We opened in Dhanmondi in {COMPANY.foundedYear} with two screens and a projectionist who
              refused to run adverts. There are {screens} screens now, across {cinemas.length} houses
              in three cities, seating {seats.toLocaleString('en-US')} between them — but the
              programming principle has not changed: first-run features pay for the repertory strand,
              and the repertory strand is why anyone remembers us.
            </p>
            <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
              {cinemas.map((cinema) => (
                <li key={cinema.id} className="py-3.5">
                  <Link
                    to={`/cinemas/${cinema.slug}`}
                    className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1"
                  >
                    <span className="font-display text-lg group-hover:underline">{cinema.name}</span>
                    <span className="text-[0.8125rem] text-content-muted">{cinema.signature}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* The honest note about the build. */}
          <section aria-labelledby="build" className="mt-12">
            <RuleHeading id="build" className="mb-5">
              About this build
            </RuleHeading>
            <p className="text-[1.0625rem] leading-8">
              Nokshi Cinemas is not a real cinema chain. It is a demonstration of a complete booking
              product, built as a frontend-only application: there is no server, no database, no
              account system and no payment processor anywhere in it. The films, venues, schedules,
              seat availability, prices, offers and policies are all sample data written for this
              project.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-8">
              Everything you do here happens in your browser. Bookings are written to local storage
              on this device, and nowhere else. Clear your browsing data and they are gone.
            </p>

            <h3 className="mt-8 font-display text-xl leading-tight">Why there are no photographs</h3>
            <p className="mt-3 text-[1.0625rem] leading-8">{assetSummary.rationale}</p>
            <p className="mt-4 text-[1.0625rem] leading-8">
              Each film is presented through a plate composed from its own title, running time,
              certificate and language. Each cinema is drawn as a true diagram of its screens, sized
              by seat count. Each offer is set as type. Nothing here is a stand-in for a picture that
              should have been there — the type <em>is</em> the picture.
            </p>

            <h3 className="mt-8 font-display text-xl leading-tight">About Max</h3>
            <p className="mt-3 text-[1.0625rem] leading-8">
              Max is the booking concierge in the bottom-right corner. It runs entirely on this
              device: a typed intent parser, a date and time resolver, and the same catalogue and
              pricing functions the rest of the site uses. It has no connection to a remote AI
              service by default, no API key, and it never sends your conversation anywhere.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-8">
              Max will tell you when it does not know something rather than inventing an answer, and
              it will never change your seats, tickets or basket without asking you first.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/showtimes">See what is on</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <section aria-labelledby="facts" className="border border-hairline-strong p-5">
            <h2 id="facts" className="eyebrow mb-4">
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
                <div key={fact.label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-content-muted">{fact.label}</dt>
                  <dd className="numeral font-display text-2xl leading-none">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-hairline pt-3 text-[0.75rem] leading-5 text-content-muted">
              Figures describe the sample circuit in this demonstration, not a real business.
            </p>
          </section>

          <section aria-labelledby="office" className="mt-6 border border-hairline-strong p-5">
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
            <p className="mt-3 text-[0.8125rem] text-content-muted">
              A fictional address for a fictional company.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
