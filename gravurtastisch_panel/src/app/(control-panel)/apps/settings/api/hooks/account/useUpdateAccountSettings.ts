import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApiService } from '../../services/settingsApiService';
import { profilePostsQueryKey } from './useAccountSettings';
import type { UpdateUserData } from '../../types';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserData) => settingsApiService.updateUser(data),
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: profilePostsQueryKey });
      // Also invalidate any auth-related queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      console.error('Failed to update user:', error);
      // The error will be available in the mutation result
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => settingsApiService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profilePostsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      console.error('Failed to upload avatar:', error);
    },
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsApiService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profilePostsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete avatar:', error);
    },
  });
};
