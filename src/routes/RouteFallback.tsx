import { useTranslation } from 'react-i18next';
import { useReportRouteLoading } from '@/motion';

/**
 * Shown while a split route chunk loads.
 *
 * Editorial skeleton rather than grey rounded boxes: the same rules, the same
 * plate proportions and the same rhythm the real page will have, so the layout
 * does not move when the content arrives. It also reports its own lifetime to
 * the route-progress indicator, which is why that indicator is never a fiction.
 */
export function RouteFallback() {
  const { t } = useTranslation();
  useReportRouteLoading();

  return (
    <div className="shell py-12" role="status" aria-label={t('loading.page')}>
      <div className="h-3 w-24 bg-content/[0.08]" />
      <div className="mt-4 h-12 w-[min(28rem,80%)] bg-content/[0.07]" />
      <div className="mt-4 h-4 w-[min(38rem,95%)] bg-content/[0.05]" />

      <div className="mt-10 border-t border-hairline pt-10">
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-content/[0.06]">
                {/* The sprocket edge holds its place, so the plate does not jump. */}
                <span className="absolute inset-y-0 left-0 flex w-[9px] flex-col items-center justify-around py-3">
                  {Array.from({ length: 12 }, (_, s) => (
                    <span key={s} className="block size-[5px] rounded-[1px] bg-content/[0.09]" />
                  ))}
                </span>
              </div>
              <div className="mt-3 h-4 w-3/4 bg-content/[0.07]" />
              <div className="mt-2 h-3 w-1/2 bg-content/[0.05]" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">{t('loading.ellipsis')}</span>
    </div>
  );
}
