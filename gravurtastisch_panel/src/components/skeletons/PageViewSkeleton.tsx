import { Box, Skeleton } from '@mui/material';
import TableSkeleton from './TableSkeleton';

interface PageViewSkeletonProps {
	titleWidth?: number;
	subtitleWidth?: number;
	columns?: number;
	rows?: number;
}

export default function PageViewSkeleton({
	titleWidth = 240,
	subtitleWidth = 420,
	columns = 6,
	rows = 8
}: PageViewSkeletonProps) {
	return (
		<Box className="flex flex-col w-full min-h-screen p-6 space-y-6">
			{/* Page Header Skeleton */}
			<Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
				<Box className="space-y-2">
					<Skeleton variant="text" width={titleWidth} height={36} className="rounded-lg" animation="wave" />
					<Skeleton variant="text" width={subtitleWidth} height={20} className="rounded-md" animation="wave" />
				</Box>
				<Skeleton variant="rounded" width={140} height={40} className="rounded-xl" animation="wave" />
			</Box>

			{/* Table Content Skeleton */}
			<TableSkeleton columns={columns} rows={rows} />
		</Box>
	);
}
