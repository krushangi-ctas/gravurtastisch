import { useQuery } from '@tanstack/react-query';
import { analyticsApiService } from '../../services/analyticsApiService';

const widgetsQueryKey = ['analyticsDashboardApp', 'widgets'];

export const useGetWidgets = () => {
	return useQuery({
		queryFn: analyticsApiService.getWidgets,
		queryKey: widgetsQueryKey
	});
};
