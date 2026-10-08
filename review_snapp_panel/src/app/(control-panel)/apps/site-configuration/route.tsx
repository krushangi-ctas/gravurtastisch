import { Outlet } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import SiteConfigurationView from './components/views/SiteConfigurationView';

/**
 * The Site Configuration app Routes.
 */
const Route: FuseRouteItemType = {
	path: '/site-configuration',
	element: <Outlet />,
	children: [
		{
			path: '',
			children: [
				{
					path: '',
					element: <SiteConfigurationView />
				}
			]
		}
	]
};

export default Route;
