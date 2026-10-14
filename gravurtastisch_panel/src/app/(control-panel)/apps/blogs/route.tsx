import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const BlogsView = lazy(() => import('./components/views/BlogsView'));

/**
 * The Blogs app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/blogs',
	element: <PermissionGuard section="blogs" title="Blog Management" />,
	children: [
		{
			path: '',
			children: [
				{
					path: '',
					element: <BlogsView />
				}
			]
		}
	]
};

export default Route;
