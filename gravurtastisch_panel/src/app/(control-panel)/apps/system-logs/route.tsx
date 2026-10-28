import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const SystemLogsView = lazy(() => import('./components/views/SystemLogsView'));

/**
 * The System Logs app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/system-logs',
	element: <PermissionGuard section="system-logs" title="System Logs" />,
	children: [
		{
			path: '',
			element: <SystemLogsView />
		}
	]
};

export default Route;
