import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { nowShowing } from '@/data/movies';

/**
 * The 404, and the shell the error boundary reuses.
 *
 * Kept free of `useRouteError` so it can be rendered as an ordinary route:
 * that hook is only valid inside an `errorElement`, and calling it anywhere
 * else throws. `RouteErrorBoundary` below is the version that reads the error.
 */
export function NotFound({ isNotFound = true }: { isNotFound?: boolean }) {
  const suggestions = nowShowing.slice(0, 4);

  return (
    <div className="shell py-16 sm:py-24">
      <div className="max-w-2xl">
        <p className="eyebrow mb-4">{isNotFound ? 'Not on the programme' : 'Something went wrong'}</p>
        <h1 className="font-display text-[2.5rem] leading-[1] tracking-[-0.03em] sm:text-[4rem]">
          {isNotFound ? 'We could not find that page.' : 'That page failed to load.'}
        </h1>
        <p className="mt-5 max-w-prose text-[1.0625rem] leading-7 text-content-muted">
          {isNotFound
            ? 'The link may be out of date, or the film may have finished its run. The current programme is below.'
            : 'Reloading usually clears it. If it keeps happening, the programme and showtimes pages are the quickest way back in.'}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/movies">See the programme</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/showtimes">Find a showtime</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>

      {isNotFound ? (
        <div className="mt-14 border-t border-hairline pt-8">
          <h2 className="eyebrow mb-4">On this week</h2>
          <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {suggestions.map((movie) => (
              <li key={movie.id}>
                <Link
                  to={`/movies/${movie.slug}`}
                  className="group flex items-baseline justify-between gap-4 border-b border-hairline py-2.5"
                >
                  <span className="font-display text-lg group-hover:underline">{movie.title}</span>
                  <span className="numeral shrink-0 text-sm text-content-muted">
                    {movie.runtimeMinutes}m
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** The router's `errorElement`. A broken chunk should land somewhere useful. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  return <NotFound isNotFound={isNotFound} />;
}
