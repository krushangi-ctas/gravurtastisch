import { useCallback, useMemo } from 'react';
import useUser from '@auth/useUser';
import {
	getFirstAccessibleRoute,
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

			const clean = section.replace(/^\//, '').toLowerCase();
			const actionKey = ACTION_KEY[action];

			// 1. Direct match (exact normalized key from DB permissions)
			const directKey = Object.keys(permissions).find(
				(k) => k.replace(/^\//, '').toLowerCase() === clean
			);
			if (directKey && permissions[directKey]) {
				return Boolean(permissions[directKey][actionKey]);
			}

			// 2. Suffix match (e.g. 'roles' matches 'team/roles' or 'user-management/roles')
			const suffixKey = Object.keys(permissions).find(
				(k) => k.replace(/^\//, '').toLowerCase().endsWith('/' + clean)
			);
			if (suffixKey && permissions[suffixKey]) {
				return Boolean(permissions[suffixKey][actionKey]);
			}

			// 3. Prefix match for grouped sections (e.g. 'team' matches if any 'team/*' has permission)
			const hasPrefixMatch = Object.entries(permissions).some(
				([k, v]) =>
					k.replace(/^\//, '').toLowerCase().startsWith(clean + '/') &&
					Boolean(v?.[actionKey])
			);
			if (hasPrefixMatch) {
				return true;
			}

			// Scope-aware bypass for Super Admin
			if (isSuperAdmin && scope === 'admin') {
				const isSellerOnly = [
					'orders',
					'amazon-credentials',
					'team',
					'settings/generalsetting'
				].some((sel) => clean === sel || clean.startsWith(sel + '/'));
				if (!isSellerOnly) {
					return true;
				}
			}

			// Scope-aware bypass for Seller Admin
			if (isSellerAdmin && scope === 'seller') {
				const isAdminOnly = [
					'sellers',
					'user-management',
					'blogs',
					'plans',
					'support',
					'site-configuration',
					'settings/site-configuration'
				].some((adm) => clean === adm || clean.startsWith(adm + '/'));
				if (!isAdminOnly) {
					return true;
				}
			}

			// Technical document is accessible on admin side
			if (scope === 'admin' && (clean === 'technical-document' || clean === 'api-docs')) {
				return true;
			}

			return false;
		},
		[user, isSuperAdmin, isSellerAdmin, scope, permissions]
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
