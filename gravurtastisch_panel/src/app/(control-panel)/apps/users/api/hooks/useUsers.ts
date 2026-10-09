import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	adminUpdateUser,
	createAdminUser,
	createTeamUser,
	getAdminSellers,
	getAdminStaffUsers,
	getTeamUsers,
	User
} from '../services/usersApiService';
import { PaginationResponse } from '../../../orders/api/types';

const sellersQueryKey = ['users-sellers'];
const adminStaffQueryKey = ['users-admin-staff'];
const teamQueryKey = ['users-team'];

type ListParams = {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
};

export const useAdminSellers = (params: ListParams = {}, enabled = true) => {
	return useQuery<PaginationResponse<User>>({
		queryFn: () => getAdminSellers(params),
		queryKey: [...sellersQueryKey, params],
		enabled,
		refetchOnWindowFocus: true,
		staleTime: 1500
	});
};

export const useAdminStaffUsers = (params: ListParams = {}, enabled = true) => {
	return useQuery<PaginationResponse<User>>({
		queryFn: () => getAdminStaffUsers(params),
		queryKey: [...adminStaffQueryKey, params],
		enabled,
		refetchOnWindowFocus: true,
		staleTime: 1500
	});
};

export const useTeamUsers = (params: ListParams = {}, enabled = true) => {
	return useQuery<PaginationResponse<User>>({
		queryFn: () => getTeamUsers(params),
		queryKey: [...teamQueryKey, params],
		enabled,
		refetchOnWindowFocus: true,
		staleTime: 1500
	});
};

export const useAdminUpdateUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: adminUpdateUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sellersQueryKey });
			queryClient.invalidateQueries({ queryKey: adminStaffQueryKey });
			queryClient.invalidateQueries({ queryKey: teamQueryKey });
		}
	});
};

export const useCreateAdminUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createAdminUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminStaffQueryKey });
		}
	});
};

export const useCreateTeamUser = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTeamUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: teamQueryKey });
		}
	});
};

/** @deprecated Use useAdminSellers for RBAC sellers list. */
export const useAllUsers = useAdminSellers;
