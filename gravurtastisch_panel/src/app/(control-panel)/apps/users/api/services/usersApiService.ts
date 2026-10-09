import { usersUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { PaginationResponse } from '../../../orders/api/types';

export interface UserPlanLimits {
	maxMarketplaces?: number;
	maxReviewRequestsPerMonth?: number;
}

export type UserRoleRef = {
	_id?: string;
	id?: string;
	role_name?: string;
};

export interface User {
	_id?: string;
	id?: string;
	name: string;
	email: string;
	status: number;
	businessName?: string;
	contact_no?: string;
	planLimits?: UserPlanLimits;
	role_id?: string | UserRoleRef | null;
	userType?: string;
}

type ListParams = {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
};

const buildQueryUrl = (path: string, params: ListParams = {}) => {
	const queryParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			queryParams.append(key, value.toString());
		}
	});
	const queryString = queryParams.toString();
	return queryString ? `${path}?${queryString}` : path;
};

export const getAdminSellers = async (
	params: ListParams = {}
): Promise<PaginationResponse<User>> => {
	return fetchWithAuth(buildQueryUrl(`${usersUrl}/sellers`, params), {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

export const getAdminStaffUsers = async (
	params: ListParams = {}
): Promise<PaginationResponse<User>> => {
	return fetchWithAuth(buildQueryUrl(`${usersUrl}/admin-staff`, params), {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

export const getTeamUsers = async (
	params: ListParams = {}
): Promise<PaginationResponse<User>> => {
	return fetchWithAuth(buildQueryUrl(`${usersUrl}/team`, params), {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

export const createAdminUser = async (payload: {
	name: string;
	email: string;
	contact_no?: string;
	role_id: string;
}): Promise<{ status: number; message: string; data: User }> => {
	return fetchWithAuth(`${usersUrl}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
};

export const createTeamUser = async (payload: {
	name: string;
	email: string;
	contact_no?: string;
	role_id: string;
}): Promise<{ status: number; message: string; data: User }> => {
	return fetchWithAuth(`${usersUrl}/team`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
};

export const adminUpdateUser = async ({
	userId,
	payload
}: {
	userId: string;
	payload: {
		status?: number;
		name?: string;
		contact_no?: string;
		role_id?: string;
		planLimits?: UserPlanLimits;
		businessName?: string;
	};
}): Promise<{ status: number; message: string; data: User }> => {
	return fetchWithAuth(`${usersUrl}/admin-update/${userId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
};

/** @deprecated Legacy sellers table; prefer getAdminSellers. */
export const getAllUsers = getAdminSellers;
