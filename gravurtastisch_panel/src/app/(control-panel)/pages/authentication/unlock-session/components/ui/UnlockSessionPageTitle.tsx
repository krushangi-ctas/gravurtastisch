import Typography from '@mui/material/Typography';
import { BrandLogo } from '@/components/ui/BrandLogo';

function UnlockSessionPageTitle() {
	return (
		<div className="w-full">
			<BrandLogo size="md" />

			<Typography className="mt-8 text-4xl leading-[1.25] font-extrabold tracking-tight">
				Unlock your session
			</Typography>
			<Typography className="font-medium">Your session is locked due to inactivity</Typography>
		</div>
	);
}

export default UnlockSessionPageTitle;
