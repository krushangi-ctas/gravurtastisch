import { lazy } from 'react';
import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const RolesView = lazy(() => import('./components/views/RolesView'));

const Route: FuseRouteItemType = {
	path: '/roles',
	element: <Outlet />,
	children: [
		{
			path: '',
			element: <RolesView />
		}
	]
};

export default Route;
