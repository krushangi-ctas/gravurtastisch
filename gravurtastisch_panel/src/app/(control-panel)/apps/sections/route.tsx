import { Navigate } from 'react-router';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import usePermissions from '@/hooks/usePermissions';

function SectionsRedirect() {
	const { scope } = usePermissions();
	const target = scope === 'seller' ? '/team/sections' : '/user-management/sections';
	return <Navigate to={target} replace />;
}

const Route: FuseRouteItemType = {
	path: '/sections',
	element: <SectionsRedirect />
};

export default Route;
