import Typography from '@mui/material/Typography';
import { BrandLogo } from '@/components/ui/BrandLogo';

function SignOutPageTitle() {
	return (
		<div className="w-full flex flex-col items-center">
			<BrandLogo size="md" />

			<Typography className="mt-8 text-center text-4xl leading-[1.25] font-extrabold tracking-tight">
				You have signed out!
			</Typography>
			<Typography className="mt-0.5 flex justify-center font-medium">Redirecting in 5 seconds</Typography>
		</div>
	);
}

export default SignOutPageTitle;
