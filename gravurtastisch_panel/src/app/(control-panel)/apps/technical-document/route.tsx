import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ApiDocsView = lazy(() => import('../api-docs/components/views/ApiDocsView'));

const Route: FuseRouteItemType = {
	path: '/technical-document',
	children: [
		{
			path: '',
			element: <ApiDocsView />
		}
	]
};

export default Route;
