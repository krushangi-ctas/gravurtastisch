import { supportUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { PaginationResponse } from '../../../orders/api/types';

export interface SupportRequest {
	id: string;
	_id?: string;
	name: string;
	email: string;
	message: string;
	status: 'pending' | 'resolved';
	createdAt: string;
	updatedAt: string;
}

/**
 * Fetch all support requests
 */
export const getAllSupportRequests = async (
	params: {
		page?: number;
		limit?: number;
		search?: string;
		status?: string;
		sortBy?: string;
	} = {}
): Promise<PaginationResponse<SupportRequest>> => {
	const queryParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			queryParams.append(key, value.toString());
		}
	});

	const queryString = queryParams.toString();
	const url = queryString ? `${supportUrl}?${queryString}` : supportUrl;

	return await fetchWithAuth(url, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

/**
 * Update support request status
 */
export const updateSupportRequestStatus = async ({
	requestId,
	status
}: {
	requestId: string;
	status: 'pending' | 'resolved';
}): Promise<{ status: number; message: string; data: SupportRequest }> => {
	return await fetchWithAuth(`${supportUrl}/${requestId}/status`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status })
	});
};
