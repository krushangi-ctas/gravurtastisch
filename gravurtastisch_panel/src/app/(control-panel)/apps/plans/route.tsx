import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const PlansView = lazy(() => import('./components/views/PlansView'));
const PlanFormView = lazy(() => import('./components/views/PlanFormView'));

/**
 * The Plans app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/plans',
	element: <PermissionGuard section="plans" title="Plans" />,
	children: [
		{
			path: '',
			element: <PlansView />
		},
		{
			path: 'new',
			element: <PlanFormView />
		},
		{
			path: ':planId',
			element: <PlanFormView />
		}
	]
};

export default Route;
