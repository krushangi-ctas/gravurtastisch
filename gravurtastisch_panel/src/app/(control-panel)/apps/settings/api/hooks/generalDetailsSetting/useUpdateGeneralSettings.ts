import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApiService } from '../../services/settingsApiService';
import { generalSettingQueryKey } from './useGeneralSettings';

export const useGeneralSettingMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ data }: { data: any }) => settingsApiService.updateGeneralSettings(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: generalSettingQueryKey });
		},
		onError: (error) => {
			console.error('Failed to update general setting:', error);
		}
	});
};
