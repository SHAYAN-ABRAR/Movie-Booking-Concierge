import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MotionProvider } from '@/motion';
import { TooltipProvider } from '@/components/ui/popover';
import { TrailerButton, TrailerViewer } from './TrailerDialog';
import { useTrailerViewer } from './trailerViewer';
import { SelectedMovieStory } from './SelectedMovieStory';
import { movies, getMovie } from '@/data';
import { usePreferences, DEFAULT_LOCALE } from '@/store/preferences';
import { brand, BOOKING_REFERENCE_PATTERN } from '@/config/brand';
import { makeReference, isBookingReference, isLegacyReference } from '@/store/bookings';
import { i18next } from '@/i18n';
import '@/i18n';

function renderIn(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <MotionProvider>
        {/* The certificate chip inside the panel is a tooltip trigger, and in
            the real tree `Layout` supplies this provider. */}
        <TooltipProvider>
          {ui}
          {/* The one player, mounted by `Layout` in the real tree. Triggers
              only ask the store to show a film; this is what renders it. */}
          <TrailerViewer />
        </TooltipProvider>
      </MotionProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  usePreferences.setState({ locale: DEFAULT_LOCALE });
  useTrailerViewer.setState({ movieId: null, returnFocusTo: null });
  void i18next.changeLanguage(DEFAULT_LOCALE);
});

