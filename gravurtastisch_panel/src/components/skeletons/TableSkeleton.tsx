import { Box, Skeleton, Paper } from '@mui/material';

interface TableSkeletonProps {
	columns?: number;
	rows?: number;
	showHeader?: boolean;
	showToolbar?: boolean;
}

export default function TableSkeleton({
	columns = 6,
	rows = 8,
	showHeader = true,
	showToolbar = true
}: TableSkeletonProps) {
	return (
		<Paper elevation={0} className="w-full overflow-hidden border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-slate-900">
			{/* Top Toolbar Skeleton */}
			{showToolbar && (
				<Box className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
					<Skeleton variant="rounded" width={280} height={38} className="rounded-xl" animation="wave" />
					<Box className="flex items-center gap-2">
						<Skeleton variant="rounded" width={38} height={38} className="rounded-xl" animation="wave" />
						<Skeleton variant="rounded" width={38} height={38} className="rounded-xl" animation="wave" />
						<Skeleton variant="rounded" width={38} height={38} className="rounded-xl" animation="wave" />
					</Box>
				</Box>
			)}

			{/* Table Header Skeleton */}
			{showHeader && (
				<Box className="flex items-center gap-4 px-6 py-3.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-800">
					{Array.from({ length: columns }).map((_, i) => (
						<Skeleton
							key={`th-${i}`}
							variant="text"
							width={i === 0 ? '25%' : i === columns - 1 ? '15%' : '18%'}
							height={22}
							className="rounded-md"
							animation="wave"
						/>
					))}
				</Box>
			)}

			{/* Table Rows Skeleton */}
			<Box className="divide-y divide-gray-100 dark:divide-gray-800/60">
				{Array.from({ length: rows }).map((_, r) => (
					<Box key={`row-${r}`} className="flex items-center gap-4 px-6 py-4">
						{Array.from({ length: columns }).map((_, c) => (
							<Box
								key={`cell-${r}-${c}`}
								style={{ width: c === 0 ? '25%' : c === columns - 1 ? '15%' : '18%' }}
							>
								{c === columns - 1 ? (
									<Box className="flex items-center gap-2">
										<Skeleton variant="circular" width={28} height={28} animation="wave" />
										<Skeleton variant="circular" width={28} height={28} animation="wave" />
									</Box>
								) : c === 1 && (r % 2 === 0) ? (
									<Skeleton variant="rounded" width={75} height={22} className="rounded-full" animation="wave" />
								) : (
									<Skeleton
										variant="text"
										width={c === 0 ? '80%' : `${50 + ((r * 13 + c * 17) % 40)}%`}
										height={20}
										className="rounded-md"
										animation="wave"
									/>
								)}
							</Box>
						))}
					</Box>
				))}
			</Box>

			{/* Pagination Bar Skeleton */}
			<Box className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/30">
				<Skeleton variant="text" width={120} height={20} animation="wave" />
				<Box className="flex items-center gap-2">
					<Skeleton variant="rounded" width={28} height={28} className="rounded-md" animation="wave" />
					<Skeleton variant="rounded" width={28} height={28} className="rounded-md" animation="wave" />
					<Skeleton variant="rounded" width={28} height={28} className="rounded-md" animation="wave" />
				</Box>
			</Box>
		</Paper>
	);
}
