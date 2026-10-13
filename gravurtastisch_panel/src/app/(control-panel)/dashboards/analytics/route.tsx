import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const AnalyticsDashboardAppView = lazy(() => import('./components/views/AnalyticsDashboardAppView'));

/**
 * The Analytics Dashboard App Route
 */
const route: FuseRouteItemType = {
	path: 'dashboards/analytics',
	element: (
		<PermissionGuard section="dashboards" title="Analytics Dashboard">
			<AnalyticsDashboardAppView />
		</PermissionGuard>
	)
};

export default route;
