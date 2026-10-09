import { useQuery } from '@tanstack/react-query';
import { settingsApiService } from '../../services/settingsApiService';

const profilePostsQueryKey = ['profile', 'user'];

const marketplaceQueryKey = ['marketplaces'];
export const generalSettingQueryKey = ['generalSetting'];

export const useMarketplace = () => {
	return useQuery({
		queryKey: marketplaceQueryKey,
		queryFn: settingsApiService.getMarketplace,
		select: (res) => res || [],
		staleTime: 1000 * 60 * 5 // cache for 5 minutes
	});
};

export const useGeneralSetting = () => {
	return useQuery({
		queryKey: generalSettingQueryKey,
		queryFn: settingsApiService.getGeneralSettings,
		select: (res) => res || [],
		staleTime: 1000 * 5 // cache for 5 minutes
	});
};
