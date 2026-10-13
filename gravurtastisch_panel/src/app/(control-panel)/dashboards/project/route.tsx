import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const ProjectDashboardAppView = lazy(() => import('./components/views/ProjectDashboardAppView'));

/**
 * Project Dashboard App  Route
 */
const route: FuseRouteItemType = {
	path: 'dashboards/project',
	element: (
		<PermissionGuard section="dashboards" title="Project Dashboard">
			<ProjectDashboardAppView />
		</PermissionGuard>
	)
};

export default route;
