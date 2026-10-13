import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const UsersView = lazy(() => import('../users/components/views/UsersView'));

const Route: FuseRouteItemType = {
	path: '/sellers',
	element: <PermissionGuard section="sellers" title="Sellers" />,
	children: [
		{
			path: '',
			element: <UsersView variant="sellers" />
		}
	]
};

export default Route;
