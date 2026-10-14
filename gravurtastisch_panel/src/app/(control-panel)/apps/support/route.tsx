import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const SupportView = lazy(() => import('./components/views/SupportView'));

/**
 * The Customer Support app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/support',
	element: <PermissionGuard section="support" title="Customer Support" />,
	children: [
		{
			path: '',
			children: [
				{
					path: '',
					element: <SupportView />
				}
			]
		}
	]
};

export default Route;
