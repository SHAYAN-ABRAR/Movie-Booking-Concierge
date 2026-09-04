import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { offerImageById } from '@/data/offerMedia';
import { offerArtFor } from '@/data/offerArt';
import type { Offer } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * An offer, as a printed poster.
 *
 * The picture is a generated three-ink screenprint; the *figure* — ৳60, 15%,
 * 1st — is real text set over it. That split is deliberate and load-bearing:
 * an image generator cannot render legible lettering, and even if it could, a
 * number baked into a picture cannot be translated, selected, read aloud, or
 * shown in Bengali numerals. So the artwork is generated with a deliberately
 * empty region and the type is placed into it here.
 *
 * `textAnchor` says which half was left open and `textTone` says whether that
 * half is bone or charcoal — both recorded by the build script from the prompt
 * that produced the image, so the type can never drift onto the busy side.
 *
 * The figure comes from the locale resources rather than straight off the art
 * direction, so it reads ৳২০০ in Bangla and রাত ১০টা rather than "10 pm". That
 * is the whole point of keeping it out of the picture.
 */
export function OfferArtwork({
  offer,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 560px',
}: {
  offer: Offer;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const image = offerImageById.get(offer.id);
  const art = offerArtFor(offer.id);
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  // Translated where the offer has been designed; the English literal on the
  // undesigned fallback, which has no key to translate.
  const figure = art.figureKey ? t(`offers.figures.${art.figureKey}.figure`) : art.figure;
  const note = art.figureKey ? t(`offers.figures.${art.figureKey}.note`) : art.figureNote;

  // No artwork on file, or it failed to decode. The figure is the part that
  // matters, so it survives on a plain ground rather than disappearing with
  // the picture.
  if (!image || failed) {
    return (
      <div
        className={cn(
          'flex aspect-[16/9] flex-col items-center justify-center bg-surface-sunken px-6 text-center',
          className,
        )}
      >
        <p className="index-mark text-[2.5rem]">{figure}</p>
        <p className="eyebrow mt-2">{note}</p>
      </div>
    );
  }

  const widest = image.widths[image.widths.length - 1]!;
  const srcSet = (ext: string) =>
    image.widths.map((w) => `${image.basePath}-${w}.${ext} ${w}w`).join(', ');

  const onDark = image.textTone === 'paper';

  return (
    <div className={cn('relative aspect-[16/9] overflow-hidden bg-surface-sunken', className)}>
      <picture>
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
        <img
          src={`${image.basePath}-${widest}.jpg`}
          srcSet={srcSet('jpg')}
          sizes={sizes}
          width={widest}
          height={Math.round((widest / 16) * 9)}
          alt={image.alt}
          loading={priority ? 'eager' : 'lazy'}
          // Lowercase: React 18 does not recognise the camelCase form and
          // passes it straight through, warning on every render.
          {...{ fetchpriority: priority ? 'high' : 'auto' }}
          decoding={priority ? 'sync' : 'async'}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      </picture>

      {/* The figure, set into the region the prompt kept clear. */}
      <div
        className={cn(
          'absolute inset-y-0 flex w-[46%] flex-col px-[5%] py-[6%]',
          image.textAnchor === 'right' ? 'right-0 items-end text-right' : 'left-0 items-start',
          // The clear region is not always vertically centred — the family
          // composition is open across its top right and solid below it.
          image.textAlign === 'top'
            ? 'justify-start'
            : image.textAlign === 'bottom'
              ? 'justify-end'
              : 'justify-center',
          // Fixed inks, not theme tokens: this type sits on the print, and the
          // print does not change colour with the interface.
          onDark ? 'text-[#f4f1eb]' : 'text-[#111113]',
        )}
      >
        <p
          className="index-mark leading-[0.85]"
          style={{ fontSize: 'clamp(1.75rem, 6.5vw, 3.25rem)' }}
        >
          {figure}
        </p>
        <p
          className={cn(
            'mt-2 max-w-[16ch] text-[0.6875rem] font-bold uppercase leading-[1.3] tracking-[0.12em]',
            '[&:lang(bn)]:tracking-normal',
            onDark ? 'text-[#f4f1eb]/75' : 'text-[#111113]/70',
          )}
        >
          {note}
        </p>
      </div>
    </div>
  );
}
