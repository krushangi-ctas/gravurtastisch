import { Paper, Skeleton } from '@mui/material';

export default function AmazonCredentialsSkeleton() {
  return (
    <div className="w-full py-1.5">
      <Paper
        elevation={0}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        {/* Stepper Header Skeleton */}
        <div className="px-4 sm:px-6 md:px-8 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950/20">
          <div className="w-full relative flex items-center justify-between">
            {/* Connector line behind */}
            <div className="absolute top-[16px] left-[15%] right-[15%] h-[2px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            {/* Steps */}
            {['Select Marketplaces', 'API Credentials', 'Review & Changes'].map(
              (stepLabel, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center relative z-10"
                >
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    animation="wave"
                    className="ring-4 ring-white dark:ring-slate-900"
                  />
                  <Skeleton
                    variant="text"
                    width={110}
                    height={18}
                    animation="wave"
                    className="mt-2"
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="p-4 sm:p-5 md:p-6 space-y-4">
          {/* Step Header */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Skeleton
              variant="rounded"
              width={32}
              height={32}
              className="rounded-lg shrink-0"
              animation="wave"
            />
            <div className="space-y-1">
              <Skeleton
                variant="text"
                width={220}
                height={22}
                animation="wave"
              />
              <Skeleton
                variant="text"
                width={340}
                height={14}
                animation="wave"
              />
            </div>
          </div>

          {/* Quota Banner */}
          <div className="p-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Skeleton
                variant="rounded"
                width={24}
                height={24}
                className="rounded-md shrink-0"
                animation="wave"
              />
              <div className="space-y-1">
                <Skeleton
                  variant="text"
                  width={180}
                  height={16}
                  animation="wave"
                />
                <Skeleton
                  variant="text"
                  width={280}
                  height={12}
                  animation="wave"
                />
              </div>
            </div>
            <Skeleton
              variant="rounded"
              width={120}
              height={24}
              className="rounded-full shrink-0"
              animation="wave"
            />
          </div>

          {/* Marketplace Grid (8 cards = 2 full rows of 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                  <Skeleton
                    variant="rounded"
                    width={20}
                    height={14}
                    className="rounded-2xs shrink-0"
                    animation="wave"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <Skeleton
                      variant="text"
                      width="70%"
                      height={16}
                      animation="wave"
                    />
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={12}
                      animation="wave"
                    />
                  </div>
                </div>
                <Skeleton
                  variant="rounded"
                  width={20}
                  height={20}
                  className="rounded-md shrink-0"
                  animation="wave"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <Skeleton
            variant="rounded"
            width={90}
            height={42}
            className="rounded-xl"
            animation="wave"
          />
          <Skeleton
            variant="rounded"
            width={120}
            height={42}
            className="rounded-xl"
            animation="wave"
          />
        </div>
      </Paper>
    </div>
  );
}
