import FuseNavigation from '@fuse/core/FuseNavigation/FuseNavigation';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import clsx from 'clsx';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import SettingsAppNavigation from '../../lib/constants/SettingsAppNavigation';

import usePermissions from '@/hooks/usePermissions';
import { useMemo } from 'react';

type SettingsAppSidebarContentProps = {
	className?: string;
	onSetSidebarOpen: (open: boolean) => void;
};

type NavItemWithSection = FuseNavItemType & { authSection?: string };

function SettingsAppSidebarContent(props: SettingsAppSidebarContentProps) {
	const { className, onSetSidebarOpen } = props;
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { canView } = usePermissions();

	const navigationItems = useMemo(() => {
		const items = SettingsAppNavigation.children || [];
		return items.filter((item) => {
			const sectionKey =
				(item as NavItemWithSection).authSection || item.url || item.id || '';
			return canView(sectionKey);
		});
	}, [canView]);

	return (
		<div>
			<div className={clsx('flex items-center justify-between p-4', className)}>
				<Typography className="text-4xl leading-none font-extrabold tracking-tight"> Settings</Typography>
				{isMobile && (
					<IconButton
						onClick={() => onSetSidebarOpen(false)}
						aria-label="close left sidebar"
						size="small"
					>
						<FuseSvgIcon>lucide:x</FuseSvgIcon>
					</IconButton>
				)}
			</div>
			<FuseNavigation navigation={navigationItems} />
		</div>
	);
}

export default SettingsAppSidebarContent;
