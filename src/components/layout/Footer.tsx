import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { COMPANY } from '@/data/policies';
import { cinemas } from '@/data/cinemas';

const columns = [
  {
    heading: 'Programme',
    links: [
      { to: '/movies', label: 'Now showing' },
      { to: '/movies?status=coming-soon', label: 'Coming soon' },
      { to: '/showtimes', label: 'Showtimes' },
      { to: '/offers', label: 'Offers' },
    ],
  },
  {
    heading: 'Visiting',
    links: [
      { to: '/cinemas', label: 'All cinemas' },
      { to: '/concessions', label: 'The counter' },
      { to: '/ticket-prices', label: 'Ticket prices' },
      { to: '/contact', label: 'Contact & support' },
    ],
  },
  {
    heading: 'Your visit',
    links: [
      { to: '/bookings', label: 'My bookings' },
      { to: '/about', label: 'About Nokshi' },
      { to: '/contact#access', label: 'Accessibility' },
      { to: '/contact#lost', label: 'Lost property' },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer data-app-footer className="mt-20 border-t-2 border-ink bg-paper-sunken/60">
      <div className="shell py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo size="md" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-ink-muted">
              Nine screens across five houses in Dhaka, Chattogram and Sylhet. The programme changes
              every Thursday.
            </p>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              <a href={`tel:${COMPANY.supportPhone.replace(/\s/g, '')}`} className="underline underline-offset-4">
                {COMPANY.supportPhone}
              </a>
              <br />
              <a href={`mailto:${COMPANY.supportEmail}`} className="underline underline-offset-4">
                {COMPANY.supportEmail}
              </a>
              <br />
              <span className="text-ink-muted/80">{COMPANY.supportHours}</span>
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="eyebrow mb-4">{column.heading}</h2>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-hairline pt-6">
          <h2 className="eyebrow mb-3">Our houses</h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {cinemas.map((cinema) => (
              <li key={cinema.id}>
                <Link
                  to={`/cinemas/${cinema.slug}`}
                  className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  {cinema.shortName}
                  <span className="text-ink-muted/60"> · {cinema.city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t-2 border-ink pt-6 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-ink-muted">
            <strong className="font-semibold text-ink">A demonstration build.</strong> Nokshi Cinemas
            is not a real cinema chain. Every film, venue, schedule, seat, price, offer and policy on
            this site is sample data written for this project. No payment is taken and no information
            leaves your browser — bookings are stored in this browser's local storage only.
          </p>
          <p className="shrink-0 text-xs text-ink-muted">© {year} Nokshi Cinemas</p>
        </div>
      </div>
    </footer>
  );
}
