import { styled } from '@mui/material/styles';
import clsx from 'clsx';

const Root = styled('div')(() => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%'
}));

type LogoProps = {
	className?: string;
};

/**
 * Gravurtastisch brand logo for the sidebar.
 */
function Logo(props: LogoProps) {
	const { className = '' } = props;
	return (
		<Root className={clsx('flex w-full items-center justify-center', className)}>
			<img
				className="h-12 w-auto max-w-[195px] object-contain block mx-auto"
				src="/gravurtastich.png"
				alt="Gravurtastisch"
			/>
		</Root>
	);
}

export default Logo;
