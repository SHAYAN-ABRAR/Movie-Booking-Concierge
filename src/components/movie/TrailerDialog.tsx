import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/overlay';
import { Button } from '@/components/ui/button';
import { MovieImage } from '@/components/visual/MovieImage';
import { movieById } from '@/data/movies';
import { useTrailerViewer } from './trailerViewer';
import type { Movie, MovieTrailer } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * The official trailer, played on request.
 *
 * ## Why the iframe is not in the tree until you ask
 *
 * A YouTube embed is not a video element — it is a third-party document that
 * runs its own scripts, sets its own storage and makes its own requests the
 * moment it mounts. Rendering one per movie card would mean every visit to the
 * programme page contacts Google a dozen times before anyone has asked to watch
 * anything. So the dialog renders the film's *local* backdrop until the moment
 * of activation, and the iframe is mounted only inside the open dialog.
 *
 * Closing unmounts it, which is also what stops playback: there is no player
 * API call here, and there does not need to be. A removed iframe cannot keep
 * making sound.
 *
 * `youtube-nocookie.com` for the same reason — it is the domain that does not
 * set profiling cookies until playback begins.
 */

const YOUTUBE_HOST = 'https://www.youtube-nocookie.com';

/**
 * `autoplay=1` is safe *here* and would not be on page load: the dialog only
 * exists because someone pressed a button, which is exactly the user gesture
 * browsers require. `playsinline` keeps iOS from taking over the screen.
 */
function embedUrl(trailer: MovieTrailer): string {
  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    cc_load_policy: trailer.captionsAvailable ? '1' : '0',
  });
  return `${YOUTUBE_HOST}/embed/${trailer.videoId}?${params.toString()}`;
}

export function TrailerDialog({
  movie,
  open,
  onOpenChange,
}: {
  movie: Movie;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const trailer = movie.trailer;
  const [ready, setReady] = useState(false);

  // A fresh mount per opening. Without this the iframe would be reused across
  // openings and resume mid-trailer.
  useEffect(() => {
    if (!open) setReady(false);
  }, [open]);

  if (!trailer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(64rem,calc(100vw-2rem))] max-w-none p-0"
        // The player is the content. A pale dialog surface would flash white
        // around a 16:9 black frame every time it opens.
        style={{ background: 'var(--house)' }}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-3.5">
          <div className="min-w-0">
            <DialogTitle className="truncate font-display text-lg leading-tight text-house-ink">
              {movie.title}
            </DialogTitle>
            <p className="mt-0.5 truncate text-[0.75rem] text-house-faint">
              {t(
                trailer.type === 'official-teaser'
                  ? 'trailer.officialTeaserBy'
                  : 'trailer.officialTrailerBy',
                { channel: trailer.officialChannel },
              )}
            </p>
          </div>
        </div>

        {/* A fixed 16:9 box, reserved before the iframe arrives, so the dialog
            does not resize under the pointer as the player loads. */}
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {open ? (
            <>
              {!ready ? (
                <div
                  className="absolute inset-0 grid place-items-center"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-[0.8125rem] text-house-muted">
                    {t('trailer.loading')}
                  </span>
                </div>
              ) : null}
              <iframe
                key={`${trailer.videoId}-${String(open)}`}
                src={embedUrl(trailer)}
                title={t('trailer.playerTitle', { movie: movie.title })}
                className="absolute inset-0 size-full border-0"
                // Not `allow="autoplay; …"` blanket: only what the player needs.
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                onLoad={() => setReady(true)}
              />
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          {/* The recovery path. A blocked or geo-restricted embed leaves the
              frame empty with no explanation, so the official source is always
              one click away rather than only offered after a failure. */}
          <a
            href={trailer.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-[0.8125rem] text-house-muted underline underline-offset-4 hover:text-house-ink"
          >
            {t('trailer.watchOnYouTube')}
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-house-rule text-house-ink hover:bg-house-ink/10"
          >
            {t('common.actions.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The cinematic entry point: the film's own backdrop with a play control over
 * it, sized to the frame the player will occupy.
 *
 * The preview image is the **local** backdrop, not YouTube's thumbnail. That
 * keeps the initial render free of any third-party request, and it means the
 * preview cannot break if a video is later re-uploaded under a new id.
 */
export function TrailerPreview({ movie, className }: { movie: Movie; className?: string }) {
  const { t } = useTranslation();
  const open = useTrailerViewer((s) => s.open);

  if (!movie.trailer) return null;

  return (
    <figure className={cn('max-w-3xl', className)}>
      <button
        type="button"
        onClick={(event) => open(movie.id, event.currentTarget)}
        aria-haspopup="dialog"
        className={cn(
          'group relative block w-full overflow-hidden border border-hairline-strong',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        )}
      >
        <MovieImage
          movie={movie}
          role="backdrop"
          sizes="(max-width: 48rem) 100vw, 48rem"
          imgClassName="transition-transform duration-[--dur-slow] ease-[--ease-out] group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transform-none"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-house/85 via-house/25 to-transparent"
        />
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4 sm:p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-full border border-house-ink/40 bg-house/70 backdrop-blur-[2px] transition-colors group-hover:bg-marigold group-hover:text-house">
            <Play aria-hidden="true" className="size-5 translate-x-[1px] text-house-ink group-hover:text-house" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate font-display text-lg leading-tight text-house-ink">
              {t('trailer.watchOfficial')}
            </span>
            <span className="block truncate text-[0.75rem] text-house-muted">
              {t(
                movie.trailer.type === 'official-teaser'
                  ? 'trailer.officialTeaserBy'
                  : 'trailer.officialTrailerBy',
                { channel: movie.trailer.officialChannel },
              )}
            </span>
          </span>
        </span>
      </button>

    </figure>
  );
}

/**
 * The control that opens it, with the dialog state kept inside.
 *
 * Self-contained on purpose: a movie card, the hero, the story panel and Max
 * all need this and none of them should have to hold trailer state.
 *
 * Renders nothing when a film has no verified trailer — a dead "play" button is
 * worse than no button. `MovieDetails` shows the explicit not-yet-released
 * state instead.
 */
export function TrailerButton({
  movie,
  variant = 'outline',
  size = 'md',
  className,
  iconOnly = false,
}: {
  movie: Movie;
  variant?: 'primary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  className?: string;
  iconOnly?: boolean;
}) {
  const { t } = useTranslation();
  const open = useTrailerViewer((s) => s.open);

  if (!movie.trailer) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={(event) => open(movie.id, event.currentTarget)}
      aria-haspopup="dialog"
      {...(iconOnly ? { 'aria-label': t('trailer.watchFor', { movie: movie.title }) } : {})}
    >
      <Play aria-hidden="true" className={cn(iconOnly ? '' : 'shrink-0')} />
      {iconOnly ? null : t('trailer.watch')}
    </Button>
  );
}

/**
 * The one trailer player in the application. Mounted once by `Layout`.
 *
 * Everything else — cards, the film page, the story panel, Max — only asks the
 * store to show a film. Nothing else mounts a `TrailerDialog`.
 */
export function TrailerViewer() {
  const movieId = useTrailerViewer((s) => s.movieId);
  const close = useTrailerViewer((s) => s.close);
  const movie = movieId ? movieById.get(movieId) : undefined;

  if (!movie) return null;
  return <TrailerDialog movie={movie} open onOpenChange={(next) => !next && close()} />;
}
