import { rolesUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { SectionPermission } from '@/hooks/usePermissions';

export type RolePermission = SectionPermission & {
	section: string;
};

export type Role = {
	_id?: string;
	id?: string;
	role_name: string;
	description?: string;
	scope: 'admin' | 'seller';
	permissions: RolePermission[];
	status: number;
	isSystem?: boolean;
	ownerId?: string | null;
};

export type SectionDefinition = {
	key: string;
	title: string;
};

type ApiListResponse<T> = {
	status: number;
	message: string;
	data: T;
	pagination?: {
		page: number;
		limit: number;
		lastPage: number;
		totalResults: number;
		length: number;
	};
};

export const getSections = async (scope?: 'admin' | 'seller') => {
	const query = scope ? `?scope=${scope}` : '';
	return fetchWithAuth(`${rolesUrl}/sections${query}`) as Promise<ApiListResponse<SectionDefinition[]>>;
};

export const getRoles = async (params: {
	scope?: 'admin' | 'seller';
	page?: number;
	limit?: number;
	search?: string;
} = {}) => {
	const queryParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			queryParams.append(key, String(value));
		}
	});
	const qs = queryParams.toString();
	return fetchWithAuth(`${rolesUrl}${qs ? `?${qs}` : ''}`) as Promise<ApiListResponse<Role[]>>;
};

export const createRole = async (payload: {
	role_name: string;
	description?: string;
	scope?: 'admin' | 'seller';
	permissions: RolePermission[];
}) => {
	return fetchWithAuth(rolesUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	}) as Promise<ApiListResponse<Role>>;
};

export const updateRole = async (
	roleId: string,
	payload: Partial<{
		role_name: string;
		description: string;
		permissions: RolePermission[];
		status: number;
	}>
) => {
	return fetchWithAuth(`${rolesUrl}/${roleId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	}) as Promise<ApiListResponse<Role>>;
};

export const deleteRole = async (roleId: string) => {
	return fetchWithAuth(`${rolesUrl}/${roleId}`, {
		method: 'DELETE'
	}) as Promise<ApiListResponse<Record<string, never>>>;
};
