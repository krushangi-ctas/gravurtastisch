import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApiService } from '../../services/settingsApiService';
import { securitySettingsQueryKey } from './useSecuritySettings';
import type { UpdatePasswordData } from '../../types';

export function useUpdateSecuritySettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: settingsApiService.updateSecuritySettings,
		onSuccess: (data) => {
			queryClient.setQueryData(securitySettingsQueryKey, data);
		}
	});
}

export const useUpdatePassword = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: UpdatePasswordData) => {
			return settingsApiService.updatePassword(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: securitySettingsQueryKey });
		},
		onError: (error: any) => {
			console.error('Failed to update password:', error);
			// The error will be available in the mutation result
		}
	});
};
