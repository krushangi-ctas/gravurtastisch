import { plansUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { PaginationResponse } from '../../../orders/api/types';

export interface Plan {
	_id?: string;
	id?: string;
	name: string;
	price: number;
	marketplace: number;
	request_quota: number;
	expireAt?: string | null;
	status: number;
	createdBy?: any;
	updatedBy?: any;
	createdAt?: string;
	updatedAt?: string;
}

export interface PlanFormPayload {
	name: string;
	price: number;
	marketplace: number;
	request_quota: number;
	expireAt?: string | null;
	status?: number;
}

/**
 * Fetch all plans with optional search, status, and pagination
 */
export const getAllPlans = async (
	params: {
		page?: number;
		limit?: number;
		search?: string;
		status?: number | string;
		sortBy?: string;
	} = {}
): Promise<PaginationResponse<Plan>> => {
	const queryParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			queryParams.append(key, value.toString());
		}
	});

	const queryString = queryParams.toString();
	const url = queryString ? `${plansUrl}?${queryString}` : plansUrl;

	return await fetchWithAuth(url, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

/**
 * Get a single plan by ID
 */
export const getPlanById = async (planId: string): Promise<{ status: number; message: string; data: Plan }> => {
	return await fetchWithAuth(`${plansUrl}/${planId}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

/**
 * Create a new plan
 */
export const createPlan = async (payload: PlanFormPayload): Promise<{ status: number; message: string; data: Plan }> => {
	return await fetchWithAuth(plansUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
};

/**
 * Update existing plan
 */
export const updatePlan = async ({
	planId,
	payload
}: {
	planId: string;
	payload: Partial<PlanFormPayload>;
}): Promise<{ status: number; message: string; data: Plan }> => {
	return await fetchWithAuth(`${plansUrl}/${planId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
};

/**
 * Update plan status (1=active, 0=inactive, 2=deleted)
 */
export const updatePlanStatus = async ({
	planId,
	status
}: {
	planId: string;
	status: number;
}): Promise<{ status: number; message: string; data: Plan }> => {
	return await fetchWithAuth(`${plansUrl}/${planId}/status`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status })
	});
};
