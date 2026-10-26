import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Route: FuseRouteItemType = {
	path: '/admin-users',
	element: <Navigate to="/user-management/users" replace />
};

export default Route;
