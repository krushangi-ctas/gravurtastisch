import Typography from '@mui/material/Typography';

function UnlockSessionPageTitle() {
	return (
		<div className="w-full">
			<img
				className="w-40"
				src="/gravurtastich.png"
				alt="logo"
			/>

			<Typography className="mt-8 text-4xl leading-[1.25] font-extrabold tracking-tight">
				Unlock your session
			</Typography>
			<Typography className="font-medium">Your session is locked due to inactivity</Typography>
		</div>
	);
}

export default UnlockSessionPageTitle;
