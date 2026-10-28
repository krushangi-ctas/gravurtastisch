import { useQuery } from '@tanstack/react-query';
import {
	getSystemLogOperationList,
	getSystemLogs
} from '../services/systemLogApiService';
import { SystemLogQueryParams } from '../types';

export const systemLogsKey = ['system-logs-list'];
export const systemLogOperationsKey = ['system-logs-operations'];

export const useSystemLogs = (
	params: SystemLogQueryParams = {},
	enabled = true
) =>
	useQuery({
		queryKey: [...systemLogsKey, params],
		queryFn: () => getSystemLogs(params),
		staleTime: 10_000,
		enabled
	});

export const useSystemLogOperations = () =>
	useQuery({
		queryKey: systemLogOperationsKey,
		queryFn: getSystemLogOperationList,
		staleTime: 5 * 60_000
	});
