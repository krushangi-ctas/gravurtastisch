import { memo } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';

/**
 * Splash screen with Printomation brand mark and progress bar.
 */
function FuseSplashScreen() {
	return (
		<div id="fuse-splash-screen">
			<div className="splash-container">
				<div className="splash-logo-wrapper">
					<div className="splash-logo-glow" />
					<BrandLogo size="lg" />
				</div>
				<div className="splash-progress-track">
					<div className="splash-progress-bar" />
				</div>
			</div>
		</div>
	);
}

export default memo(FuseSplashScreen);
