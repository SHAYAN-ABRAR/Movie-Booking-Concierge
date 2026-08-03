import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

/**
 * The last line of defence against a blank screen.
 *
 * React unmounts the entire tree when a render throws and nothing catches it,
 * which is how a single bad value in one component turns into an empty page.
 * This catches that and renders something a customer can act on.
 *
 * It sits *inside* the layout, so the header, footer and Max stay usable and
 * only the routed content is replaced. `RouteErrorBoundary` still handles
 * router-level errors (loaders, bad URLs); this handles render-time throws,
 * which the router does not see.
 *
 * Deliberately a class component: `componentDidCatch` has no hook equivalent.
 */

interface Props {
  children: ReactNode;
  /** Changing this resets the boundary — used to clear the error on navigation. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    // A new route is a fresh chance to render. Without this the boundary would
    // hold its error and every subsequent page would look broken too.
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No telemetry in this build — there is nowhere to send it. The console is
    // the honest destination, and the message below says as much.
    console.error('Nokshi: a page failed to render.', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="shell py-16">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Something went wrong on this page</p>
          <h1 className="font-display text-[2.25rem] leading-[1.02] tracking-[-0.03em] sm:text-[3rem]">
            This page could not be displayed.
          </h1>
          <p className="mt-5 text-[1.0625rem] leading-7 text-content-muted">
            The rest of the site is still working, and nothing you have saved in this browser has
            been lost — any completed bookings are still on the My bookings page.
          </p>
          <p className="mt-3 text-[0.9375rem] leading-7 text-content-muted">
            This is a demonstration build with no error-reporting service behind it, so the details
            below are only in your browser console.
          </p>

          <pre className="mt-6 max-w-full overflow-x-auto border border-hairline bg-surface-sunken/60 p-4 font-mono text-[0.8125rem] leading-6 text-content-muted">
            {error.message || String(error)}
          </pre>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/bookings"
              className="inline-flex h-11 items-center border-2 border-content bg-content px-5 text-sm font-semibold text-surface transition-colors hover:bg-transparent hover:text-content"
            >
              My bookings
            </a>
            <a
              href="/showtimes"
              className="inline-flex h-11 items-center border-2 border-content px-5 text-sm font-semibold text-content transition-colors hover:bg-content hover:text-surface"
            >
              Book a movie
            </a>
            <a
              href="/"
              className="inline-flex h-11 items-center border border-hairline-strong px-5 text-sm font-semibold text-content transition-colors hover:bg-surface-sunken"
            >
              Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
