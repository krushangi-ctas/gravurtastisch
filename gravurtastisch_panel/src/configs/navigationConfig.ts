import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import SettingsAppNavigation from '../app/(control-panel)/apps/settings/lib/constants/SettingsAppNavigation';

/**
 * Navigation items. Visibility is filtered by scope + section permissions in NavigationContextProvider.
 * `authSection` maps to RBAC section keys.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'apps',
		title: '',
		subtitle: '',
		type: 'group',
		icon: 'lucide:box',
		translate: 'APPLICATIONS',
		children: [
			{
				id: 'user-management',
				title: 'User Management',
				type: 'item',
				icon: 'lucide:user-cog',
				url: '/user-management/users',
				authSection: '/user-management'
			},
			{
				id: 'team-management',
				title: 'Team Management',
				type: 'item',
				icon: 'lucide:users',
				url: '/team/members',
				authSection: '/team'
			},
			{
				id: 'sellers',
				title: 'Sellers',
				type: 'item',
				icon: 'lucide:store',
				url: '/sellers',
				authSection: 'sellers'
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
