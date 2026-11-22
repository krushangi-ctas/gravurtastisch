import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/theme-layouts/components/LanguageSwitcher';

function SignOutPageTitle() {
	const { t } = useTranslation();

	return (
		<div className="w-full">
			<Box className="flex items-center justify-between gap-3">
				<img
					className="h-10 sm:h-12 w-auto object-contain"
					src="/gravurtastich.png"
					alt="Printomation"
				/>
				<LanguageSwitcher />
			</Box>

			<Typography className="mt-8 text-center text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
				{t('auth.signedOut', 'You have signed out!')}
			</Typography>
		</div>
	);
}

export default SignOutPageTitle;
