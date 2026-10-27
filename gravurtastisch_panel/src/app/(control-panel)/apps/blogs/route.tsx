import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';

const BlogsView = lazy(() => import('./components/views/BlogsView'));
const BlogFormView = lazy(() => import('./components/views/BlogFormView'));

/**
 * The Blogs app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/blogs',
	element: <PermissionGuard section="blogs" title="Blog Management" />,
	children: [
		{
			path: '',
			element: <BlogsView />
		},
		{
			path: 'new',
			element: <BlogFormView />
		},
		{
			path: ':blogId',
			element: <BlogFormView />
		}
	]
};

export default Route;
