import Typography from '@mui/material/Typography';

function SignOutPageTitle() {
	return (
		<div className="w-full">
			<img
				className="w-12 h-12 mx-auto"
				src="/assets/images/logo/gravurstastich-mark.svg"
				alt="Gravurtastisch"
			/>

			<Typography className="mt-8 text-center text-4xl leading-[1.25] font-extrabold tracking-tight">
				You have signed out!
			</Typography>
		</div>
	);
}

export default SignOutPageTitle;
