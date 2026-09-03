import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { brand } from '@/config/brand';
import { COMPANY } from '@/data/policies';
import { cinemas } from '@/data/cinemas';
import { useFormatters } from '@/i18n/useFormatters';

const columns = [
  {
    heading: 'footer.columns.programme',
    links: [
      { to: '/movies', key: 'footer.links.nowShowing' },
      { to: '/movies?status=coming-soon', key: 'footer.links.comingSoon' },
      { to: '/showtimes', key: 'footer.links.showtimes' },
      { to: '/offers', key: 'footer.links.offers' },
    ],
  },
  {
    heading: 'footer.columns.visiting',
    links: [
      { to: '/cinemas', key: 'footer.links.allCinemas' },
      { to: '/concessions', key: 'footer.links.theCounter' },
      { to: '/ticket-prices', key: 'footer.links.ticketPrices' },
      { to: '/contact', key: 'footer.links.contactSupport' },
    ],
  },
  {
    heading: 'footer.columns.yourVisit',
    links: [
      { to: '/bookings', key: 'footer.links.myBookings' },
      { to: '/about', key: 'footer.links.aboutGrandPlex' },
      { to: '/contact#access', key: 'footer.links.accessibility' },
      { to: '/contact#lost', key: 'footer.links.lostProperty' },
    ],
  },
] as const;

/**
 * The colophon.
 *
 * A festival programme signs off with its own name set as large as the page
 * will allow, and that is exactly what this does: the wordmark is drawn once,
 * full measure, as the last thing on every page. It costs one line of type and
 * it is the single strongest piece of branding in the product.
 *
 * `aria-hidden`, because the name has already been announced by the masthead —
 * repeating it at the bottom of every route would be noise, not information.
 */
function Colophon() {
  return (
    <div aria-hidden="true" className="mt-12 flex items-stretch leading-[0.78]">
      <span
        className="font-display uppercase tracking-[-0.045em]"
        style={{ fontSize: 'clamp(3rem, 13.2vw, 12rem)' }}
      >
        Grand
      </span>
      <span
        className="bg-signal font-display uppercase tracking-[-0.045em] text-white"
        style={{ fontSize: 'clamp(3rem, 13.2vw, 12rem)', paddingInline: '0.05em' }}
      >
        Plex
      </span>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const f = useFormatters();
  const year = new Date().getFullYear();

  return (
    <footer data-app-footer className="mt-24 border-t-2 border-content bg-surface-sunken/50">
      <div className="shell py-12">
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <h2 className="eyebrow mb-4">{t('footer.columns.contact')}</h2>
            <p className="max-w-xs text-sm leading-6 text-content-muted">{t('footer.blurb')}</p>
            <p className="mt-4 text-sm leading-6">
              {/* Telephone and email stay Latin in every language — they are
                  dialled and typed, not read. */}
              <a
                href={`tel:${COMPANY.supportPhone.replace(/\s/g, '')}`}
                className="numeral underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
              >
                {f.identifier(COMPANY.supportPhone)}
              </a>
              <br />
              <a
                href={`mailto:${COMPANY.supportEmail}`}
                className="underline decoration-hairline-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
              >
                {f.identifier(COMPANY.supportEmail)}
              </a>
              <br />
              <span className="text-content-faint">{COMPANY.supportHours}</span>
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={t(column.heading)}>
              <h2 className="eyebrow mb-4">{t(column.heading)}</h2>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      to={link.to}
                      className="text-sm text-content-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-hairline pt-6">
          <h2 className="eyebrow mb-3">{t('footer.houses')}</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {cinemas.map((cinema) => (
              <li key={cinema.id}>
                <Link
                  to={`/cinemas/${cinema.slug}`}
                  className="text-sm text-content-muted underline-offset-4 hover:text-accent hover:underline"
                >
                  {cinema.shortName}
                  <span className="text-content-faint"> · {cinema.city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Colophon />

        <div className="mt-6 flex flex-col gap-4 border-t-2 border-content pt-6 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-content-muted">
            <strong className="font-semibold text-content">{t('footer.demonstrationTitle')}</strong>{' '}
            {t('footer.demonstrationBody')}
          </p>
          <p className="numeral shrink-0 text-xs text-content-faint">
            {t('footer.copyright', { year: f.plain(year) })}
            <span className="sr-only"> {brand.name}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
