import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import { layoutConfigOnlyMain } from '@/configs/layoutConfigTemplates';

const Error401PageView = lazy(() => import('./components/views/Error401PageView'));
const Error404PageView = lazy(() => import('./components/views/Error404PageView'));

/**
 * The Error page routes.
 */
const route: FuseRouteItemType = {
	path: '',
	children: [
		{
			path: '401',
			element: <Error401PageView />
		},
		{
			path: '404',
			element: <Error404PageView />,
			settings: { layout: layoutConfigOnlyMain },
			auth: null
		}
	]
};

export default route;
