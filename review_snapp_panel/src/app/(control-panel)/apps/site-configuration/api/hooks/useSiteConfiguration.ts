import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getWebsiteConfiguration,
	updateWebsiteConfiguration,
	WebsiteConfigResponse,
	CompanyConfig,
	ContactConfig
} from '../services/siteConfigurationApiService';

export const siteConfigQueryKey = ['website-configuration'];

/**
 * Hook to retrieve site configuration
 */
export const useWebsiteConfiguration = () => {
	return useQuery<WebsiteConfigResponse>({
		queryKey: siteConfigQueryKey,
		queryFn: getWebsiteConfiguration,
		refetchOnWindowFocus: true,
		staleTime: 5000
	});
};

/**
 * Hook to update site configuration
 */
export const useUpdateWebsiteConfiguration = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: { company?: Partial<CompanyConfig>; contact?: Partial<ContactConfig> }) =>
			updateWebsiteConfiguration(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: siteConfigQueryKey });
		}
	});
};
