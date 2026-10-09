import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, UpsertPayload } from '../../types';
import { getAmazonCredentialsByUserId, upsertAmazonCredentials } from '../../services/amazonCredentialsApiService';

const amazonCredentialsQueryKey = ['amazon-credentials'];

// Interface for the expected API response format

/**
 * Hook to get Amazon credentials by ID
 */
export const useAmazonCredentialsById = () => {
	return useQuery<ApiResponse>({
		queryFn: () => getAmazonCredentialsByUserId(),
		queryKey: [...amazonCredentialsQueryKey],
		refetchOnWindowFocus: false,
		staleTime: 3000
	});
};

/**
 * Hook to upsert Amazon credentials
 */
export const useUpsertAmazonCredentials = () => {
	const queryClient = useQueryClient();

	return useMutation<ApiResponse, Error, UpsertPayload>({
		mutationFn: upsertAmazonCredentials,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: amazonCredentialsQueryKey, exact: false });
		}
	});
};