describe('the trailer catalogue', () => {
  it('gives every film a trailer or an explicit reason there is none', () => {
    for (const movie of movies) {
      expect(
        Boolean(movie.trailer) || Boolean(movie.trailerStatus),
        `${movie.title} has neither a trailer nor a trailerStatus`,
      ).toBe(true);
    }
  });

  it('records the publishing channel for every trailer', () => {
    // Provenance is the only thing separating an official trailer from a fan
    // reupload — a video's own title is written by whoever uploaded it.
    for (const movie of movies) {
      if (!movie.trailer) continue;
      expect(movie.trailer.officialChannel, movie.title).toBeTruthy();
      expect(movie.trailer.verifiedAt, movie.title).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(movie.trailer.provider, movie.title).toBe('youtube');
    }
  });

  it('stores an id, never a URL and never an embed string', () => {
    for (const movie of movies) {
      if (!movie.trailer) continue;
      expect(movie.trailer.videoId, movie.title).toMatch(/^[\w-]{11}$/);
      expect(movie.trailer.videoId, movie.title).not.toContain('<');
      expect(movie.trailer.videoId, movie.title).not.toContain('http');
    }
  });

  it('uses no unofficial trailer host', () => {
    for (const movie of movies) {
      if (!movie.trailer) continue;
      expect(movie.trailer.sourceUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    }
  });
});

describe('the trailer player', () => {
  it('does not load an iframe until the trailer is asked for', async () => {
    const user = userEvent.setup();
    const movie = getMovie('the-odyssey')!;
    renderIn(<TrailerButton movie={movie} />);

    expect(document.querySelector('iframe')).toBeNull();

    await user.click(screen.getByRole('button', { name: /watch trailer/i }));

    const frame = document.querySelector('iframe');
    expect(frame).not.toBeNull();
    // Privacy-enhanced host, and the id from the film's own record.
    expect(frame?.getAttribute('src')).toContain('youtube-nocookie.com/embed/');
    expect(frame?.getAttribute('src')).toContain(movie.trailer!.videoId);
  });

  it('names the dialog after the film, and credits the channel', async () => {
    const user = userEvent.setup();
    const movie = getMovie('backrooms')!;
    renderIn(<TrailerButton movie={movie} />);

    await user.click(screen.getByRole('button', { name: /watch trailer/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(movie.title)).toBeInTheDocument();
    expect(within(dialog).getByText(/A24/)).toBeInTheDocument();
  });

  it('removes the iframe on close, which is what stops playback', async () => {
    const user = userEvent.setup();
    renderIn(<TrailerButton movie={getMovie('the-odyssey')!} />);

    await user.click(screen.getByRole('button', { name: /watch trailer/i }));
    expect(document.querySelector('iframe')).not.toBeNull();

    await user.keyboard('{Escape}');
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('offers the official source as a recovery path for a blocked embed', async () => {
    const user = userEvent.setup();
    const movie = getMovie('the-odyssey')!;
    renderIn(<TrailerButton movie={movie} />);

    await user.click(screen.getByRole('button', { name: /watch trailer/i }));

    const link = within(screen.getByRole('dialog')).getByRole('link', { name: /youtube/i });
    expect(link).toHaveAttribute('href', movie.trailer!.sourceUrl);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders no control at all for a film with no trailer', () => {
    const movie = { ...getMovie('the-odyssey')!, trailer: undefined };
    renderIn(<TrailerButton movie={movie} />);
    // A dead play button is worse than no button.
    expect(screen.queryByRole('button', { name: /watch/i })).toBeNull();
  });

  it('keeps only one player in the tree, whichever trigger opened it', async () => {
    const user = userEvent.setup();
    renderIn(
      <>
        <TrailerButton movie={getMovie('the-odyssey')!} />
        <TrailerButton movie={getMovie('backrooms')!} />
      </>,
    );

    // Two triggers, one viewer. Opening the second must not leave the first
    // mounted — a hidden iframe that is still playing is the failure mode.
    const [first] = screen.getAllByRole('button', { name: /watch trailer/i });
    await user.click(first!);
    expect(document.querySelectorAll('iframe')).toHaveLength(1);

    await user.keyboard('{Escape}');
    const second = screen.getAllByRole('button', { name: /watch trailer/i })[1];
    await user.click(second!);
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain(
      getMovie('backrooms')!.trailer!.videoId,
    );
  });
});

describe('the short stories', () => {
  it('gives every film both languages', () => {
    for (const movie of movies) {
      expect(movie.shortStory, movie.title).toBeTruthy();
      expect(movie.shortStoryBn, movie.title).toBeTruthy();
      expect(movie.shortStoryBn, movie.title).toMatch(/[ঀ-৿]/);
    }
  });

  it('is a different telling, not the synopsis reused', () => {
    for (const movie of movies) {
      const story = movie.shortStory.trim();
      const synopsis = movie.synopsis.trim();

      expect(story, movie.title).not.toBe(synopsis);
      // Nor the synopsis with a sentence bolted on either end — that would pass
      // an equality check while still being the same copy.
      expect(story.includes(synopsis), `${movie.title} wraps the synopsis`).toBe(false);
      expect(synopsis.includes(story), `${movie.title} is a slice of the synopsis`).toBe(false);

      // It has to fit the panel it was written for. Character length is not
      // compared against the synopsis: some catalogue synopses are a single
      // line, so "shorter than the synopsis" would test TMDB's terseness
      // rather than anything about this copy.
      const words = story.split(/\s+/).length;
      expect(words, movie.title).toBeGreaterThanOrEqual(30);
      expect(words, movie.title).toBeLessThanOrEqual(95);
    }
  });

  it('avoids empty marketing filler', () => {
    // The failure mode for generated copy is a paragraph that says nothing.
    const filler = [
      /unforgettable cinematic journey/i,
      /must-watch/i,
      /adventure awaits/i,
      /nothing is what it seems/i,
      /like never before/i,
      /edge of your seat/i,
    ];
    for (const movie of movies) {
      for (const phrase of filler) {
        expect(movie.shortStory, `${movie.title} uses filler`).not.toMatch(phrase);
      }
    }
  });
});

describe('the selected-movie story panel', () => {
  it('shows the chosen film and its story', () => {
    const movie = getMovie('project-hail-mary')!;
    renderIn(<SelectedMovieStory movie={movie} />);

    expect(screen.getByRole('heading', { name: movie.title })).toBeInTheDocument();
    expect(screen.getByText(/Ryland Grace wakes/)).toBeInTheDocument();
  });

  it('renders the Bangla story in Bangla', async () => {
    await i18next.changeLanguage('bn');
    usePreferences.setState({ locale: 'bn' });
    const movie = getMovie('project-hail-mary')!;
    renderIn(<SelectedMovieStory movie={movie} />);

    expect(screen.getByText(/রাইল্যান্ড গ্রেস/)).toBeInTheDocument();
  });

  it('carries the trailer action for the selected film, not another one', async () => {
    const user = userEvent.setup();
    const movie = getMovie('backrooms')!;
    renderIn(<SelectedMovieStory movie={movie} />);

    await user.click(screen.getByRole('button', { name: /watch trailer/i }));
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain(
      movie.trailer!.videoId,
    );
  });

  it('renders nothing when no film is selected', () => {
    const { container } = renderIn(<SelectedMovieStory movie={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers expansion only when the story does not already fit', () => {
    const movie = getMovie('moana')!;
    renderIn(<SelectedMovieStory movie={movie} />);
    // Every catalogue story is long enough to need it; the guard exists so a
    // short one would not get a pointless "Read more" under two lines.
    const toggle = screen.queryByRole('button', { name: /read more/i });
    if (movie.shortStory.length > 140) expect(toggle).toBeInTheDocument();
    else expect(toggle).toBeNull();
  });
});

describe('booking references across the rebrand', () => {
  it('issues new references under the GrandPlex prefix', () => {
    const reference = makeReference({
      showtimeId: 'st-1',
      seatIds: ['F7', 'F8'],
      email: 'someone@example.com',
      createdAt: '2026-08-04T10:00:00.000Z',
    });
    expect(reference.startsWith(`${brand.bookingReferencePrefix}-`)).toBe(true);
    expect(reference).toMatch(/^GP-[A-Z0-9]{6}$/);
  });

  it('still recognises references issued before the rebrand', () => {
    // These are printed on tickets people already hold. Rewriting one would
    // break the only thing tying a customer to their booking.
    expect(isBookingReference('NK-7F2K9Q')).toBe(true);
    expect(isLegacyReference('NK-7F2K9Q')).toBe(true);
    expect(BOOKING_REFERENCE_PATTERN.test('NK-7F2K9Q')).toBe(true);
  });

  it('recognises both prefixes and rejects anything else', () => {
    expect(isBookingReference('GP-A7K3M9')).toBe(true);
    expect(isLegacyReference('GP-A7K3M9')).toBe(false);
    expect(isBookingReference('XX-A7K3M9')).toBe(false);
    expect(isBookingReference('GP-TOOLONG9')).toBe(false);
  });
});
