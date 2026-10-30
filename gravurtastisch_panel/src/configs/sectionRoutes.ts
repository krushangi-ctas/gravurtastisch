import type { PermissionAction } from '@/hooks/usePermissions';

/** Admin nav / redirect order (first match wins). */
export const ADMIN_SECTION_KEYS = [
	'users',
	'roles',
	'sections',
	'sellers',
	'support',
	'blogs',
	'site-configuration',
	'plans',
	'settings',
	'system-logs',
	'technical-document'
] as const;

/** Seller nav / redirect order. */
export const SELLER_SECTION_KEYS = [
	'user',
	'roles',
	'sections',
	'orders',
	'amazon-credentials',
	'settings',
	'system-logs'
] as const;

/** RBAC section key → panel route path. */
export const SECTION_ROUTES: Record<string, string> = {
	sellers: '/sellers',
	users: '/user-management/users',
	user: '/team/members',
	roles: '/team/roles',
	sections: '/team/sections',
	support: '/support',
	blogs: '/blogs',
	'site-configuration': '/settings/site-configuration',
	plans: '/plans',
	settings: '/settings/account',
	'system-logs': '/system-logs',
	'technical-document': '/technical-document',
	orders: '/orders',
	'amazon-credentials': '/amazon-credentials'
};

export const ADMIN_NAV_IDS = [
	'user-management',
	'sellers',
	'support',
	'blogs',
	'plans',
	'settings',
	'system-logs',
	'technical-document'
] as const;

export const SELLER_NAV_IDS = [
	'team-management',
	'orders',
	'amazon-credentials',
	'system-logs',
	'settings'
] as const;

export type PanelScope = 'admin' | 'seller';

export function getSectionKeysForScope(scope: PanelScope): readonly string[] {
	return scope === 'seller' ? SELLER_SECTION_KEYS : ADMIN_SECTION_KEYS;
}

export function getSectionRoute(section: string, scope: PanelScope): string {
	if (section === 'roles') {
		return scope === 'seller' ? '/team/roles' : '/user-management/roles';
	}
	if (section === 'sections') {
		return scope === 'seller' ? '/team/sections' : '/user-management/sections';
	}
	if (section === 'user') {
		return '/team/members';
	}
	if (section === 'users') {
		return '/user-management/users';
	}
	return SECTION_ROUTES[section] || '/401';
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
			return getSectionRoute(key, scope);
		}
	}
	return '/401';
}
