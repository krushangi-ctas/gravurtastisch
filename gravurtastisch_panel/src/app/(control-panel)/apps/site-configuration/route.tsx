import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const SiteConfigurationView = lazy(() => import('./components/views/SiteConfigurationView'));

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
