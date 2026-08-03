import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/routes/Home';
import { Movies } from '@/routes/Movies';
import { usePreferences, DEFAULT_LOCALE } from '@/store/preferences';
import { formattersFor } from '@/i18n/formatters';
import { i18next } from '@/i18n';
import '@/i18n';

/**
 * The two global preferences, tested through the real interface.
 *
 * These assert the behaviours that are easy to break and invisible in a diff:
 * that a language change actually re-renders content owned by the *proxy*
 * vocabularies rather than only the strings a component passes through `t()`,
 * that the theme reaches the document element, and that both survive a reload.
 */

function renderApp(initial = '/movies') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'movies', element: <Movies /> },
        ],
      },
    ],
    { initialEntries: [initial] },
  );
  return render(<RouterProvider router={router} />);
}

const resetPreferences = () => {
  window.localStorage.clear();
  usePreferences.setState({
    locale: DEFAULT_LOCALE,
    theme: 'light',
    themeChosen: false,
    localeChosen: false,
  });
  void i18next.changeLanguage(DEFAULT_LOCALE);
};

beforeEach(resetPreferences);
afterEach(resetPreferences);

describe('the language preference', () => {
  it('translates page copy when Bangla is chosen', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Now showing');

    await user.click(screen.getByRole('button', { name: 'বাংলা' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('এখন চলছে');
  });

  it('re-renders the domain vocabularies, which are proxies rather than hooks', async () => {
    const user = userEvent.setup();
    renderApp();

    // "Drama" comes from `genreLabels`, a read-through proxy — nothing in the
    // filter panel subscribes to i18next for it. It updates only because
    // `Layout` re-renders the tree. This is the test that guards that.
    const filters = screen.getAllByRole('complementary')[0]!;
    expect(within(filters).getByText('Drama')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'বাংলা' }));

    expect(within(filters).getByText('ড্রামা')).toBeInTheDocument();
    expect(within(filters).queryByText('Drama')).not.toBeInTheDocument();
  });

  it('sets the document language so screen readers switch voice', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(document.documentElement.lang).toBe('en');
    await user.click(screen.getByRole('button', { name: 'বাংলা' }));
    expect(document.documentElement.lang).toBe('bn');
  });

  it('persists the choice, and records that it was deliberate', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'বাংলা' }));

    const saved = JSON.parse(window.localStorage.getItem('nokshi.preferences.v1') ?? '{}');
    expect(saved.state.locale).toBe('bn');
    // Without this flag a saved locale is indistinguishable from a detected
    // one, and the browser's language would silently override the choice.
    expect(saved.state.localeChosen).toBe(true);
  });

  it('labels each language in its own language, not in the current one', () => {
    renderApp();
    // A Bangla reader looking for their language should see "বাংলা", whatever
    // the interface currently is. Naming it "Bengali" in English only helps
    // people who already read English.
    // The accessible name is the language's full name in its own script, so
    // a screen reader announces "বাংলা, pressed" rather than "EN".
    expect(screen.getByRole('button', { name: 'বাংলা' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
  });
});

describe('the theme preference', () => {
  it('puts the choice on the document element', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(document.documentElement.dataset.theme).toBe('light');
    await user.click(screen.getByRole('button', { name: /Dark|অন্ধকার/ }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('sets color-scheme, so form controls and scrollbars follow', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: /Dark|অন্ধকার/ }));
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('persists across a reload', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: /Dark|অন্ধকার/ }));

    const saved = JSON.parse(window.localStorage.getItem('nokshi.preferences.v1') ?? '{}');
    expect(saved.state.theme).toBe('dark');
    expect(saved.state.themeChosen).toBe(true);
  });

  it('is announced, so the change is not silent to a screen reader', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

    await user.click(screen.getByRole('button', { name: /Dark|অন্ধকার/ }));

    // Several polite regions exist — the route announcer is one. Any of them
    // carrying the message is the behaviour under test.
    const regions = [...container.ownerDocument.querySelectorAll('[aria-live="polite"]')];
    expect(regions.map((r) => r.textContent).join(' ')).toMatch(/dark theme|অন্ধকার/i);
  });
});

describe('the two preferences together', () => {
  it('are independent — changing the language keeps the theme', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: /Dark|অন্ধকার/ }));
    await user.click(screen.getByRole('button', { name: 'বাংলা' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.lang).toBe('bn');
  });

  it('leaves an existing cinema choice alone', async () => {
    const user = userEvent.setup();
    usePreferences.setState({ cinemaId: 'dhanmondi', cinemaChosen: true });
    renderApp();

    await user.click(screen.getByRole('button', { name: 'বাংলা' }));

    expect(usePreferences.getState().cinemaId).toBe('dhanmondi');
    expect(usePreferences.getState().cinemaChosen).toBe(true);
  });
});

describe('locale-aware formatting', () => {
  it('renders money in Bengali numerals with lakh grouping', () => {
    expect(formattersFor('en').money(115000)).toBe('৳115,000');
    // Bangladesh groups in lakh: ১,১৫,০০০ — not ১১৫,০০০.
    expect(formattersFor('bn').money(115000)).toBe('৳১,১৫,০০০');
  });

  it('names the part of the day before the clock reading in Bangla', () => {
    expect(formattersFor('en').time('20:45')).toBe('8:45 pm');
    expect(formattersFor('bn').time('20:45')).toBe('রাত ৮:৪৫');
  });

  it('keeps identifiers Latin in both languages', () => {
    // A seat id is stencilled on the chair and a reference is read down a
    // phone line. Converting either to Bengali numerals would be actively bad.
    expect(formattersFor('bn').identifier('F12')).toBe('F12');
    expect(formattersFor('bn').identifier('NX-4K7Q')).toBe('NX-4K7Q');
  });

  it('formats runtimes with translated units', () => {
    expect(formattersFor('en').runtime(165)).toBe('2h 45m');
    expect(formattersFor('bn').runtime(165)).toBe('২ঘ ৪৫মি');
  });
});
