import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';

const Root = styled('div')(({ theme }) => ({
	'& > .logo-icon': {
		transition: theme.transitions.create(['width', 'height'], {
			duration: theme.transitions.duration.shortest,
			easing: theme.transitions.easing.easeInOut
		})
	},
	'& > .badge': {
		transition: theme.transitions.create('opacity', {
			duration: theme.transitions.duration.shortest,
			easing: theme.transitions.easing.easeInOut
		})
	}
}));

type LogoProps = {
	className?: string;
};

/**
 * Gravurtastisch brand mark + wordmark for the sidebar.
 */
function Logo(props: LogoProps) {
	const { className = '' } = props;
	return (
		<Root className={clsx('flex flex-shrink-0 flex-grow items-center gap-3', className)}>
			<div className="flex flex-1 items-center gap-2.5">
				<img
					className="logo-icon h-8 w-8"
					src="/assets/images/logo/gravurstastich-mark.svg"
					alt="Gravurtastisch"
				/>
				<div className="logo-text flex flex-auto flex-col gap-0.5 min-w-0">
					<Typography
						className="tracking-tight text-base leading-none font-semibold truncate"
						sx={{ color: 'primary.main' }}
					>
						Gravurtastisch
					</Typography>
					<Typography
						className="tracking-tight text-[11px] leading-snug font-medium truncate"
						color="text.secondary"
					>
						Engraving &amp; Custom Orders
					</Typography>
				</div>
			</div>
		</Root>
	);
}

export default Logo;
