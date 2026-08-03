# Blank booking-confirmation page — root cause

**Status:** fixed and verified in development and in a production preview build.
**Reported as:** `/booking-confirmation/NK-XXXXXX` shows the header and an otherwise blank page.

---

## What was actually wrong

The defect was **not specific to the confirmation route**. Every in-app navigation in the
application was broken. Clicking any header link left the routed outlet showing a fully-transparent
copy of the *previous* page. It was only noticed on confirmation because that is the one screen a
customer reaches exactly once, with nothing to click and no reason to reload.

Two independent defects were found. Both are fixed.

---

## Defect 1 — `AnimatePresence` never removed the exiting route

### The exact failure

`src/motion/PageTransition.tsx` wrapped the routed outlet in:

```tsx
<AnimatePresence mode="wait" initial={false} onExitComplete={onExitComplete}>
  <m.div key={routeKey} variants={routeTransition} initial="initial" animate="animate" exit="exit">
    {children}
  </m.div>
</AnimatePresence>
```

On navigation the outgoing `m.div` ran its exit animation to completion and was then **never
removed**. With `mode="wait"` the incoming route is not rendered until the outgoing one is gone, so
the outlet was permanently occupied by an invisible copy of the previous page.

Measured in the browser immediately after pressing **Confirm booking**:

```
url:                    /booking-confirmation/NK-8GF85U
main.children.length:   1
child style:            "opacity: 0; transform: translateY(-6px);"   ← the exit variant target
child contains:         nav[aria-label="Booking steps"]              ← the Booking route
first heading:          "Cholonto Chhaya"                            ← the Booking route
confirmation present:   false
uncaught errors:        none
console errors:         none
```

The child sitting in `main` was the **Booking** route, at the exact `exit` target of
`routeTransition` (`opacity: 0, y: -6`). The confirmation component never mounted.

### The cause of that

`src/motion/MotionProvider.tsx` loaded framer-motion's feature bundle asynchronously:

```tsx
const loadFeatures = () => import('framer-motion').then((mod) => mod.domMax);
<LazyMotion features={loadFeatures} strict>
```

`m` components mount before that dynamic import resolves. When the features arrive, the
already-mounted components are not re-registered with the presence lifecycle, so their exit
animation runs *visually* but never calls `safeToRemove`. Any `AnimatePresence` above them then
holds the exiting child forever.

This was introduced when `MotionProvider` was created during the visual-revival pass. Every in-app
navigation has been broken since.

### Binary isolation — what was tested, and what each test proved

| # | Test | Result | Conclusion |
|---|---|---|---|
| — | Hard-reload the confirmation URL directly | **Renders correctly** — h1, QR, reference, 1457 chars | Component, store, localStorage persistence and the lazy chunk are all fine |
| E | Remove `booking.reset()` before `navigate()` | Still blank, identical `opacity: 0` | Reset timing is **not** the cause |
| C | Remove the nested `AnimatePresence` inside `Booking.tsx` | Still blank | Nested presence is **not** the cause |
| A | Bypass `PageTransition`, render `{outlet}` directly | **All navigation works** | The route transition **is** the cause |
| B | Keep `AnimatePresence`, drop `mode="wait"` | Still broken — and `main.children` grew 2 → 3 → 4 | Exiting children are never removed **at all**; `mode="wait"` only changes how that presents |
| G | `LazyMotion features={domMax}` (eager) instead of the async loader | **All navigation works**, `main.children` stays 1 | Async feature loading **is** the root cause |

Test B is the decisive observation: without `mode="wait"` the outgoing routes *accumulate*. The
problem was never the waiting — it was that exit never completed.

### The fix

1. **`src/motion/MotionProvider.tsx`** — features are now imported eagerly (`features={domMax}`).
   This alone fixes navigation. It costs ~30 KB in the entry chunk, which is the correct trade.
2. **`src/motion/PageTransition.tsx`** — `AnimatePresence` removed entirely; the route transition is
   now **entrance-only**. Even if a motion callback is missed again, React mounts the incoming route
   immediately and the worst possible cost is a missing animation, not a missing page. An exit-wait
   transition around the routed outlet is a shape in which one dropped callback empties the screen.

