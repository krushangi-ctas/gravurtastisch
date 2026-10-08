import { useMemo } from 'react';
import useUser from '@auth/useUser';
import FuseUtils from '@fuse/utils';
import FuseNavigationHelper from '@fuse/utils/FuseNavigationHelper';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import { useNavigationContext } from '../contexts/useNavigationContext';

function useNavigationItems() {
	const { navigationItems: navigationData } = useNavigationContext();

	const { data: user } = useUser();
	const userRole = user?.role;

	const data = useMemo(() => {
		const _navigation = FuseNavigationHelper.unflattenNavigation(navigationData);

		function setAdditionalData(data: FuseNavItemType[]): FuseNavItemType[] {
			return data?.map((item) => ({
				hasPermission: Boolean(FuseUtils.hasPermission(item?.auth, userRole)),
				...item,
				...(item?.translate && {}),
				...(item?.children ? { children: setAdditionalData(item?.children) } : {})
			}));
		}

		const translatedValues = setAdditionalData(_navigation);

		return translatedValues;
	}, [navigationData, userRole]);

	const flattenData = useMemo(() => {
		return FuseNavigationHelper.flattenNavigation(data);
	}, [data]);

	return { data, flattenData };
}

export default useNavigationItems;
