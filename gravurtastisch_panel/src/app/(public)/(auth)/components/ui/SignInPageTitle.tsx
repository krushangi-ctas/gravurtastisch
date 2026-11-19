import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/theme-layouts/components/LanguageSwitcher';

const headlineSx = {
	fontFamily: "'Montserrat', sans-serif",
	fontWeight: 700
} as const;

function SignInPageTitle() {
	const { t } = useTranslation();

	return (
		<div className="w-full">
			<Box className="flex items-center justify-between gap-3">
				<img
					className="h-10 sm:h-12 w-auto object-contain"
					src="/gravurtastich.png"
					alt="Gravurtastisch"
				/>
				<LanguageSwitcher />
			</Box>

			<Typography
				className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900"
				sx={headlineSx}
			>
				{t('auth.signIn', 'Sign in')}
			</Typography>
		</div>
	);
}

export default SignInPageTitle;
