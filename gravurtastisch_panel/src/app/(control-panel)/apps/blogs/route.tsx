import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PermissionGuard from '@/components/PermissionGuard';
import BlogsView from './components/views/BlogsView';

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
