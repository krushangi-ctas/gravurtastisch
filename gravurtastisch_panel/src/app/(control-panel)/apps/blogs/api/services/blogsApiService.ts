import { blogsUrl } from '@/configs/env';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { PaginationResponse } from '../../../orders/api/types';

export interface Blog {
	_id?: string;
	id?: string;
	blog_title: string;
	slug?: string;
	short_description?: string;
	description?: any;
	description_images?: string[];
	full_image_urls?: string[];
	status: number;
	created_by?: any;
	updated_by?: any;
	createdAt?: string;
	updatedAt?: string;
}

export interface UploadImageResponse {
	status: number;
	message: string;
	data: {
		relativePath: string;
		filename: string;
		url: string;
	};
}

/**
 * Fetch all blogs with optional search, status, and pagination
 */
export const getAllBlogs = async (
	params: {
		page?: number;
		limit?: number;
		search?: string;
		status?: number;
		sortBy?: string;
	} = {}
): Promise<PaginationResponse<Blog>> => {
	const queryParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			queryParams.append(key, value.toString());
		}
	});

	const queryString = queryParams.toString();
	const url = queryString ? `${blogsUrl}?${queryString}` : blogsUrl;

	return await fetchWithAuth(url, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

/**
 * Get a single blog by ID
 */
export const getBlogById = async (blogId: string): Promise<{ status: number; message: string; data: Blog }> => {
	return await fetchWithAuth(`${blogsUrl}/${blogId}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});
};

/**
 * Create a new blog
 */
export const createBlog = async (payload: {
	blog_title: string;
	slug?: string;
	short_description?: string;
	description?: any;
	description_images?: string[];
	status?: number;
}): Promise<{ status: number; message: string; data: Blog }> => {
	return await fetchWithAuth(blogsUrl, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
};

/**
 * Update existing blog
 */
export const updateBlog = async ({
	blogId,
	payload
}: {
	blogId: string;
	payload: {
		blog_title?: string;
		slug?: string;
		short_description?: string;
		description?: any;
		description_images?: string[];
		status?: number;
	};
}): Promise<{ status: number; message: string; data: Blog }> => {
	return await fetchWithAuth(`${blogsUrl}/${blogId}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	});
};

/**
 * Update blog status (1=active, 0=inactive, 2=deleted)
 */
export const updateBlogStatus = async ({
	blogId,
	status
}: {
	blogId: string;
	status: number;
}): Promise<{ status: number; message: string; data: Blog }> => {
	return await fetchWithAuth(`${blogsUrl}/${blogId}/status`, {
		method: 'PUT',
		body: JSON.stringify({ status })
	});
};

/**
 * Upload single blog image
 */
export const uploadBlogImage = async (file: File): Promise<UploadImageResponse> => {
	const formData = new FormData();
	formData.append('image', file);

	return await fetchWithAuth(`${blogsUrl}/upload-image`, {
		method: 'POST',
		body: formData
	});
};
