import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import SettingsAppNavigation from '../app/(control-panel)/apps/settings/lib/constants/SettingsAppNavigation';

/**
 * Navigation items. Visibility is filtered by scope + section permissions in NavigationContextProvider.
 * `authSection` maps to RBAC section keys.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'apps',
		title: 'Gravurtastisch',
		subtitle: 'Engraving, Custom Cups & Personalized Orders',
		type: 'group',
		icon: 'lucide:box',
		translate: 'APPLICATIONS',
		children: [
			{
				id: 'sellers',
				title: 'Sellers',
				type: 'item',
				icon: 'lucide:store',
				url: '/sellers',
				authSection: 'sellers'
			},
			{
				id: 'admin-users',
				title: 'Admin Users',
				type: 'item',
				icon: 'lucide:user-cog',
				url: '/admin-users',
				authSection: 'users'
			},
			{
				id: 'orders',
				title: 'Order',
				type: 'item',
				icon: 'lucide:clipboard-list',
				url: '/orders',
				authSection: 'orders'
			},
			{
				id: 'amazon-credentials',
				title: 'Amazon Authorisation',
				type: 'item',
				icon: 'lucide:lock',
				url: '/amazon-credentials',
				authSection: 'amazon-credentials'
			},
			{
				id: 'users',
				title: 'Team',
				type: 'item',
				icon: 'lucide:users',
				url: '/users',
				authSection: 'user'
			},
			{
				id: 'roles',
				title: 'Roles',
				type: 'item',
				icon: 'lucide:shield-check',
				url: '/roles',
				authSection: 'roles'
			},
			{
				id: 'support',
				title: 'Customer Support',
				type: 'item',
				icon: 'lucide:circle-help',
				url: '/support',
				authSection: 'support'
			},
			{
				id: 'blogs',
				title: 'Blog Management',
				type: 'item',
				icon: 'lucide:newspaper',
				url: '/blogs',
				authSection: 'blogs'
			},
			{
				id: 'site-configuration',
				title: 'Site Configuration',
				type: 'item',
				icon: 'lucide:globe',
				url: '/site-configuration',
				authSection: 'site-configuration'
			},
			{
				id: 'plans',
				title: 'Plans',
				type: 'item',
				icon: 'lucide:layers',
				url: '/plans',
				authSection: 'plans'
			},
			{
				...SettingsAppNavigation,
				type: 'item',
				authSection: 'settings'
			}
		]
	}
];

export default navigationConfig;
