import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';
import SiteConfigurationView from './components/views/SiteConfigurationView';

/**
 * The Site Configuration app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/site-configuration',
	element: <PermissionGuard section="site-configuration" title="Site Configuration" />,
	children: [
		{
			path: '',
			children: [
				{
					path: '',
					element: <SiteConfigurationView />
				}
			]
		}
	]
};

export default Route;
