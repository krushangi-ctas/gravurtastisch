import { useQuery } from '@tanstack/react-query';
import { getMarketplace, getOrders } from './useOrder';
import { PaginationResponse, Order } from '../../types';

export const ordersQueryKey = ['ecommerce', 'orders'];

export const useOrders = ({
	page = 0,
	search = '',
	from = '',
	to = '',
	limit = 10,
	marketplaceId = [],
	sortBy = '',
	sortOrder = 'asc'
}) => {
	return useQuery<PaginationResponse<Order>>({
		queryFn: () => getOrders({ page, search, from, to, limit, marketplaceId, sortBy, sortOrder }),
		queryKey: [...ordersQueryKey, page, search, from, to, limit, marketplaceId, sortBy, sortOrder],
		refetchOnWindowFocus: true,
		staleTime: 1500 // Always fetch fresh data
	});
};

// Use react-query to fetch marketplaces
const marketplaceQueryKey = ['marketplaces'];

export const useMarketplace = () => {
	return useQuery({
		queryKey: marketplaceQueryKey,
		queryFn: getMarketplace,
		select: (res) => res || [],
		staleTime: 1500 // Cache for 1.5 seconds
	});
};
