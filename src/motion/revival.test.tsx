import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

import { TooltipProvider } from '@/components/ui/popover';
import { MotionProvider } from './MotionProvider';
import { AnimatedNumber } from './AnimatedNumber';
import { Reveal, Stagger, StaggerItem } from './Reveal';
import { staggerFor, duration } from './tokens';
import { MovieCard } from '@/components/movie/MovieCard';
import { FeaturedStage } from '@/components/home/FeaturedStage';
import { nowShowing } from '@/data/movies';
import { genreLabels, languageLabels } from '@/data';
import { runtimeLabelShort } from '@/lib/movieMeta';

function renderMotion(element: ReactElement) {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <MotionProvider>{element}</MotionProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MOTION PRIMITIVES
   ══════════════════════════════════════════════════════════════════════ */

describe('animated numbers', () => {
  it('always exposes the true final value to assistive technology', () => {
    const { container } = renderMotion(
      <AnimatedNumber value={1815} format={(n) => `৳${Math.round(n)}`} />,
    );
    // The screen-reader copy carries the true value from the first frame,
    // whatever the visible digits happen to be doing mid-count.
    const srOnly = container.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe('৳1815');
    // …and the counting digits are hidden from assistive tech.
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders the exact value on mount rather than counting up to it', () => {
    const { container } = renderMotion(<AnimatedNumber value={42} />);
    expect(container.textContent).toBe('4242');
  });
});

describe('reveals', () => {
  it('keeps revealed content in the document and in the a11y tree', () => {
    renderMotion(
      <Reveal>
        <p>Programme note</p>
      </Reveal>,
    );
    expect(screen.getByText('Programme note')).toBeInTheDocument();
  });

  it('renders every staggered child', () => {
    renderMotion(
      <Stagger as="ul" count={3}>
        {['one', 'two', 'three'].map((label) => (
          <StaggerItem as="li" key={label}>
            {label}
          </StaggerItem>
        ))}
      </Stagger>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('caps total stagger time however many children there are', () => {
    // A forty-item catalogue must not take longer to arrive than a four-item row.
    const four = staggerFor(4) * 3;
    const forty = staggerFor(40) * 39;
    expect(forty).toBeLessThanOrEqual(0.33);
    expect(four).toBeLessThanOrEqual(0.33);
  });

  it('keeps every duration token short enough not to feel like waiting', () => {
    for (const [name, seconds] of Object.entries(duration)) {
      // Nothing interactive may exceed half a second; only atmosphere may.
      if (name === 'cinematic') expect(seconds).toBeLessThanOrEqual(1);
      else expect(seconds).toBeLessThanOrEqual(0.5);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════
   NOTHING HIDES BEHIND HOVER
   ══════════════════════════════════════════════════════════════════════ */

describe('movie cards', () => {
  it('exposes exactly one link, reachable without hover', () => {
    const movie = nowShowing[0]!;
    renderMotion(<MovieCard movie={movie} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', `/movies/${movie.slug}`);
  });

  it('keeps the hover cue decorative — it is never the only route anywhere', () => {
    const movie = nowShowing[0]!;
    const { container } = renderMotion(<MovieCard movie={movie} />);
    const cue = [...container.querySelectorAll('[aria-hidden="true"]')].find((node) =>
      node.textContent?.includes('View showtimes'),
    );
    expect(cue).toBeDefined();
  });

  it('shows the film’s essential metadata without any interaction', () => {
    const movie = nowShowing[0]!;
    const { container } = renderMotion(<MovieCard movie={movie} />);

    // Title, certificate, runtime, language and genre must all be readable
    // before anybody hovers, focuses or taps anything.
    expect(screen.getByRole('heading', { name: movie.title })).toBeInTheDocument();
    expect(container).toHaveTextContent(runtimeLabelShort(movie));
    expect(container).toHaveTextContent(languageLabels[movie.language]);
    expect(container).toHaveTextContent(genreLabels[movie.genres[0]!]);
  });

  it('renders a real local poster, not generated artwork', () => {
    const movie = nowShowing[0]!;
    const { container } = renderMotion(<MovieCard movie={movie} />);

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toMatch(/^\/media\/movies\/posters\//);
    // Intrinsic dimensions are set, so the grid cannot shift as posters load.
    expect(img).toHaveAttribute('width');
    expect(img).toHaveAttribute('height');
    // Nothing may be fetched from a remote host.
    expect(img!.getAttribute('src')).not.toMatch(/^https?:/);
    for (const source of container.querySelectorAll('source')) {
      expect(source.getAttribute('srcset')).not.toMatch(/^https?:/);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════
   THE FEATURED STAGE
   ══════════════════════════════════════════════════════════════════════ */

describe('the featured stage', () => {
  it('offers manual navigation between films', async () => {
    const user = userEvent.setup();
    renderMotion(<FeaturedStage />);

    const controls = screen.getAllByRole('button', { name: /^Show / });
    expect(controls.length).toBeGreaterThan(1);

    const firstHeading = screen.getByRole('heading', { level: 1 }).textContent;
    await user.click(controls[1]!);

    // The scene swaps under AnimatePresence `mode="wait"`, so the outgoing
    // film is still mounted for the length of its exit.
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 }).textContent).not.toBe(firstHeading),
    );
  });

  it('exposes a pause control for the auto-advancing sequence', () => {
    renderMotion(<FeaturedStage />);
    expect(
      screen.getByRole('button', { name: /pause the featured film sequence/i }),
    ).toBeInTheDocument();
  });

  it('stops advancing once the customer takes control', async () => {
    const user = userEvent.setup();
    renderMotion(<FeaturedStage />);

    await user.click(screen.getAllByRole('button', { name: /^Show / })[1]!);
    // Having interacted, the control now offers to resume rather than pause —
    // the sequence has yielded to the customer.
    expect(
      screen.getByRole('button', { name: /resume the featured film sequence/i }),
    ).toBeInTheDocument();
  });

  it('marks the showing film with aria-current', () => {
    renderMotion(<FeaturedStage />);
    const current = screen
      .getAllByRole('button', { name: /^Show / })
      .filter((node) => node.getAttribute('aria-current') === 'true');
    expect(current).toHaveLength(1);
  });

  it('always presents a booking route for the featured film', () => {
    renderMotion(<FeaturedStage />);
    const book = screen.getByRole('link', { name: /^Book / });
    expect(book.getAttribute('href')).toMatch(/^\/booking\//);
  });
});

/* ══════════════════════════════════════════════════════════════════════
   REDUCED MOTION
   ══════════════════════════════════════════════════════════════════════ */

describe('reduced motion', () => {
  function withReducedMotion() {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }

  it('still renders revealed content when motion is reduced', () => {
    withReducedMotion();
    renderMotion(
      <Reveal>
        <p>Still here</p>
      </Reveal>,
    );
    expect(screen.getByText('Still here')).toBeInTheDocument();
  });

  it('still renders the stage and its controls when motion is reduced', () => {
    withReducedMotion();
    renderMotion(<FeaturedStage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Show / }).length).toBeGreaterThan(1);
  });

  it('still exposes the final number when motion is reduced', () => {
    withReducedMotion();
    const { container } = renderMotion(
      <AnimatedNumber value={950} format={(n) => `৳${Math.round(n)}`} />,
    );
    expect(container.querySelector('.sr-only')?.textContent).toBe('৳950');
  });
});
