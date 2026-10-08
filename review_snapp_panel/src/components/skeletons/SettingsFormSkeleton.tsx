import { Paper, Skeleton } from '@mui/material';

export function AccountSettingsSkeleton() {
	return (
		<div className="w-full py-2">
			<Paper
				elevation={0}
				className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
			>
				{/* Header Section */}
				<div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3.5">
						<Skeleton variant="rounded" width={44} height={44} className="rounded-xl shrink-0" animation="wave" />
						<div className="space-y-1.5">
							<Skeleton variant="text" width={180} height={24} animation="wave" />
							<Skeleton variant="text" width={320} height={16} animation="wave" />
						</div>
					</div>
					<Skeleton variant="rounded" width={100} height={26} className="rounded-full shrink-0" animation="wave" />
				</div>

				{/* Form Fields Section */}
				<div className="p-6 sm:p-8 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						{/* Name Field */}
						<div className="space-y-2">
							<Skeleton variant="text" width={90} height={16} animation="wave" />
							<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
						</div>

						{/* Email Field */}
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Skeleton variant="text" width={100} height={16} animation="wave" />
								<Skeleton variant="text" width={80} height={14} animation="wave" />
							</div>
							<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
							<Skeleton variant="text" width={240} height={14} animation="wave" />
						</div>
					</div>

					{/* Quick Tips Box */}
					<div className="rounded-xl border border-primary-100 dark:border-primary-900/50 bg-primary-50/40 dark:bg-primary-950/20 p-4 flex items-start gap-3.5">
						<Skeleton variant="circular" width={22} height={22} className="mt-0.5 shrink-0" animation="wave" />
						<div className="space-y-1.5 flex-1">
							<Skeleton variant="text" width={140} height={18} animation="wave" />
							<Skeleton variant="text" width="90%" height={14} animation="wave" />
						</div>
					</div>
				</div>

				{/* Action Footer */}
				<div className="px-6 sm:px-8 py-5 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
					<Skeleton variant="text" width={130} height={16} animation="wave" />
					<Skeleton variant="rounded" width={140} height={40} className="rounded-xl" animation="wave" />
				</div>
			</Paper>
		</div>
	);
}

export function GeneralSettingsSkeleton() {
	return (
		<div className="w-full py-2">
			<Paper
				elevation={0}
				className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
			>
				{/* Header Section */}
				<div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3.5">
						<Skeleton variant="rounded" width={44} height={44} className="rounded-xl shrink-0" animation="wave" />
						<div className="space-y-1.5">
							<Skeleton variant="text" width={220} height={24} animation="wave" />
							<Skeleton variant="text" width={380} height={16} animation="wave" />
						</div>
					</div>
					<Skeleton variant="rounded" width={130} height={26} className="rounded-full shrink-0" animation="wave" />
				</div>

				<div className="p-6 sm:p-8 space-y-8 divide-y divide-slate-100 dark:divide-slate-800">
					{/* Section 1: Target Orders & Fulfillment Channel */}
					<div className="pt-0 space-y-4">
						<div className="space-y-1">
							<Skeleton variant="text" width={260} height={20} animation="wave" />
							<Skeleton variant="text" width={380} height={15} animation="wave" />
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
							{/* Order Status */}
							<div className="space-y-2">
								<Skeleton variant="text" width={90} height={16} animation="wave" />
								<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
								<Skeleton variant="text" width={240} height={14} animation="wave" />
							</div>

							{/* Fulfillment Channel */}
							<div className="md:col-span-2 space-y-2">
								<Skeleton variant="text" width={130} height={16} animation="wave" />
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
									<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
									<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
								</div>
								<Skeleton variant="text" width={280} height={14} animation="wave" />
							</div>
						</div>
					</div>

					{/* Section 2: Automation Schedule */}
					<div className="pt-7 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="space-y-1">
								<Skeleton variant="text" width={230} height={20} animation="wave" />
								<Skeleton variant="text" width={320} height={15} animation="wave" />
							</div>
							<Skeleton variant="rounded" width={110} height={36} className="rounded-xl shrink-0" animation="wave" />
						</div>

						<div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-5">
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
								{[1, 2, 3, 4].map((i) => (
									<div key={i} className="space-y-2">
										<Skeleton variant="text" width={80} height={16} animation="wave" />
										<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
									</div>
								))}
							</div>

							<Skeleton variant="rounded" width="100%" height={48} className="rounded-xl" animation="wave" />
						</div>
					</div>

					{/* Section 3: Order Matching Rules */}
					<div className="pt-7 space-y-4">
						<div className="space-y-1">
							<Skeleton variant="text" width={190} height={20} animation="wave" />
							<Skeleton variant="text" width={340} height={15} animation="wave" />
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
							<div className="space-y-2">
								<Skeleton variant="text" width={110} height={16} animation="wave" />
								<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
								<Skeleton variant="text" width={280} height={14} animation="wave" />
							</div>
						</div>
					</div>
				</div>

				{/* Action Footer */}
				<div className="px-6 sm:px-8 py-5 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
					<Skeleton variant="text" width={130} height={16} animation="wave" />
					<Skeleton variant="rounded" width={140} height={40} className="rounded-xl" animation="wave" />
				</div>
			</Paper>
		</div>
	);
}

export function SecuritySettingsSkeleton() {
	return (
		<div className="w-full py-2">
			<Paper
				elevation={0}
				className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
			>
				{/* Header Section */}
				<div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3.5">
						<Skeleton variant="rounded" width={44} height={44} className="rounded-xl shrink-0" animation="wave" />
						<div className="space-y-1.5">
							<Skeleton variant="text" width={160} height={24} animation="wave" />
							<Skeleton variant="text" width={300} height={16} animation="wave" />
						</div>
					</div>
				</div>

				{/* Form Fields Section */}
				<div className="p-6 sm:p-8 space-y-6">
					<div className="space-y-5">
						<div className="space-y-2">
							<Skeleton variant="text" width={120} height={16} animation="wave" />
							<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="space-y-2">
								<Skeleton variant="text" width={110} height={16} animation="wave" />
								<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
							</div>
							<div className="space-y-2">
								<Skeleton variant="text" width={150} height={16} animation="wave" />
								<Skeleton variant="rounded" width="100%" height={44} className="rounded-xl" animation="wave" />
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 flex items-start gap-3.5">
						<Skeleton variant="circular" width={22} height={22} className="mt-0.5 shrink-0" animation="wave" />
						<div className="space-y-1.5 flex-1">
							<Skeleton variant="text" width={160} height={18} animation="wave" />
							<Skeleton variant="text" width="90%" height={14} animation="wave" />
						</div>
					</div>
				</div>

				{/* Action Footer */}
				<div className="px-6 sm:px-8 py-5 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
					<Skeleton variant="text" width={130} height={16} animation="wave" />
					<Skeleton variant="rounded" width={150} height={40} className="rounded-xl" animation="wave" />
				</div>
			</Paper>
		</div>
	);
}

