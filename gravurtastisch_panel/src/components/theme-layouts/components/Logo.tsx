import { styled } from '@mui/material/styles';
import clsx from 'clsx';
import { BrandLogo } from '@/components/ui/BrandLogo';

const Root = styled('div')(() => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%'
}));

type LogoProps = {
	className?: string;
	variant?: 'dark' | 'light' | 'auto';
	size?: 'sm' | 'md' | 'lg';
};

/**
 * Printomation brand logo for the sidebar.
 */
function Logo(props: LogoProps) {
	const { className = '', variant = 'auto', size = 'md' } = props;
	return (
		<Root className={clsx('flex w-full items-center justify-center py-2', className)}>
			<BrandLogo variant={variant} size={size} />
		</Root>
	);
}

export default Logo;
