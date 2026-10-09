import { lazy } from 'react';
import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const UsersView = lazy(() => import('../users/components/views/UsersView'));

const Route: FuseRouteItemType = {
	path: '/admin-users',
	element: <Outlet />,
	children: [
		{
			path: '',
			element: <UsersView variant="admin-users" />
		}
	]
};

export default Route;
