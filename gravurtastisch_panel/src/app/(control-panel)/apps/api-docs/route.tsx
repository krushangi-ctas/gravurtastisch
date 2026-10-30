import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ApiDocsView = lazy(() => import('./components/views/ApiDocsView'));

const Route: FuseRouteItemType = {
	path: '/api-docs',
	children: [
		{
			path: '',
			element: <ApiDocsView />
		}
	]
};

export default Route;
