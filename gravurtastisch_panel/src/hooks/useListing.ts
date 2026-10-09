import { useQuery } from '@tanstack/react-query';

export interface ListingParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any; // Allow additional filters
}

export interface ListingResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseListingOptions<T> {
  queryKey: string[];
  queryFn: (params: ListingParams) => Promise<ListingResponse<T>>;
  params?: ListingParams;
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

export const useListing = <T>({
  queryKey,
  queryFn,
  params = {},
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus = false,
}: UseListingOptions<T>) => {
  const defaultParams: ListingParams = {
    page: 0,
    limit: 10,
    search: '',
    sortBy: 'id',
    sortOrder: 'desc',
    ...params,
  };

  return useQuery<ListingResponse<T>>({
    queryKey: [...queryKey, defaultParams],
    queryFn: () => queryFn(defaultParams),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });
};

// Convenience hook for simple listings without pagination
export const useSimpleListing = <T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 5 * 60 * 1000,
  refetchOnWindowFocus = false,
}: {
  queryKey: string[];
  queryFn: () => Promise<T[]>;
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}) => {
  return useQuery<T[]>({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });
};
