import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

import { MotionProvider } from '@/motion/MotionProvider';
import { OfferComposition } from './OfferComposition';
import { ConcessionPhoto } from './ConcessionPhoto';
import { concessionPhotoById } from '@/data/concessionMedia';
import { EmptyDrawing } from './EmptyStates';
import type { EmptyVariant } from './EmptyStates';
import { EmptyState } from '@/components/common';
import { offerArtFor, undesignedOfferIds } from '@/data/offerArt';
import { offers } from '@/data/offers';
import { concessions } from '@/data/concessions';

function renderMotion(element: ReactElement) {
  return render(
    <MemoryRouter>
      <MotionProvider>{element}</MotionProvider>
    </MemoryRouter>,
  );
}

/* ══════════════════════════════════════════════════════════════════════
   OFFER STATIONERY
   ══════════════════════════════════════════════════════════════════════ */

describe('offer compositions', () => {
  it('gives every shipped offer hand-authored art direction', () => {
    // The fallback exists so a new offer is never *broken*, but nothing in the
    // programme should be relying on it.
    expect(undesignedOfferIds).toEqual([]);
  });

  it('draws each offer as a different piece of stationery', () => {
    const compositions = offers.map((offer) => offerArtFor(offer.id).composition);
    expect(new Set(compositions).size).toBe(offers.length);
  });

  it('is deterministic — the same offer always draws the same object', () => {
    for (const offer of offers) {
      expect(offerArtFor(offer.id)).toEqual(offerArtFor(offer.id));
    }
  });

  it('prints a figure that is traceable to the offer’s own copy', () => {
    // The composition may only print a value the page already states in words.
    // Currency and percent marks are furniture; ordinals are spelled out in the
    // copy ("First Saturday") but set as digits in the artwork ("1st").
    const ordinals: Record<string, string> = {
      '1st': 'first',
      '2nd': 'second',
      '3rd': 'third',
      '4th': 'fourth',
    };
    const normalise = (value: string) => {
      const bare = value.replace(/[৳%]/g, '').trim().toLowerCase();
      return ordinals[bare] ?? bare;
    };

    for (const offer of offers) {
      const claimed = normalise(offerArtFor(offer.id).figure);
      const stated = `${offer.mechanic} ${offer.detail} ${offer.summary}`.toLowerCase();
      expect(stated).toContain(claimed);
    }
  });

  it('keeps the drawing out of the accessibility tree', () => {
    const { container } = renderMotion(<OfferComposition offer={offers[0]!} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('re-composes rather than scales between the full and tile variants', () => {
    const full = renderMotion(<OfferComposition offer={offers[1]!} variant="full" />);
    const fullBox = full.container.querySelector('svg')?.getAttribute('viewBox');
    full.unmount();

    const tile = renderMotion(<OfferComposition offer={offers[1]!} variant="tile" />);
    const tileBox = tile.container.querySelector('svg')?.getAttribute('viewBox');

    expect(fullBox).toBeTruthy();
    expect(tileBox).toBeTruthy();
    expect(fullBox).not.toEqual(tileBox);
  });
});

/* ══════════════════════════════════════════════════════════════════════
   COUNTER PHOTOGRAPHY
   ══════════════════════════════════════════════════════════════════════ */

describe('counter photography', () => {
  it('gives every item on the counter its own real photograph', () => {
    for (const item of concessions) {
      const photo = concessionPhotoById.get(item.id);
      expect(photo, `no photograph for ${item.id}`).toBeDefined();
      expect(photo!.basePath).toMatch(/^\/media\/concessions\//);
      expect(photo!.widths.length).toBeGreaterThan(0);
      expect(photo!.alt.length).toBeGreaterThan(8);
      // Attribution is not optional.
      expect(photo!.licence).toBeTruthy();
      expect(photo!.sourcePage).toMatch(/^https?:/);
    }
  });

  it('never reuses one photograph for two items', () => {
    const paths = concessions
      .map((item) => concessionPhotoById.get(item.id)?.basePath)
      .filter(Boolean);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('renders a local photograph, never a remote URL', () => {
    const { container } = render(<ConcessionPhoto item={concessions[0]!} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toMatch(/^\/media\/concessions\//);
    expect(img!.getAttribute('src')).not.toMatch(/^https?:/);
    for (const source of container.querySelectorAll('source')) {
      expect(source.getAttribute('srcset')).not.toMatch(/^https?:/);
    }
  });

  it('reserves the box before the bytes arrive', () => {
    const { container } = render(<ConcessionPhoto item={concessions[0]!} />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('width');
    expect(img).toHaveAttribute('height');
  });

  it('describes the food rather than naming a file', () => {
    const { container } = render(<ConcessionPhoto item={concessions[0]!} />);
    const alt = container.querySelector('img')!.getAttribute('alt') ?? '';
    expect(alt).not.toMatch(/\.(jpg|png|webp|avif)/i);
    expect(alt.split(' ').length).toBeGreaterThan(2);
  });
});

/* ══════════════════════════════════════════════════════════════════════
   EMPTY STATES
   ══════════════════════════════════════════════════════════════════════ */

describe('empty states', () => {
  const variants: EmptyVariant[] = ['schedule', 'index', 'receipt', 'ticket-book', 'alerts'];

  it('draws a structurally different composition per context', () => {
    const shapes = variants.map((variant) => {
      const { container, unmount } = render(<EmptyDrawing variant={variant} />);
      const html = container.innerHTML;
      unmount();
      return html;
    });
    expect(new Set(shapes).size).toBe(variants.length);
  });

  it('keeps every drawing out of the accessibility tree', () => {
    for (const variant of variants) {
      const { container, unmount } = render(<EmptyDrawing variant={variant} />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      unmount();
    }
  });

  it('still exposes the heading, body and action alongside the drawing', () => {
    render(
      <EmptyState
        variant="schedule"
        title="Nothing scheduled"
        body={<p>Try another day on the strip above.</p>}
        action={<button type="button">Clear filters</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Nothing scheduled' })).toBeInTheDocument();
    expect(screen.getByText(/try another day/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('still renders without a variant, for any call site not yet given a drawing', () => {
    const { container } = render(<EmptyState title="Nothing here" body={<p>Body copy.</p>} />);
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });
});
