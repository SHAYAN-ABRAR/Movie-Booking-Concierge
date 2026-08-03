import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeatMap } from './SeatMap';
import { showtimesForDate, seatMapFor } from '@/data/schedule';
import { dateWindow } from '@/lib/datetime';

const today = dateWindow(1)[0]!;
const showtime = showtimesForDate(today).find(
  (s) => seatMapFor(s).flatMap((r) => r.seats).filter((seat) => seat.status === 'available').length > 20,
)!;

function renderMap(overrides: Partial<Parameters<typeof SeatMap>[0]> = {}) {
  const onToggle = vi.fn();
  const onReset = vi.fn();
  const onAnnounce = vi.fn();
  render(
    <SeatMap
      showtime={showtime}
      selected={[]}
      limit={2}
      onToggle={onToggle}
      onReset={onReset}
      onAnnounce={onAnnounce}
      {...overrides}
    />,
  );
  return { onToggle, onReset, onAnnounce };
}

describe('the seat map', () => {
  it('exposes itself as a multi-select listbox with grouped rows', () => {
    renderMap();
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    expect(screen.getAllByRole('group').length).toBeGreaterThan(0);
  });

  it('gives every seat a description that survives without colour', () => {
    renderMap();
    const options = screen.getAllByRole('option');
    const label = options[0]!.getAttribute('aria-label') ?? '';
    // Row, seat number, class, and either a price or a reason it cannot be taken.
    expect(label).toMatch(/Row [A-Z], seat \d+/);
    expect(label).toMatch(/Regular|Premium|Recliner|Wheelchair|Companion/);
    expect(label).toMatch(/৳|sold|being booked|not a seat/);
  });

  it('marks sold seats as disabled rather than merely greying them', () => {
    renderMap();
    const sold = screen
      .getAllByRole('option')
      .find((node) => (node.getAttribute('aria-label') ?? '').includes('sold'));
    expect(sold).toBeDefined();
    expect(sold).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps exactly one tab stop in the map', () => {
    renderMap();
    const focusable = screen.getAllByRole('option').filter((node) => node.tabIndex === 0);
    expect(focusable).toHaveLength(1);
  });

  it('moves between seats with the arrow keys', async () => {
    const user = userEvent.setup();
    renderMap();

    const options = screen.getAllByRole('option');
    const first = options.find((node) => node.tabIndex === 0)!;
    first.focus();
    expect(document.activeElement).toBe(first);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).not.toBe(first);
    const afterRight = document.activeElement as HTMLElement;
    expect(afterRight.getAttribute('role')).toBe('option');

    await user.keyboard('{ArrowDown}');
    expect((document.activeElement as HTMLElement).getAttribute('role')).toBe('option');
  });

  it('selects an available seat with the keyboard and announces it', async () => {
    const user = userEvent.setup();
    const { onToggle, onAnnounce } = renderMap();

    const available = screen
      .getAllByRole('option')
      .find((node) => node.getAttribute('aria-disabled') === 'false')!;
    available.focus();
    await user.keyboard('{Enter}');

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onAnnounce).toHaveBeenCalled();
    expect(onAnnounce.mock.calls[0]![0]).toMatch(/Seat [A-Z]\d+/);
  });

  it('refuses to exceed the ticket limit and says why', async () => {
    const user = userEvent.setup();
    const free = seatMapFor(showtime)
      .flatMap((row) => row.seats)
      .filter((seat) => seat.status === 'available')
      .slice(0, 2)
      .map((seat) => seat.id);

    const { onToggle, onAnnounce } = renderMap({ selected: free, limit: 2 });

    const another = screen
      .getAllByRole('option')
      .find(
        (node) =>
          node.getAttribute('aria-disabled') === 'false' &&
          node.getAttribute('aria-selected') === 'false',
      )!;
    another.focus();
    await user.keyboard('{Enter}');

    expect(onToggle).not.toHaveBeenCalled();
    expect(onAnnounce.mock.calls.at(-1)![0]).toMatch(/already chosen 2/i);
  });

  it('always allows deselecting a chosen seat, even at the limit', async () => {
    const user = userEvent.setup();
    const free = seatMapFor(showtime)
      .flatMap((row) => row.seats)
      .filter((seat) => seat.status === 'available')
      .slice(0, 2)
      .map((seat) => seat.id);

    const { onToggle } = renderMap({ selected: free, limit: 2 });

    const chosen = screen
      .getAllByRole('option')
      .find((node) => node.getAttribute('aria-selected') === 'true')!;
    chosen.focus();
    await user.keyboard('{Enter}');

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('draws the sold mark as a cross, with both arms through the centre', () => {
    renderMap();
    const sold = screen
      .getAllByRole('option')
      .find((node) => /sold/.test(node.getAttribute('aria-label') ?? ''))!;
    expect(sold).toBeDefined();

    const mark = sold.querySelector('span[aria-hidden="true"]')!;
    expect(mark).not.toBeNull();

    // Regression guard. Both arms were originally pinned to the box's *top*
    // edge (`inset-0` + `border-t`), so rotating them ±45° about the box centre
    // swung them into a caret rather than a cross. They must be centred first.
    const cls = mark.className;
    expect(cls).toContain('before:top-1/2');
    expect(cls).toContain('after:top-1/2');
    expect(cls).toContain('before:rotate-45');
    expect(cls).toContain('after:-rotate-45');
  });

  it('distinguishes seat classes by silhouette, not only by colour', () => {
    renderMap();
    const options = screen.getAllByRole('option');
    const classOf = (name: RegExp) =>
      options.find((node) => name.test(node.getAttribute('aria-label') ?? ''))?.className ?? '';

    const regular = classOf(/Regular/);
    const premium = classOf(/Premium/);
    expect(regular).toBeTruthy();
    expect(premium).toBeTruthy();

    // A premium seat has a rounder back and a deeper cushion, so the map still
    // reads in greyscale.
    expect(premium).toContain('rounded-t-[8px]');
    expect(premium).toContain('border-b-[3px]');
    expect(regular).not.toContain('rounded-t-[8px]');
  });

  it('shows a legend that names every state in words', () => {
    renderMap();
    const legend = screen.getByRole('heading', { name: /legend/i }).parentElement!;
    const entries = within(legend)
      .getAllByRole('listitem')
      .map((node) => node.textContent ?? '');

    for (const state of ['Regular', 'Premium', 'Wheelchair space', 'Companion', 'Chosen', 'Being booked', 'Sold']) {
      expect(entries.some((entry) => entry.includes(state))).toBe(true);
    }
  });
});
