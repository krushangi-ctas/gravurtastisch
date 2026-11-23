import Typography from '@mui/material/Typography';
import Link from '@fuse/core/Link';
import { BrandLogo } from '@/components/ui/BrandLogo';

function ConfirmationRequiredPageTitle() {
	return (
		<div className="w-full">
			<BrandLogo size="md" />

			<Typography className="mt-8 text-4xl leading-[1.25] font-extrabold tracking-tight">
				Confirmation required
			</Typography>
			<Typography className="mt-4">
				A confirmation mail with instructions has been sent to your email address. Follow those instructions to
				confirm your email address and activate your account.
			</Typography>

			<Typography
				className="text-md mt-8 font-medium"
				color="text.secondary"
			>
				Return to <Link to="/sign-in">sign in</Link>
			</Typography>
		</div>
	);
}

export default ConfirmationRequiredPageTitle;
