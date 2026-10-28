import _ from 'lodash';
import clsx from 'clsx';
import IconButton from '@mui/material/IconButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import usePathname from '@fuse/hooks/usePathname';
import SettingsAppNavigation from '../../lib/constants/SettingsAppNavigation';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import NavbarToggleButton from '@/components/theme-layouts/components/navbar/NavbarToggleButton';

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
			<div className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-xs">
				<div className="flex items-center gap-2 sm:gap-2.5">
					{/* {isMobile && (
						<NavbarToggleButton
							className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 shrink-0 -ml-1 border-0"
							aria-label="open main navigation menu"
						>
							<FuseSvgIcon size={20}>heroicons-outline:bars-3</FuseSvgIcon>
						</NavbarToggleButton>
					)} */}
					{isMobile && (
						<IconButton
							className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 shrink-0"
							onClick={() => onSetSidebarOpen(true)}
							aria-label="open settings sub-menu"
							title="Settings Menu"
						>
							<FuseSvgIcon size={18}>heroicons-outline:adjustments-horizontal</FuseSvgIcon>
						</IconButton>
					)}
					<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
						<FuseSvgIcon size={20} className="text-primary">
							{currentNavigation?.id === 'settings.siteConfiguration'
								? 'heroicons-outline:globe-alt'
								: currentNavigation?.id === 'settings.generalSetting'
								? 'heroicons-outline:cog-6-tooth'
								: 'heroicons-outline:user-circle'}
						</FuseSvgIcon>
					</div>
					<div className="flex flex-col min-w-0">
						<h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight">
							{currentNavigation?.title || 'Settings'}
						</h1>
						<p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 m-0 font-medium leading-tight mt-1">
							{currentNavigation?.id === 'settings.siteConfiguration'
								? 'Configure website contact details, company profile, and social media links.'
								: currentNavigation?.id === 'settings.generalSetting'
								? 'Manage default marketplace rules, order matching, and automated requests.'
								: 'Manage your account settings, security preferences, and profile details.'}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SettingsAppHeader;

