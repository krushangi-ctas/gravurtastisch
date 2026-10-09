import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getAllPlans,
	getPlanById,
	createPlan,
	updatePlan,
	updatePlanStatus,
	Plan
} from '../services/plansApiService';
import { PaginationResponse } from '../../../orders/api/types';

const plansQueryKey = ['plans-list'];
const planDetailQueryKey = ['plan-detail'];

/**
 * Hook to retrieve plans list with search, status, and pagination
 */
export const useAllPlans = (
	params: {
		page?: number;
		limit?: number;
		search?: string;
		status?: number | string;
		sortBy?: string;
	} = {},
	enabled = true
) => {
	return useQuery<PaginationResponse<Plan>>({
		queryFn: () => getAllPlans(params),
		queryKey: [...plansQueryKey, params.page, params.limit, params.search, params.status, params.sortBy],
		enabled,
		refetchOnWindowFocus: true,
		staleTime: 1500
	});
};

/**
 * Hook to retrieve single plan details
 */
export const usePlanDetails = (planId?: string) => {
	return useQuery({
		queryFn: () => (planId ? getPlanById(planId) : Promise.reject('No planId')),
		queryKey: [...planDetailQueryKey, planId],
		enabled: Boolean(planId)
	});
};

/**
 * Hook to create a plan
 */
export const useCreatePlan = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createPlan,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: plansQueryKey });
		}
	});
};

/**
 * Hook to update a plan
 */
export const useUpdatePlan = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePlan,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: plansQueryKey });
			queryClient.invalidateQueries({ queryKey: planDetailQueryKey });
		}
	});
};

/**
 * Hook to update a plan's status (active/inactive/deleted)
 */
export const useUpdatePlanStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePlanStatus,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: plansQueryKey });
		}
	});
};
