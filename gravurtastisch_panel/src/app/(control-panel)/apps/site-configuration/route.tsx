import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

/**
 * Backward compatibility redirect for Site Configuration.
 */
const Route: FuseRouteItemType = {
	path: '/site-configuration',
	element: <Navigate to="/settings/site-configuration" replace />
};

export default Route;
