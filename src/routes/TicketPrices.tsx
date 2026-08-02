import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { DemoNote, RuleHeading } from '@/components/ui/misc';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/disclosure';
import {
  BOOKING_FEE_PER_TICKET,
  MATINEE_DISCOUNT,
  WEEKEND_UPLIFT,
  certificates,
  formatUplift,
  seatClassBase,
  ticketCategories,
} from '@/data/pricing';
import { formatLabels, faq } from '@/data';
import { insurancePolicy, refundPolicy } from '@/data/policies';
import { money } from '@/lib/format';
import type { Format, SeatClass } from '@/data/types';

const seatClasses: Array<{ id: SeatClass; label: string; note: string }> = [
  { id: 'regular', label: 'Regular', note: 'The bulk of every house.' },
  { id: 'premium', label: 'Premium', note: 'Wider seats, further back, in the middle blocks.' },
  { id: 'recliner', label: 'Recliner', note: 'Velvet Room only. Full recline, with a side table.' },
  {
    id: 'wheelchair',
    label: 'Wheelchair space',
    note: 'Always charged at the regular rate, wherever it sits.',
  },
];

const formatOrder: Format[] = ['standard', 'three-d', 'grandscreen', 'velvet'];

export function TicketPrices() {
  const pricingFaq = faq.filter((entry) => entry.topic === 'pricing' || entry.topic === 'refunds');

  return (
    <div className="shell">
      <PageHeader
        eyebrow="What it costs"
        title="Ticket prices"
        lede="A ticket is built in four steps: the seat, the format, the time, and who is sitting in it. Nothing is added afterwards except one clearly-shown booking fee."
      />

      <div className="grid gap-12 py-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="min-w-0">
          {/* ── The four steps ─────────────────────────────────────── */}
          <section aria-labelledby="build">
            <RuleHeading id="build" className="mb-6">
              How a price is built
            </RuleHeading>

            <ol className="space-y-8">
              <li>
                <div className="flex items-baseline gap-4">
                  <span aria-hidden="true" className="numeral font-display text-2xl text-ink/30">
                    01
                  </span>
                  <h3 className="font-display text-xl leading-tight">Start with the seat</h3>
                </div>
                <dl className="mt-3 pl-11">
                  {seatClasses.map((seat) => (
                    <div
                      key={seat.id}
                      className="flex items-baseline justify-between gap-6 border-b border-hairline py-2.5"
                    >
                      <dt>
                        <span className="font-medium">{seat.label}</span>
                        <span className="block text-[0.8125rem] text-ink-muted">{seat.note}</span>
                      </dt>
                      <dd className="numeral shrink-0 font-semibold">
                        {money(seatClassBase[seat.id])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>

              <li>
                <div className="flex items-baseline gap-4">
                  <span aria-hidden="true" className="numeral font-display text-2xl text-ink/30">
                    02
                  </span>
                  <h3 className="font-display text-xl leading-tight">Add the format</h3>
                </div>
                <dl className="mt-3 pl-11">
                  {formatOrder.map((format) => (
                    <div
                      key={format}
                      className="flex items-baseline justify-between gap-6 border-b border-hairline py-2.5"
                    >
                      <dt className="font-medium">{formatLabels[format]}</dt>
                      <dd className="numeral shrink-0 font-semibold">
                        {formatUplift[format] === 0 ? 'No uplift' : `+ ${money(formatUplift[format])}`}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>

              <li>
                <div className="flex items-baseline gap-4">
                  <span aria-hidden="true" className="numeral font-display text-2xl text-ink/30">
                    03
                  </span>
                  <h3 className="font-display text-xl leading-tight">Adjust for when</h3>
                </div>
                <dl className="mt-3 pl-11">
                  <div className="flex items-baseline justify-between gap-6 border-b border-hairline py-2.5">
                    <dt>
                      <span className="font-medium">Before three</span>
                      <span className="block text-[0.8125rem] text-ink-muted">
                        Any screening starting before 15:00, seven days a week.
                      </span>
                    </dt>
                    <dd className="numeral shrink-0 font-semibold text-ok">
                      − {money(MATINEE_DISCOUNT)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-6 border-b border-hairline py-2.5">
                    <dt>
                      <span className="font-medium">Friday and Saturday</span>
                      <span className="block text-[0.8125rem] text-ink-muted">
                        The weekend uplift, applied to the seat price.
                      </span>
                    </dt>
                    <dd className="numeral shrink-0 font-semibold">+ {money(WEEKEND_UPLIFT)}</dd>
                  </div>
                </dl>
              </li>

              <li>
                <div className="flex items-baseline gap-4">
                  <span aria-hidden="true" className="numeral font-display text-2xl text-ink/30">
                    04
                  </span>
                  <h3 className="font-display text-xl leading-tight">Apply the age category</h3>
                </div>
                <p className="mt-2 max-w-prose pl-11 text-[0.9375rem] leading-7 text-ink-muted">
                  You choose a category when you pick your tickets. We never ask for a date of birth,
                  and this site does not verify anyone's age — the door does.
                </p>
                <dl className="mt-3 pl-11">
                  {ticketCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-baseline justify-between gap-6 border-b border-hairline py-2.5"
                    >
                      <dt>
                        <span className="font-medium">{category.label}</span>
                        <span lang="bn" className="ml-2 text-ink-muted">
                          {category.labelBn}
                        </span>
                        <span className="block text-[0.8125rem] text-ink-muted">
                          {category.description}
                        </span>
                      </dt>
                      <dd className="numeral shrink-0 font-semibold">
                        {category.multiplier === 1 ? 'Full price' : `× ${category.multiplier}`}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            </ol>

            <div className="mt-8 border-2 border-ink p-5">
              <h3 className="eyebrow mb-2">The only fee</h3>
              <p className="max-w-prose text-[0.9375rem] leading-7">
                <span className="numeral font-semibold">{money(BOOKING_FEE_PER_TICKET)} per ticket</span>{' '}
                for booking online. It is shown on the ticket step, in every running total, on the
                review page and on your confirmation. There is nothing else — no service charge, no
                card fee, no per-booking charge added at the end.
              </p>
            </div>
          </section>

          {/* ── A worked example ───────────────────────────────────── */}
          <section aria-labelledby="worked" className="mt-14">
            <RuleHeading id="worked" className="mb-5">
              A worked example
            </RuleHeading>
            <p className="mb-4 max-w-prose text-[0.9375rem] leading-7 text-ink-muted">
              Two adults and one child, in premium seats, at a Grandscreen screening at 18:30 on a
              Saturday.
            </p>
            <dl className="max-w-lg border-t-2 border-ink">
              {[
                { label: 'Premium seat', value: money(450) },
                { label: 'Grandscreen uplift', value: `+ ${money(150)}` },
                { label: 'Saturday uplift', value: `+ ${money(50)}` },
                { label: 'Seat price', value: money(650), rule: true },
                { label: 'Adult × 2', value: money(1300) },
                { label: 'Child × 1 (×0.7)', value: money(455) },
                { label: 'Booking fee × 3', value: money(60) },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex items-baseline justify-between gap-6 py-2.5 ${row.rule ? 'border-b-2 border-ink font-semibold' : 'border-b border-hairline'}`}
                >
                  <dt>{row.label}</dt>
                  <dd className="numeral shrink-0">{row.value}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-6 border-b-2 border-ink py-3 font-display text-xl">
                <dt>Total</dt>
                <dd className="numeral">{money(1815)}</dd>
              </div>
            </dl>
          </section>

          {/* ── Certificates ───────────────────────────────────────── */}
          <section aria-labelledby="certs" className="mt-14">
            <RuleHeading id="certs" className="mb-5">
              Certificates
            </RuleHeading>
            <dl className="max-w-prose">
              {Object.values(certificates).map((certificate) => (
                <div key={certificate.code} className="border-b border-hairline py-3">
                  <dt className="font-semibold">{certificate.label}</dt>
                  <dd className="mt-1 text-[0.9375rem] leading-7 text-ink-muted">
                    {certificate.guidance}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── FAQ ────────────────────────────────────────────────── */}
          <section aria-labelledby="price-faq" className="mt-14">
            <RuleHeading id="price-faq" className="mb-3">
              Questions
            </RuleHeading>
            <Accordion type="single" collapsible className="border-b border-hairline">
              {pricingFaq.map((entry) => (
                <AccordionItem key={entry.id} value={entry.id}>
                  <AccordionTrigger>{entry.question}</AccordionTrigger>
                  <AccordionContent>{entry.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <section aria-labelledby="cover" className="border border-hairline-strong p-5">
            <h2 id="cover" className="eyebrow mb-3">
              {insurancePolicy.name}
            </h2>
            <p className="numeral mb-3 font-display text-2xl leading-none">
              {money(insurancePolicy.fee)}
              <span className="ml-1.5 text-sm font-sans text-ink-muted">per booking</span>
            </p>
            <p className="text-[0.875rem] leading-7 text-ink-muted">
              {insurancePolicy.coverageSummary}
            </p>
            <h3 className="eyebrow mb-2 mt-4">Covers</h3>
            <ul className="space-y-1.5">
              {insurancePolicy.coveredReasons.map((reason) => (
                <li key={reason.id} className="flex gap-2 text-[0.875rem] leading-6 text-ink-muted">
                  <span aria-hidden="true" className="mt-[0.55em] block size-1 shrink-0 bg-ok" />
                  {reason.label}
                </li>
              ))}
            </ul>
            <h3 className="eyebrow mb-2 mt-4">Does not cover</h3>
            <ul className="space-y-1.5">
              {insurancePolicy.exclusions.map((exclusion) => (
                <li key={exclusion} className="flex gap-2 text-[0.875rem] leading-6 text-ink-muted">
                  <span aria-hidden="true" className="mt-[0.55em] block size-1 shrink-0 bg-danger" />
                  {exclusion}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="refunds" className="mt-6 border border-hairline-strong p-5">
            <h2 id="refunds" className="eyebrow mb-3">
              Refunds and exchanges
            </h2>
            <p className="text-[0.875rem] leading-7 text-ink-muted">{refundPolicy.summary}</p>
            <p className="mt-3 text-[0.8125rem] leading-6 text-ink-muted">{refundPolicy.demoNote}</p>
          </section>

          <div className="mt-6">
            <Button asChild block size="lg">
              <Link to="/showtimes">Find a screening</Link>
            </Button>
          </div>
        </aside>
      </div>

      <DemoNote className="mb-10" tone="loud">
        Every figure on this page is sample pricing in Bangladeshi taka, authored for this
        demonstration. These are not the prices of any real cinema and no payment is ever taken.
      </DemoNote>
    </div>
  );
}
