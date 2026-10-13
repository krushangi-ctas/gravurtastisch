import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const RolesView = lazy(() => import('./components/views/RolesView'));

const Route: FuseRouteItemType = {
	path: '/roles',
	element: <PermissionGuard section="roles" title="Roles" />,
	children: [
		{
			path: '',
			element: <RolesView />
		}
	]
};

export default Route;
