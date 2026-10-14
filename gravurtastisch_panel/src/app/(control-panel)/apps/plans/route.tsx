import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const PlansView = lazy(() => import('./components/views/PlansView'));

/**
 * The Plans app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/plans',
	element: <PermissionGuard section="plans" title="Plans" />,
	children: [
		{
			path: '',
			children: [
				{
					path: '',
					element: <PlansView />
				}
			]
		}
	]
};

export default Route;
