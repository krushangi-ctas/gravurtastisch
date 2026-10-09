import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import SupportView from './components/views/SupportView';

/**
 * The Customer Support app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/support',
	element: <Outlet />,
	children: [
		{
			path: '',
			children: [
				{
					path: '',
					element: <SupportView />
				}
			]
		}
	]
};

export default Route;
