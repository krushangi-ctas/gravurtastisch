import { Paper, Skeleton } from '@mui/material';

export function SiteConfigurationSkeleton() {
	return (
		<div className="w-full space-y-3.5 pb-10">
			{/* Segmented Tabs Skeleton */}
			<div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-fit">
				<Skeleton variant="rounded" width={140} height={32} className="rounded-lg" animation="wave" />
				<Skeleton variant="rounded" width={150} height={32} className="rounded-lg" animation="wave" />
				<Skeleton variant="rounded" width={155} height={32} className="rounded-lg" animation="wave" />
			</div>

			{/* Main Form Card Skeleton */}
			<Paper
				elevation={0}
				className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
			>
				{/* Card Header Skeleton */}
				<div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
					<Skeleton variant="rounded" width={32} height={32} className="rounded-lg shrink-0" animation="wave" />
					<div className="space-y-1">
						<Skeleton variant="text" width={160} height={20} animation="wave" />
						<Skeleton variant="text" width={320} height={14} animation="wave" />
					</div>
				</div>

				{/* Grid Inputs Skeleton */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
					{/* Field 1 */}
					<div className="space-y-1.5">
						<Skeleton variant="text" width={110} height={14} animation="wave" />
						<Skeleton variant="rounded" width="100%" height={40} className="rounded-xl" animation="wave" />
					</div>

					{/* Field 2 */}
					<div className="space-y-1.5">
						<Skeleton variant="text" width={100} height={14} animation="wave" />
						<Skeleton variant="rounded" width="100%" height={40} className="rounded-xl" animation="wave" />
					</div>

					{/* Field 3 (Full width) */}
					<div className="md:col-span-2 space-y-1.5">
						<Skeleton variant="text" width={80} height={14} animation="wave" />
						<Skeleton variant="rounded" width="100%" height={40} className="rounded-xl" animation="wave" />
					</div>

					{/* Field 4 (Multiline Description) */}
					<div className="md:col-span-2 space-y-1.5">
						<Skeleton variant="text" width={130} height={14} animation="wave" />
						<Skeleton variant="rounded" width="100%" height={80} className="rounded-xl" animation="wave" />
					</div>

					{/* Field 5 (Full width) */}
					<div className="md:col-span-2 space-y-1.5">
						<Skeleton variant="text" width={100} height={14} animation="wave" />
						<Skeleton variant="rounded" width="100%" height={40} className="rounded-xl" animation="wave" />
					</div>
				</div>
			</Paper>

			{/* Action Footer Skeleton */}
			<Paper
				elevation={0}
				className="px-4 sm:px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3"
			>
				<Skeleton variant="text" width={220} height={16} animation="wave" />
				<div className="flex items-center gap-2.5">
					<Skeleton variant="rounded" width={110} height={34} className="rounded-lg" animation="wave" />
					<Skeleton variant="rounded" width={140} height={34} className="rounded-lg" animation="wave" />
				</div>
			</Paper>
		</div>
	);
}

export default SiteConfigurationSkeleton;
