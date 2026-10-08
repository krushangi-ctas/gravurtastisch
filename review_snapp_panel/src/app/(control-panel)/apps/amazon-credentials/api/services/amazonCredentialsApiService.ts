import { amazonCredentialsUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { ApiResponse, UpsertPayload } from '../types';

/**
 * Upsert Amazon credentials
 */
export const upsertAmazonCredentials = async (payload: UpsertPayload): Promise<ApiResponse> => {
	return await fetchWithAuth(`${amazonCredentialsUrl}/upsert`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
};

/**
 * Fetch Amazon credentials by ID
 */
export const getAmazonCredentialsByUserId = async (): Promise<ApiResponse> => {
	const response = await fetchWithAuth(`${amazonCredentialsUrl}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
	return response;
};
