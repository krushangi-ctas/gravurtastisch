import { sectionsUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export type SectionPermissions = {
	add: boolean;
	delete: boolean;
	update: boolean;
	view: boolean;
};

export type SectionItem = {
	_id?: string;
	id?: string;
	name: string;
	title: string;
	scope: 'admin' | 'seller';
	ownerId?: string | null;
	permissions: SectionPermissions;
	status: number;
	createdAt?: string;
	updatedAt?: string;
};

export type ApiListResponse<T> = {
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

export const getSectionsList = async (
	params: {
		scope?: 'admin' | 'seller';
		page?: number;
		limit?: number;
		search?: string;
		status?: number | string;
		sortBy?: string;
	} = {}
) => {
	const queryParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			queryParams.append(key, String(value));
		}
	});
	const qs = queryParams.toString();
	return fetchWithAuth(`${sectionsUrl}${qs ? `?${qs}` : ''}`) as Promise<
		ApiListResponse<SectionItem[]>
	>;
};

export const getSectionById = async (sectionId: string) => {
	return fetchWithAuth(`${sectionsUrl}/${sectionId}`) as Promise<
		ApiListResponse<SectionItem>
	>;
};

export const createSection = async (payload: {
	name: string;
	title: string;
	scope?: 'admin' | 'seller';
	permissions?: Partial<SectionPermissions>;
	status?: number;
}) => {
	return fetchWithAuth(sectionsUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	}) as Promise<ApiListResponse<SectionItem>>;
};

export const updateSection = async (
	sectionId: string,
	payload: Partial<{
		name: string;
		title: string;
		permissions: Partial<SectionPermissions>;
		status: number;
	}>
) => {
	return fetchWithAuth(`${sectionsUrl}/${sectionId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	}) as Promise<ApiListResponse<SectionItem>>;
};

export const deleteSection = async (sectionId: string) => {
	return fetchWithAuth(`${sectionsUrl}/${sectionId}`, {
		method: 'DELETE'
	}) as Promise<ApiListResponse<Record<string, never>>>;
};

export const toggleSectionStatus = async (sectionId: string, status: number) => {
	return fetchWithAuth(`${sectionsUrl}/${sectionId}/status`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ status })
	}) as Promise<ApiListResponse<SectionItem>>;
};
