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
			<div className="w-full bg-secondary-500 text-slate-900 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-md">
				<div className="flex items-center gap-2.5">
					{isMobile && (
						<IconButton
							className="text-slate-900 hover:bg-black/10 p-1"
							onClick={() => onSetSidebarOpen(true)}
							aria-label="open left sidebar"
						>
							<FuseSvgIcon size={18} className="text-slate-900">heroicons-outline:bars-3</FuseSvgIcon>
						</IconButton>
					)}
					<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-black/10 text-slate-900">
						<FuseSvgIcon size={18} className="text-slate-900">
							heroicons-outline:cog-6-tooth
						</FuseSvgIcon>
					</div>
					<h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 m-0">
						{currentNavigation?.title || 'Settings'}
					</h1>
				</div>
			</div>
		</div>
	);
}

export default SettingsAppHeader;

