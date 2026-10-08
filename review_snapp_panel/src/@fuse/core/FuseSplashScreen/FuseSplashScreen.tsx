import { memo } from 'react';

/**
 * Splash screen with Gravurtastisch brand mark and progress bar.
 */
function FuseSplashScreen() {
	return (
		<div id="fuse-splash-screen">
			<div className="splash-container">
				<div className="splash-logo-wrapper">
					<div className="splash-logo-glow" />
					<img
						className="splash-logo"
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

export default memo(FuseSplashScreen);
