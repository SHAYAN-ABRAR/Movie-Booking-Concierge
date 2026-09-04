import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

import { MotionProvider } from '@/motion/MotionProvider';
import { OfferArtwork } from './OfferArtwork';
import { ConcessionImage } from './ConcessionImage';
import { concessionImageById } from '@/data/concessionMedia';
import { EmptyDrawing } from './EmptyStates';
import type { EmptyVariant } from './EmptyStates';
import { EmptyState } from '@/components/common';
import { offerArtFor, undesignedOfferIds } from '@/data/offerArt';
import { offers } from '@/data/offers';
import { en } from '@/i18n/resources/en';
import { bn } from '@/i18n/resources/bn';
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

  it('sets the figure as real text rather than baking it into the artwork', () => {
    // The whole reason the artwork is generated with an empty region. A figure
    // drawn into the picture could not be translated, selected or read aloud —
    // and on a promotion the figure is the entire message.
    for (const offer of offers) {
      const { container, unmount } = renderMotion(<OfferArtwork offer={offer} />);
      const figure = offerArtFor(offer.id).figure;
      expect(container.textContent).toContain(figure);
      unmount();
    }
  });

  it('keeps the translated figure identical to the one checked against the copy', () => {
    // The figure is honesty-checked against the offer's own mechanic on
    // `offerArt`, but what actually renders is the locale resource. If the two
    // drift, the poster starts advertising a discount the page never states —
    // and the honesty check would not notice.
    for (const offer of offers) {
      const art = offerArtFor(offer.id);
      expect(art.figureKey, `${offer.id} has no figure key`).toBeDefined();
      const pair = en.offers.figures[art.figureKey!];
      expect(pair.figure, offer.id).toBe(art.figure);
      expect(pair.note, offer.id).toBe(art.figureNote);
    }
  });

  it('prints the figure in Bengali numerals in Bangla', () => {
    // ৳200 is not readable copy in Bangla, and a number baked into the picture
    // could never have become ৳২০০. Latin digits surviving here would mean the
    // whole keep-it-out-of-the-image decision bought nothing.
    for (const offer of offers) {
      const key = offerArtFor(offer.id).figureKey!;
      const figure = bn.offers.figures[key].figure;
      expect(figure, `${offer.id} is still in Latin digits`).not.toMatch(/[0-9]/);
      expect(bn.offers.figures[key].note, offer.id).not.toBe(en.offers.figures[key].note);
    }
  });

  it('describes the artwork for anyone who cannot see it', () => {
    const { container } = renderMotion(<OfferArtwork offer={offers[0]!} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')?.length ?? 0).toBeGreaterThan(20);
  });
});

/* ══════════════════════════════════════════════════════════════════════
   COUNTER IMAGERY — AI-generated
   ══════════════════════════════════════════════════════════════════════ */

describe('counter imagery', () => {
  it('gives every item on the counter its own generated image', () => {
    for (const item of concessions) {
      const image = concessionImageById.get(item.id);
      expect(image, `no image for ${item.id}`).toBeDefined();
      expect(image!.basePath).toMatch(/^\/media\/concessions\//);
      expect(image!.widths.length).toBeGreaterThan(0);
      expect(image!.alt.length).toBeGreaterThan(8);
    }
  });

  it('records honest AI provenance, not a photographer credit', () => {
    for (const item of concessions) {
      const image = concessionImageById.get(item.id)!;
      // Declared generated, with model and date — and flagged illustrative so
      // nothing downstream can present it as a real serving.
      expect(image.sourceType, item.id).toBe('ai-generated');
      expect(image.model, item.id).toBeTruthy();
      expect(image.generatedAt, item.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(image.prompt.length, item.id).toBeGreaterThan(20);
      expect(image.illustrative, item.id).toBe(true);
      // The old photographer-attribution fields must be gone — leaving one on a
      // generated image would be a false credit.
      expect('licence' in image, `${item.id} still carries a licence field`).toBe(false);
      expect('creator' in image, `${item.id} still carries a creator field`).toBe(false);
    }
  });

  it('never reuses one image for two items', () => {
    const paths = concessions
      .map((item) => concessionImageById.get(item.id)?.basePath)
      .filter(Boolean);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('renders a local image, never a remote URL', () => {
    const { container } = render(<ConcessionImage item={concessions[0]!} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toMatch(/^\/media\/concessions\//);
    expect(img!.getAttribute('src')).not.toMatch(/^https?:/);
    for (const source of container.querySelectorAll('source')) {
      expect(source.getAttribute('srcset')).not.toMatch(/^https?:/);
    }
  });

  it('reserves the box before the bytes arrive', () => {
    const { container } = render(<ConcessionImage item={concessions[0]!} />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('width');
    expect(img).toHaveAttribute('height');
  });

  it('describes the food rather than naming a file', () => {
    const { container } = render(<ConcessionImage item={concessions[0]!} />);
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
