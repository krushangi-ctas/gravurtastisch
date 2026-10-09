import { Box, Skeleton } from '@mui/material';

interface FormSkeletonProps {
	fields?: number;
	showEditor?: boolean;
	showImageUploader?: boolean;
}

export default function FormSkeleton({
	fields = 3,
	showEditor = false,
	showImageUploader = false
}: FormSkeletonProps) {
	return (
		<Box className="space-y-6 py-2">
			{/* Text fields */}
			{Array.from({ length: fields }).map((_, i) => (
				<Box key={`field-${i}`} className="space-y-2">
					<Skeleton variant="text" width={140} height={18} animation="wave" />
					<Skeleton variant="rounded" width="100%" height={i === 1 && fields > 2 ? 80 : 44} className="rounded-xl" animation="wave" />
				</Box>
			))}

			{/* Rich Text Editor Skeleton */}
			{showEditor && (
				<Box className="space-y-2">
					<Skeleton variant="text" width={160} height={18} animation="wave" />
					<Box className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
						{/* Editor Toolbar Skeleton */}
						<Box className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-gray-800">
							<Skeleton variant="rounded" width={28} height={28} className="rounded-md" animation="wave" />
							<Skeleton variant="rounded" width={28} height={28} className="rounded-md" animation="wave" />
							<Skeleton variant="rounded" width={28} height={28} className="rounded-md" animation="wave" />
							<Skeleton variant="text" width={20} height={20} className="mx-1" animation="wave" />
							<Skeleton variant="rounded" width={28} height={28} className="rounded-md" animation="wave" />
							<Skeleton variant="rounded" width={28} height={28} className="rounded-md" animation="wave" />
						</Box>
						{/* Editor Canvas */}
						<Box className="p-4 space-y-2.5 min-h-[180px]">
							<Skeleton variant="text" width="90%" height={18} animation="wave" />
							<Skeleton variant="text" width="75%" height={18} animation="wave" />
							<Skeleton variant="text" width="85%" height={18} animation="wave" />
							<Skeleton variant="text" width="40%" height={18} animation="wave" />
						</Box>
					</Box>
				</Box>
			)}

			{/* Image Uploader Skeleton */}
			{showImageUploader && (
				<Box className="space-y-3 pt-2">
					<Box className="flex justify-between items-center">
						<Skeleton variant="text" width={150} height={18} animation="wave" />
						<Skeleton variant="rounded" width={110} height={32} className="rounded-lg" animation="wave" />
					</Box>
					<Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{[1, 2].map((k) => (
							<Box key={k} className="p-3 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-3">
								<Skeleton variant="rounded" width={48} height={48} className="rounded-lg" animation="wave" />
								<Box className="flex-1 space-y-1.5">
									<Skeleton variant="text" width="80%" height={16} animation="wave" />
									<Skeleton variant="text" width="50%" height={12} animation="wave" />
								</Box>
							</Box>
						))}
					</Box>
				</Box>
			)}
		</Box>
	);
}
