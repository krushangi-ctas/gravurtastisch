import { useCallback, useMemo } from 'react';
import useUser from '@auth/useUser';
import {
	ADMIN_SECTION_KEYS,
	getFirstAccessibleRoute,
	SELLER_SECTION_KEYS,
	type PanelScope
} from '@/configs/sectionRoutes';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

export type SectionPermission = {
	canView?: boolean;
	canCreate?: boolean;
	canUpdate?: boolean;
	canDelete?: boolean;
};

export type PermissionsMap = Record<string, SectionPermission>;

const ACTION_KEY: Record<PermissionAction, keyof SectionPermission> = {
	view: 'canView',
	create: 'canCreate',
	update: 'canUpdate',
	delete: 'canDelete'
};

/**
 * Central permission dispatcher for the control panel.
 * SuperAdmin and sellerAdmin (org owner) bypass role checks within their scope.
 */
function usePermissions() {
	const { data: user } = useUser();

	const permissions = useMemo<PermissionsMap>(
		() => (user?.permissions as PermissionsMap) || {},
		[user?.permissions]
	);

	const isSuperAdmin = Boolean(user?.isSuperAdmin);
	const isSellerAdmin = Boolean(
		user?.isSellerAdmin ||
			(user?.roleInfo?.isBypass && user?.roleInfo?.scope === 'seller')
	);

	const scope = useMemo<PanelScope>(() => {
		if (isSuperAdmin || user?.userType === 'admin') {
			return 'admin';
		}
		return 'seller';
	}, [isSuperAdmin, user?.userType]);

	const isBypass = isSuperAdmin || isSellerAdmin;

	const can = useCallback(
		(section: string, action: PermissionAction = 'view') => {
			if (!user) return false;
			if (isSuperAdmin) {
				return (ADMIN_SECTION_KEYS as readonly string[]).includes(section);
			}
			if (isSellerAdmin) {
				return (SELLER_SECTION_KEYS as readonly string[]).includes(section);
			}
			const sectionPerm = permissions[section];
			if (!sectionPerm) return false;
			return Boolean(sectionPerm[ACTION_KEY[action]]);
		},
		[user, isSuperAdmin, isSellerAdmin, permissions]
	);

	const canView = useCallback((section: string) => can(section, 'view'), [can]);
	const canCreate = useCallback((section: string) => can(section, 'create'), [can]);
	const canUpdate = useCallback((section: string) => can(section, 'update'), [can]);
	const canDelete = useCallback((section: string) => can(section, 'delete'), [can]);

	const defaultLandingRoute = useMemo(
		() => getFirstAccessibleRoute(scope, can),
		[scope, can]
	);

	return {
		user,
		permissions,
		isSuperAdmin,
		isSellerAdmin,
		isBypass,
		can,
		canView,
		canCreate,
		canUpdate,
		canDelete,
		scope,
		defaultLandingRoute,
		/** Seller team section key; admin pages use `sellers` or `users` explicitly. */
		userSection: scope === 'seller' ? 'user' : 'users'
	};
}

export default usePermissions;
