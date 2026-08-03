import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge, DemoNote } from '@/components/ui/misc';
import { OfferComposition } from '@/components/visual/OfferComposition';
import { Reveal } from '@/motion';
import { cinemaById, offers } from '@/data';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function Offers() {
  return (
    <div className="shell">
      <PageHeader
        eyebrow="Running now"
        title="Offers"
        lede="Five standing offers. None of them needs a code, and none of them is a partnership — every one is applied by the booking flow from what is already in your basket."
      />

      <ul className="space-y-14 py-10">
        {offers.map((offer, index) => (
          <li key={offer.id}>
            <article className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
              {/* The composition leads at every width — on desktop it is the
                  left column, on mobile it is the first thing in the flow. */}
              <div className="order-2">
                <div className="flex items-baseline gap-4">
                  <span
                    aria-hidden="true"
                    className="numeral font-display text-3xl leading-none text-ink/25"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h2 className="font-display text-[1.75rem] leading-tight tracking-[-0.025em] sm:text-[2.25rem]">
                      {offer.title}
                    </h2>
                    <p lang="bn" className="mt-1 text-base text-ink-muted">
                      {offer.titleBn}
                    </p>
                  </div>
                </div>

                <p className="mt-5 max-w-prose font-display text-xl leading-[1.4]">{offer.summary}</p>

                <p className="mt-4 max-w-prose text-[0.9375rem] leading-7 text-ink-muted">
                  {offer.detail}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {offer.days.length === 0 ? (
                    <Badge tone="ink">Every day</Badge>
                  ) : (
                    offer.days.map((day) => (
                      <Badge key={day} tone="ink">
                        {dayNames[day]}
                      </Badge>
                    ))
                  )}
                  {offer.cinemaIds === 'all' ? (
                    <Badge tone="outline">All cinemas</Badge>
                  ) : (
                    offer.cinemaIds.map((id) => (
                      <Badge key={id} tone="outline">
                        {cinemaById.get(id)?.shortName ?? id}
                      </Badge>
                    ))
                  )}
                </div>

                <div className="mt-6 border-t border-hairline pt-4">
                  <h3 className="eyebrow mb-2.5">How it is applied</h3>
                  <p className="max-w-prose text-[0.9375rem] leading-7 text-ink-muted">
                    {offer.mechanic}
                  </p>
                </div>

                <div className="mt-5 border-t border-hairline pt-4">
                  <h3 className="eyebrow mb-2.5">Terms</h3>
                  <ul className="max-w-prose space-y-1.5">
                    {offer.terms.map((term) => (
                      <li key={term} className="flex gap-2.5 text-[0.875rem] leading-6 text-ink-muted">
                        <span aria-hidden="true" className="mt-[0.6em] block size-1 shrink-0 bg-marigold" />
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link
                      to={
                        offer.cinemaIds === 'all'
                          ? '/showtimes'
                          : `/showtimes?cinema=${offer.cinemaIds[0]}`
                      }
                    >
                      Find a screening
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/ticket-prices">How pricing works</Link>
                  </Button>
                </div>
              </div>

              <div className="order-1">
                <Reveal>
                  {/* Depth level 2 — a printed insert lying on the programme
                      page, not a card floating above the interface. */}
                  <OfferComposition
                    offer={offer}
                    className="shadow-[0_10px_28px_-18px_rgb(20_22_31_/_0.45)]"
                  />
                </Reveal>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <DemoNote className="mb-10" tone="loud">
        Sample promotional data written for this demonstration. These offers are not available at any
        real cinema, there are no partner relationships behind them, and the discounts described are
        illustrative only.
      </DemoNote>
    </div>
  );
}
