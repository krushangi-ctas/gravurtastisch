import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import PlansView from './components/views/PlansView';

/**
 * The Plans app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/plans',
	element: <Outlet />,
	children: [
		{
			path: '',
			children: [
				{
					path: '',
					element: <PlansView />
				}
			]
		}
	]
};

export default Route;
