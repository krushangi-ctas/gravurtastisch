import _ from 'lodash';
import clsx from 'clsx';
import IconButton from '@mui/material/IconButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import usePathname from '@fuse/hooks/usePathname';
import SettingsAppNavigation from '../../lib/constants/SettingsAppNavigation';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';

type SettingsAppHeaderProps = {
	className?: string;
	onSetSidebarOpen: (open: boolean) => void;
};

function SettingsAppHeader(props: SettingsAppHeaderProps) {
	const { className, onSetSidebarOpen } = props;
	const pathname = usePathname();
	const currentNavigation = _.find(SettingsAppNavigation.children, {
		url: pathname
	});
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	return (
		<div className={clsx('w-full', className)}>
			<div className="w-full bg-primary-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-md">
				<div className="flex items-center gap-2.5">
					{isMobile && (
						<IconButton
							className="text-white hover:bg-white/10 p-1"
							onClick={() => onSetSidebarOpen(true)}
							aria-label="open left sidebar"
						>
							<FuseSvgIcon size={18} className="text-white">heroicons-outline:bars-3</FuseSvgIcon>
						</IconButton>
					)}
					<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 text-white">
						<FuseSvgIcon size={18} className="text-white">
							heroicons-outline:cog-6-tooth
						</FuseSvgIcon>
					</div>
					<h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0">
						{currentNavigation?.title || 'Settings'}
					</h1>
				</div>
			</div>
		</div>
	);
}

export default SettingsAppHeader;

