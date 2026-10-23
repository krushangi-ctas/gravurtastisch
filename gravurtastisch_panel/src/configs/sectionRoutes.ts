import type { PermissionAction } from '@/hooks/usePermissions';

/** Admin nav / redirect order (first match wins). */
export const ADMIN_SECTION_KEYS = [
	'sellers',
	'users',
	'roles',
	'support',
	'blogs',
	'site-configuration',
	'plans',
	'settings'
] as const;

/** Seller nav / redirect order. */
export const SELLER_SECTION_KEYS = [
	'orders',
	'amazon-credentials',
	'user',
	'roles',
	'settings'
] as const;

/** RBAC section key → panel route path. */
export const SECTION_ROUTES: Record<string, string> = {
	sellers: '/sellers',
	users: '/admin-users',
	user: '/users',
	roles: '/roles',
	support: '/support',
	blogs: '/blogs',
	'site-configuration': '/site-configuration',
	plans: '/plans',
	settings: '/settings/account',
	orders: '/orders',
	'amazon-credentials': '/amazon-credentials'
};

export const ADMIN_NAV_IDS = [
	'sellers',
	'admin-users',
	'roles',
	'support',
	'blogs',
	'site-configuration',
	'plans',
	'settings'
] as const;

export const SELLER_NAV_IDS = [
	'orders',
	'amazon-credentials',
	'users',
	'roles',
	'settings'
] as const;

export type PanelScope = 'admin' | 'seller';

export function getSectionKeysForScope(scope: PanelScope): readonly string[] {
	return scope === 'seller' ? SELLER_SECTION_KEYS : ADMIN_SECTION_KEYS;
}

/**
 * First route the user may open after login or when visiting `/`.
 */
export function getFirstAccessibleRoute(
	scope: PanelScope,
	can: (section: string, action?: PermissionAction) => boolean
): string {
	const order = getSectionKeysForScope(scope);
	for (const key of order) {
		if (can(key, 'view')) {
			return SECTION_ROUTES[key] || '/401';
		}
	}
	return '/401';
}
