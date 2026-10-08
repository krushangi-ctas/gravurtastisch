import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { marketPlaceUrl, orderListUrl } from '@/configs/env';
import { Order, PaginationResponse } from '../../types';

const orderQueryKey = (orderId: string) => [
  'ecommerce',
  'order',
  orderId,
];

export const useOrder = (orderId: string) => {
  return useQuery<Order>({
    queryKey: orderQueryKey(orderId),
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
};

const getOrder = async (orderId: string): Promise<Order> => {
  return await fetchWithAuth(`${orderListUrl}${orderId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getMarketplace = async (): Promise<any> => {
  const res = await fetchWithAuth(`${marketPlaceUrl}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return await res.data;
};
export interface OrderSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
  marketplaceId?: string[];
  fulfillmentChannel?: string;
  sortBy?: string;
  sortOrder?: string;
}

const useSearchOrders = (searchParams: OrderSearchParams) => {
  return useQuery<PaginationResponse<Order>>({
    queryKey: ['orders', searchParams],
    queryFn: () => getOrders(searchParams),
  });
};

export const getOrders = async (
  searchParams: OrderSearchParams
): Promise<PaginationResponse<Order>> => {
  const queryParams = new URLSearchParams();

  // Add all search parameters to the query
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v.toString()));
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });

  const queryString = queryParams.toString();

  const url = queryString ? `${orderListUrl}?${queryString}` : orderListUrl;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  // If the API already returns the pagination structure, return it as is
  if (response.data && response.pagination) {
    return response;
  }

  // If the API returns just an array, wrap it in a pagination structure
  // This is a fallback for APIs that don't return pagination info
  return {
    data: Array.isArray(response) ? response : [],
    pagination: {
      currentPage: searchParams.page || 0,
      totalPages: 1,
      totalItems: Array.isArray(response) ? response.length : 0,
      itemsPerPage: 100,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};
