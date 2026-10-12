import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const headlineSx = {
	fontFamily: "'Montserrat', sans-serif",
	fontWeight: 700
} as const;

function SignInPageTitle() {
	return (
		<div className="w-full">
			<Box className="flex items-center">
				<img
					className="h-10 sm:h-12 w-auto object-contain"
					src="/gravurtastich.png"
					alt="Gravurtastisch"
				/>
			</Box>

			<Typography
				className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900"
				sx={headlineSx}
			>
				Sign in
			</Typography>
		</div>
	);
}

export default SignInPageTitle;
