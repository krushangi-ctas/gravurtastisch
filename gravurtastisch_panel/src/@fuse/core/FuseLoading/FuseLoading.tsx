import { useTimeout } from '@fuse/hooks';
import { useState } from 'react';
import clsx from 'clsx';

export type FuseLoadingProps = {
	delay?: number;
	className?: string;
};

/**
 * FuseLoading displays a branded loading state with Gravurtastisch logo and progress bar.
 */
function FuseLoading(props: FuseLoadingProps) {
	const { delay = 0, className } = props;
	const [showLoading, setShowLoading] = useState(!delay);

	useTimeout(() => {
		setShowLoading(true);
	}, delay);

	return (
		<div
			className={clsx(
				className,
				'flex h-full min-h-screen w-full flex-1 flex-col items-center justify-center self-center bg-white p-6',
				!showLoading ? 'hidden' : ''
			)}
		>
			<div className="splash-container flex flex-col items-center justify-center gap-5">
				<div className="splash-logo-wrapper relative flex items-center justify-center">
					<div className="splash-logo-glow" />
					<img
						className="splash-logo w-48 sm:w-56 h-auto object-contain"
						src="/assets/images/logo/gravurstastich-wordmark.svg"
						alt="Gravurtastisch"
					/>
				</div>
				<div className="splash-progress-track">
					<div className="splash-progress-bar" />
				</div>
			</div>
		</div>
	);
}

export default FuseLoading;
