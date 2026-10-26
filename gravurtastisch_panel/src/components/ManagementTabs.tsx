'use client';

import { useLocation, useNavigate } from 'react-router';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import usePermissions from '@/hooks/usePermissions';

export interface ManagementTabsProps {
	activeTab: 'members' | 'users' | 'roles' | 'sections';
}

export default function ManagementTabs({ activeTab }: ManagementTabsProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const { canView, scope } = usePermissions();

	const isSeller = scope === 'seller' || location.pathname.startsWith('/team');

	const tabs = isSeller
		? [
				{
					id: 'members',
					label: 'Team',
					icon: 'lucide:users',
					path: '/team/members',
					allowed: canView('/team/members')
				},
				{
					id: 'sections',
					label: 'Section',
					icon: 'lucide:layout-grid',
					path: '/team/sections',
					allowed: canView('/team/sections')
				},
				{
					id: 'roles',
					label: 'Role',
					icon: 'lucide:shield-check',
					path: '/team/roles',
					allowed: canView('/team/roles')
				}
		  ]
		: [
				{
					id: 'users',
					label: 'Users',
					icon: 'lucide:user-cog',
					path: '/user-management/users',
					allowed: canView('/user-management/users')
				},
				{
					id: 'sections',
					label: 'Section',
					icon: 'lucide:layout-grid',
					path: '/user-management/sections',
					allowed: canView('/user-management/sections')
				},
				{
					id: 'roles',
					label: 'Role',
					icon: 'lucide:shield-check',
					path: '/user-management/roles',
					allowed: canView('/user-management/roles')
				}
		  ];

	const visibleTabs = tabs.filter((t) => t.allowed);

	if (visibleTabs.length <= 1) {
		return null;
	}

	return (
		<div className="flex items-center gap-2">
			{visibleTabs.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => navigate(tab.path)}
						className={`h-7.5 sm:h-8 px-3.5 sm:px-4 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border-0 select-none ${
							isActive
								? 'bg-white text-primary font-bold shadow-xs'
								: 'bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-gray-700 font-medium'
						}`}
					>
						<FuseSvgIcon
							size={16}
							className={isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}
						>
							{tab.icon}
						</FuseSvgIcon>
						<span>{tab.label}</span>
					</button>
				);
			})}
		</div>
	);
}
