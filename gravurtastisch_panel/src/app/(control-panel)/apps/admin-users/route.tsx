import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const UsersView = lazy(() => import('../users/components/views/UsersView'));

const Route: FuseRouteItemType = {
	path: '/admin-users',
	element: <PermissionGuard section="users" title="Admin Users" />,
	children: [
		{
			path: '',
			element: <UsersView variant="admin-users" />
		}
	]
};

export default Route;
