import { useNavigate } from 'react-router';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import usePermissions from '@/hooks/usePermissions';

type AccessDeniedViewProps = {
	sectionTitle?: string;
	message?: string;
};

export default function AccessDeniedView({
	sectionTitle,
	message
}: AccessDeniedViewProps) {
	const navigate = useNavigate();
	const { defaultLandingRoute } = usePermissions();

	const handleBack = () => {
		if (window.history.length > 1) {
			navigate(-1);
		} else {
			navigate(defaultLandingRoute || '/');
		}
	};

	return (
		<div className="flex flex-1 flex-col items-center justify-center min-h-[520px] w-full p-6 text-center">
			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.25, ease: 'easeOut' }}
				className="flex flex-col items-center max-w-lg w-full"
			>
				{/* Shield Icon with glowing ring */}
				<div className="relative mb-5 flex items-center justify-center">
					<div className="absolute inset-0 rounded-3xl bg-amber-500/10 blur-xl dark:bg-amber-500/15" />
					<div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50/80 text-amber-700 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400">
						<FuseSvgIcon size={46}>lucide:shield-alert</FuseSvgIcon>
					</div>
				</div>

				{/* Status Chip */}
				<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300 mb-3">
					<span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
					Access Restricted
				</span>

				{/* Title */}
				<Typography
					variant="h4"
					className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
				>
					{sectionTitle ? `Access Denied: ${sectionTitle}` : 'Access Denied'}
				</Typography>

				{/* English Message */}
				<Typography className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
					{message ||
						'You do not have permission to access this page. Please contact your system administrator if you believe you should have access.'}
				</Typography>

				{/* Action Button: Back */}
				<div className="mt-8 flex items-center justify-center">
					<Button
						variant="contained"
						color="primary"
						onClick={handleBack}
						startIcon={<FuseSvgIcon size={18}>lucide:arrow-left</FuseSvgIcon>}
						className="px-8 py-2.5 rounded-xl font-medium shadow-sm hover:shadow transition-all"
					>
						Back
					</Button>
				</div>
			</motion.div>
		</div>
	);
}
