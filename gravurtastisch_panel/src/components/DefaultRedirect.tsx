'use client';

import { Navigate } from 'react-router';
import usePermissions from '@/hooks/usePermissions';
import { getFirstAccessibleRoute } from '@/configs/sectionRoutes';

/**
 * Resolves `/` to the first section the current user can view (never hardcoded).
 */
export default function DefaultRedirect() {
	const { can, scope, user } = usePermissions();

	if (!user) {
		return <Navigate to="/sign-in" replace />;
	}

	const target = getFirstAccessibleRoute(scope, can);
	return <Navigate to={target} replace />;
}
