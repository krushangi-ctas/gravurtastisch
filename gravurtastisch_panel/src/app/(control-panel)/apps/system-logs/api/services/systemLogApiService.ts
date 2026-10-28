import { systemLogUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import {
	OperationListResponse,
	SystemLogQueryParams,
	SystemLogResponse
} from '../types';

export const getSystemLogs = async (
	params: SystemLogQueryParams = {}
): Promise<SystemLogResponse> => {
	const queryParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			queryParams.append(key, String(value));
		}
	});

	const queryString = queryParams.toString();
	const endpoint = `${systemLogUrl}/get-system-log${queryString ? `?${queryString}` : ''}`;

	return await fetchWithAuth(endpoint, {
		method: 'GET'
	});
};

export const getSystemLogOperationList = async (): Promise<OperationListResponse> => {
	const endpoint = `${systemLogUrl}/get-all-operation-list`;
	return await fetchWithAuth(endpoint, {
		method: 'GET'
	});
};
