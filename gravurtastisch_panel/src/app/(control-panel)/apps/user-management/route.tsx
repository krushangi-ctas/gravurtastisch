import { lazy } from 'react';
import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const UsersView = lazy(() => import('../users/components/views/UsersView'));
const RolesView = lazy(() => import('../roles/components/views/RolesView'));
const SectionsView = lazy(() => import('../sections/components/views/SectionsView'));

const Route: FuseRouteItemType = {
	path: '/user-management',
	children: [
		{
			path: '',
			element: <Navigate to="/user-management/users" replace />
		},
		{
			path: 'users',
			element: (
				<PermissionGuard section="/user-management/users" title="Admin Users">
					<UsersView variant="admin-users" managementTab="users" />
				</PermissionGuard>
			)
		},
		{
			path: 'sections',
			element: (
				<PermissionGuard section="/user-management/sections" title="Sections">
					<SectionsView managementTab="sections" />
				</PermissionGuard>
			)
		},
		{
			path: 'roles',
			element: (
				<PermissionGuard section="/user-management/roles" title="Roles">
					<RolesView managementTab="roles" />
				</PermissionGuard>
			)
		}
	]
};

export default Route;
