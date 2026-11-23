import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@fuse/core/Link';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/theme-layouts/components/LanguageSwitcher';
import { BrandLogo } from '@/components/ui/BrandLogo';

const headlineSx = {
	fontFamily: "'Montserrat', sans-serif",
	fontWeight: 700
} as const;

function SignUpPageTitle() {
	const { t } = useTranslation();

	return (
		<div className="w-full">
			<Box className="flex items-center justify-between gap-3">
				<BrandLogo size="md" />
				<LanguageSwitcher />
			</Box>

			<Typography
				className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-slate-900"
				sx={headlineSx}
			>
				{t('auth.signUp', 'Sign up')}
			</Typography>
			<div className="mt-1 flex items-baseline font-medium text-sm text-slate-600">
				<Typography variant="body2">{t('auth.alreadyHaveAccount', 'Already have an account?')}</Typography>
				<Link className="ml-1 font-semibold text-primary" to="/sign-in">
					{t('auth.signIn', 'Sign in')}
				</Link>
			</div>
		</div>
	);
}

export default SignUpPageTitle;
