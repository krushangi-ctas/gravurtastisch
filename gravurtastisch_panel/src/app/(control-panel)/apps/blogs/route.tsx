import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import BlogsView from './components/views/BlogsView';

/**
 * The Blogs app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/blogs',
	element: <Outlet />,
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
