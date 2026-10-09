import { lazy } from 'react';
import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const UsersView = lazy(() => import('../users/components/views/UsersView'));

const Route: FuseRouteItemType = {
	path: '/sellers',
	element: <Outlet />,
	children: [
		{
			path: '',
			element: <UsersView variant="sellers" />
		}
	]
};

export default Route;
