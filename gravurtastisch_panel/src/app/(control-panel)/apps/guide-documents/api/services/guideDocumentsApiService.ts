import { guideDocumentsUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import {
	GuideModule,
	GuideStep,
	PublishedChildDetails,
	CreateModulePayload,
	UpdateModulePayload,
	CreateStepPayload,
	UpdateStepPayload,
	UploadScreenshotResponse
} from '../types';

/**
 * Fetch published modules tree (for viewer).
 * If isAdminSection is provided, filters for admin (true) or seller (false).
 */
export const getPublishedTree = async (
	isAdminSection?: boolean
): Promise<{ status: number; message: string; data: GuideModule[] }> => {
	const queryParams = new URLSearchParams();
	if (isAdminSection !== undefined && isAdminSection !== null) {
		queryParams.append('isAdminSection', isAdminSection.toString());
	}
	const queryString = queryParams.toString();
	const url = queryString ? `${guideDocumentsUrl}/published-tree?${queryString}` : `${guideDocumentsUrl}/published-tree`;

	return await fetchWithAuth(url, {
		method: 'GET'
	});
};

/**
 * Get published details for a single child module.
 */
export const getPublishedChildDetails = async (
	childModuleId: string
): Promise<{ status: number; message: string; data: PublishedChildDetails }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/published-tree/child/${childModuleId}`, {
		method: 'GET'
	});
};

/**
 * Fetch all modules tree for management view.
 */
export const getModulesTree = async (params: {
	search?: string;
	isAdminSection?: boolean;
} = {}): Promise<{ status: number; message: string; data: GuideModule[] }> => {
	const queryParams = new URLSearchParams();
	if (params.search) {
		queryParams.append('search', params.search);
	}
	if (params.isAdminSection !== undefined && params.isAdminSection !== null) {
		queryParams.append('isAdminSection', params.isAdminSection.toString());
	}
	const queryString = queryParams.toString();
	const url = queryString ? `${guideDocumentsUrl}/modules-tree?${queryString}` : `${guideDocumentsUrl}/modules-tree`;

	return await fetchWithAuth(url, {
		method: 'GET'
	});
};

/**
 * Get single module by ID (with children & steps).
 */
export const getModuleById = async (
	moduleId: string
): Promise<{
	status: number;
	message: string;
	data: { module: GuideModule; children: GuideModule[]; steps: GuideStep[] };
}> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/modules/${moduleId}`, {
		method: 'GET'
	});
};

/**
 * Create parent or child module.
 */
export const createModule = async (
	payload: CreateModulePayload
): Promise<{ status: number; message: string; data: GuideModule }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/modules`, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
};

/**
 * Update module.
 */
export const updateModule = async ({
	moduleId,
	payload
}: {
	moduleId: string;
	payload: UpdateModulePayload;
}): Promise<{ status: number; message: string; data: GuideModule }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/modules/${moduleId}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
};

/**
 * Soft delete module.
 */
export const deleteModule = async (
	moduleId: string
): Promise<{ status: number; message: string; data: GuideModule }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/modules/${moduleId}`, {
		method: 'DELETE'
	});
};

/**
 * Upload screenshot image.
 */
export const uploadScreenshot = async (file: File): Promise<UploadScreenshotResponse> => {
	const formData = new FormData();
	formData.append('screenshot', file);

	return await fetchWithAuth(`${guideDocumentsUrl}/upload-screenshot`, {
		method: 'POST',
		body: formData
	});
};

/**
 * Create step under child module.
 */
export const createStep = async ({
	moduleId,
	payload
}: {
	moduleId: string;
	payload: CreateStepPayload;
}): Promise<{ status: number; message: string; data: GuideStep }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/modules/${moduleId}/steps`, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
};

/**
 * Update step.
 */
export const updateStep = async ({
	stepId,
	payload
}: {
	stepId: string;
	payload: UpdateStepPayload;
}): Promise<{ status: number; message: string; data: GuideStep }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/steps/${stepId}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
};

/**
 * Delete step.
 */
export const deleteStep = async (
	stepId: string
): Promise<{ status: number; message: string; data: GuideStep }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/steps/${stepId}`, {
		method: 'DELETE'
	});
};

/**
 * Reorder steps within a child module.
 */
export const reorderSteps = async ({
	moduleId,
	steps
}: {
	moduleId: string;
	steps: { id: string; stepOrder: number }[];
}): Promise<{ status: number; message: string }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/modules/${moduleId}/steps/reorder`, {
		method: 'PUT',
		body: JSON.stringify({ steps })
	});
};

/**
 * Reorder parent and child modules.
 */
export const reorderModules = async (payload: {
	parents: { id: string; sortOrder: number }[];
	children: { id: string; parentId: string; sortOrder: number }[];
}): Promise<{ status: number; message: string }> => {
	return await fetchWithAuth(`${guideDocumentsUrl}/modules/reorder`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
};