---

## Defect 2 — the production bundle never booted

Found while verifying the fix against a production preview, as the brief requires.

```
GET http://localhost:4174/  →  200
#root children: 0
console: Uncaught TypeError: Cannot read properties of undefined (reading 'useLayoutEffect')
```

The production build did not start at all. Cause: the hand-written `manualChunks` in
`vite.config.ts` produced a **circular chunk graph**:

```
react-vendor-P9nJJvj_.js  ->  vendor-CFvPlgYR.js      (react-dom needs scheduler, which fell to the catch-all)
vendor-CFvPlgYR.js        ->  react-vendor-P9nJJvj_.js (zustand etc. need react)
```

Rollup cannot order a cycle. Whichever side evaluated first saw the other as `undefined`, so React
was undefined when a dependent called `useLayoutEffect`.

**Fix:** `manualChunks` removed. Rollup's default chunking is cycle-free by construction and still
splits every dynamic import, so lazy routes are unaffected. Verified after the change:

```
no circular chunk imports
#root children: 4
```

---

## Reliability work done beyond the root cause

- `BookingConfirmation` is imported **eagerly** (`src/App.tsx`). It is the one route a customer
  cannot retry, so it must not depend on a chunk fetch succeeding at that moment.
- **`AppErrorBoundary`** (`src/components/common/AppErrorBoundary.tsx`) wraps the outlet. A
  render-time throw now shows a heading, an explanation and links to My bookings / Book a movie /
  Home instead of unmounting the tree. It resets on navigation.
- **Completion order changed** (`src/routes/Booking.tsx`): build the snapshot → persist → **verify
  `useBookings.getState()` actually contains the reference** → navigate (`replace: true`) → only
  then `booking.reset()`. If persistence fails the customer is told, and nothing is reset.
- **`isCompleting`** disables the Confirm button, sets `aria-busy`, changes the label to "Saving your
  booking…", and makes `confirm()` return early on re-entry. No double reference, no double navigate.
- **Storage validation** (`src/store/bookings.ts`): a Zod schema validates every record on rehydrate.
  Malformed entries are dropped with a console warning; valid ones are kept. One corrupt record can
  no longer throw during render.
- **The confirmation renders from its own snapshot.** It previously did
  `if (!movie || !cinema) return <NotFound />` — which threw away a real, paid-for ticket whenever
  the catalogue changed underneath it. The live catalogue now only *enhances* the ticket (Bengali
  title, trailer minutes, map link); the snapshot carries title, cinema name, address, screen, date,
  time, format, seats, categories, concessions, totals, guest and reference.
- `cinemaAddress` and `moviePoster` added to the snapshot for the same reason.

---

## Files changed

| File | Change |
|---|---|
| `src/motion/MotionProvider.tsx` | Eager `domMax` features — **the root-cause fix** |
| `src/motion/PageTransition.tsx` | `AnimatePresence` removed; entrance-only transition |
| `vite.config.ts` | `manualChunks` removed — fixed the circular chunk graph |
| `src/App.tsx` | `BookingConfirmation` imported eagerly, not lazily |
| `src/components/common/AppErrorBoundary.tsx` | New — app-level render error recovery |
| `src/components/layout/Layout.tsx` | Outlet wrapped in `AppErrorBoundary` |
| `src/routes/Booking.tsx` | Persist → verify → navigate → reset; `isCompleting` guard; `cinemaAddress` in snapshot |
| `src/routes/BookingConfirmation.tsx` | Renders from snapshot; catalogue lookups are optional enhancements |
| `src/store/bookings.ts` | Zod validation on rehydrate; `cinemaAddress` / `moviePoster` fields |

---

## Verification

Development (`localhost:5174`), full booking flow driven in Chrome:

```
url:        /booking-confirmation/NK-LGBPX4
h1:         "You're booked for Cholonto Chhaya."
reference:  NK-LGBPX4
QR:         present
main text:  1457 characters
child style: "opacity: 1; transform: none;"
main.children: 1
```

Production preview and the automated Playwright suite are recorded in
[`visual-revival-qa.md`](./visual-revival-qa.md) and `tests/e2e/booking-confirmation.spec.ts`.
