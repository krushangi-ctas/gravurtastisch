import { ReactNode, useCallback, useEffect, useState } from 'react';
import { FuseFlatNavItemType, FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import FuseNavigationHelper from '@fuse/utils/FuseNavigationHelper';
import navigationConfig from '@/configs/navigationConfig';
import { ADMIN_NAV_IDS, SELLER_NAV_IDS } from '@/configs/sectionRoutes';
import FuseNavItemModel from '@fuse/core/FuseNavigation/models/FuseNavItemModel';
import { PartialDeep } from 'type-fest';
import { NavigationContext } from '@/components/theme-layouts/components/navigation/contexts/NavigationContext';
import usePermissions from '@/hooks/usePermissions';

type NavItemWithSection = FuseNavItemType & { authSection?: string };

export function NavigationContextProvider({ children }: { children: ReactNode }) {
	const { canView, user, scope } = usePermissions();

	const filterNavigation = useCallback(
		(items: FuseNavItemType[]): FuseNavItemType[] => {
			if (!user) {
				return items;
			}

			const isAdminUser = scope === 'admin';
			const allowedNavIds = isAdminUser ? ADMIN_NAV_IDS : SELLER_NAV_IDS;

			return items.map((item) => {
				if (!item.children) {
					return item;
				}

				return {
					...item,
					children: item.children.filter((child) => {
						const navId = child.id || '';
						if (!(allowedNavIds as readonly string[]).includes(navId)) {
							return false;
						}

						const sectionKey =
							(child as NavItemWithSection).authSection || child.id || '';

						return canView(sectionKey);
					})
				};
			});
		},
		[user, canView, scope]
	);

	const [navigationItems, setNavigationItems] = useState<FuseFlatNavItemType[]>(
		FuseNavigationHelper.flattenNavigation(filterNavigation(navigationConfig))
	);

	useEffect(() => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(filterNavigation(navigationConfig)));
	}, [filterNavigation]);

	const setNavigation = useCallback((items: FuseNavItemType[]) => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(items));
	}, []);

	const appendNavigationItem = useCallback(
		(item: FuseNavItemType, parentId?: string | null) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.appendNavItem(navigation, FuseNavItemModel(item), parentId));
		},
		[navigationItems, setNavigation]
	);

	const prependNavigationItem = useCallback(
		(item: FuseNavItemType, parentId?: string | null) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.prependNavItem(navigation, FuseNavItemModel(item), parentId));
		},
		[navigationItems, setNavigation]
	);

	const updateNavigationItem = useCallback(
		(id: string, item: PartialDeep<FuseNavItemType>) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.updateNavItem(navigation, id, item));
		},
		[navigationItems, setNavigation]
	);

	const removeNavigationItem = useCallback(
		(id: string) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.removeNavItem(navigation, id));
		},
		[navigationItems, setNavigation]
	);

	const resetNavigation = useCallback(() => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(navigationConfig));
	}, []);

	const getNavigationItemById = useCallback(
		(id: string) => navigationItems.find((item) => item.id === id),
		[navigationItems]
	);

	const value = {
		setNavigation,
		navigationItems,
		appendNavigationItem,
		prependNavigationItem,
		updateNavigationItem,
		removeNavigationItem,
		resetNavigation,
		getNavigationItemById
	};

	return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
