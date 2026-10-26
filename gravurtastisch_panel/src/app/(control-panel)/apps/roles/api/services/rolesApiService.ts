import { rolesUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { SectionPermission } from '@/hooks/usePermissions';

export type RolePermission = SectionPermission & {
	section: string;
};

export type RoleSectionItem = {
	id?: string;
	name: string;
	title: string;
	status: number;
	permissions: {
		add?: boolean;
		delete?: boolean;
		update?: boolean;
		view?: boolean;
	};
	isAccessable?: boolean;
};

export type Role = {
	_id?: string;
	id?: string;
	name?: string;
	role_name: string;
	description?: string;
	scope: 'admin' | 'seller';
	section_list?: RoleSectionItem[];
	permissions: RolePermission[];
	status: number;
	isSystem?: boolean;
	ownerId?: string | null;
	createdAt?: string;
};

export type SectionDefinition = {
	id?: string;
	key: string;
	name?: string;
	title: string;
	status?: number;
	isCustom?: boolean;
	permissions?: {
		add?: boolean;
		delete?: boolean;
		update?: boolean;
		view?: boolean;
	};
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
	role_name?: string;
	name?: string;
	description?: string;
	scope?: 'admin' | 'seller';
	permissions?: RolePermission[];
	section_list?: RoleSectionItem[];
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
		name: string;
		description: string;
		permissions: RolePermission[];
		section_list: RoleSectionItem[];
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
