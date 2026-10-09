import { useQuery } from '@tanstack/react-query';
import { settingsApiService } from '../../services/settingsApiService';

const accountSettingsQueryKey = ['settings', 'account'] as const;
export const profilePostsQueryKey = ['profile', 'user'];

export const useProfile = () => {
	return useQuery({
		queryFn: settingsApiService.getUser,
		queryKey: profilePostsQueryKey
	});
};
