import FuseNavigation from '@fuse/core/FuseNavigation/FuseNavigation';
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

function SettingsAppSidebarContent(props: SettingsAppSidebarContentProps) {
	const { className, onSetSidebarOpen } = props;
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { scope } = usePermissions();

	const navigationItems = useMemo(() => {
		if (scope === 'admin') {
			return (SettingsAppNavigation.children || []).filter(
				(item) => item.id !== 'settings.generalSetting'
			);
		}
		return SettingsAppNavigation.children || [];
	}, [scope]);

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
