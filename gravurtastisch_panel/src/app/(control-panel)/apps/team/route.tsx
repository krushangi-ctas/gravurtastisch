import { lazy } from 'react';
import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const UsersView = lazy(() => import('../users/components/views/UsersView'));
const RolesView = lazy(() => import('../roles/components/views/RolesView'));
const SectionsView = lazy(() => import('../sections/components/views/SectionsView'));

const Route: FuseRouteItemType = {
	path: '/team',
	children: [
		{
			path: '',
			element: <Navigate to="/team/members" replace />
		},
		{
			path: 'members',
			element: (
				<PermissionGuard section="/team/members" title="Team Members">
					<UsersView variant="team" managementTab="members" />
				</PermissionGuard>
			)
		},
		{
			path: 'sections',
			element: (
				<PermissionGuard section="/team/sections" title="Sections">
					<SectionsView managementTab="sections" />
				</PermissionGuard>
			)
		},
		{
			path: 'roles',
			element: (
				<PermissionGuard section="/team/roles" title="Roles">
					<RolesView managementTab="roles" />
				</PermissionGuard>
			)
		}
	]
};

export default Route;
