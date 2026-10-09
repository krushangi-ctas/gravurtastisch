import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllSupportRequests, updateSupportRequestStatus, SupportRequest } from '../services/supportApiService';
import { PaginationResponse } from '../../../orders/api/types';

const supportQueryKey = ['support-list'];

/**
 * Hook to retrieve support requests with search & pagination
 */
export const useAllSupportRequests = (
	params: {
		page?: number;
		limit?: number;
		search?: string;
		status?: string;
		sortBy?: string;
	} = {},
	enabled = true
) => {
	return useQuery<PaginationResponse<SupportRequest>>({
		queryFn: () => getAllSupportRequests(params),
		queryKey: [...supportQueryKey, params.page, params.limit, params.search, params.status, params.sortBy],
		enabled,
		refetchOnWindowFocus: true,
		staleTime: 1500
	});
};

/**
 * Hook to update support request status
 */
export const useUpdateSupportStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateSupportRequestStatus,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: supportQueryKey });
		}
	});
};
