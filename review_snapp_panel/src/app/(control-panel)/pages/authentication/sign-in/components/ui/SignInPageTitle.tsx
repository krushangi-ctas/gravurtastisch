import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@fuse/core/Link';

function SignInPageTitle() {
	return (
		<div className="w-full">
			<Box className="flex items-center gap-2.5">
				<img
					className="w-9 h-9"
					src="/assets/images/logo/gravurstastich-mark.svg"
					alt="Gravurtastisch"
				/>
				<Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.2, color: 'primary.main' }}>
					Gravurtastisch
				</Typography>
			</Box>

			<Typography className="mt-8 text-4xl leading-[1.25] font-extrabold tracking-tight">
				Sign in
			</Typography>
			<div className="mt-0.5 flex items-baseline font-medium">
				<Typography>Don't have an account?</Typography>
				<Link className="ml-1" to="/sign-up">
					Sign up
				</Link>
			</div>
		</div>
	);
}

export default SignInPageTitle;
