import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import usePermissions from '@/hooks/usePermissions';

function RolesRedirect() {
	const { scope } = usePermissions();
	const target = scope === 'seller' ? '/team/roles' : '/user-management/roles';
	return <Navigate to={target} replace />;
}

const Route: FuseRouteItemType = {
	path: '/roles',
	element: <RolesRedirect />
};

export default Route;
