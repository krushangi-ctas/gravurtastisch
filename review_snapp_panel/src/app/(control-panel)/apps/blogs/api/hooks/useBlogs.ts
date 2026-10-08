import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getAllBlogs,
	getBlogById,
	createBlog,
	updateBlog,
	updateBlogStatus,
	uploadBlogImage,
	Blog
} from '../services/blogsApiService';
import { PaginationResponse } from '../../../orders/api/types';

const blogsQueryKey = ['blogs-list'];
const blogDetailQueryKey = ['blog-detail'];

/**
 * Hook to retrieve blogs list with search, status, and pagination
 */
export const useAllBlogs = (
	params: {
		page?: number;
		limit?: number;
		search?: string;
		status?: number;
		sortBy?: string;
	} = {},
	enabled = true
) => {
	return useQuery<PaginationResponse<Blog>>({
		queryFn: () => getAllBlogs(params),
		queryKey: [...blogsQueryKey, params.page, params.limit, params.search, params.status, params.sortBy],
		enabled,
		refetchOnWindowFocus: true,
		staleTime: 1500
	});
};

/**
 * Hook to retrieve single blog details
 */
const useBlogDetails = (blogId?: string) => {
	return useQuery({
		queryFn: () => (blogId ? getBlogById(blogId) : Promise.reject('No blogId')),
		queryKey: [...blogDetailQueryKey, blogId],
		enabled: Boolean(blogId)
	});
};

/**
 * Hook to create a blog
 */
export const useCreateBlog = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createBlog,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: blogsQueryKey });
		}
	});
};

/**
 * Hook to update a blog
 */
export const useUpdateBlog = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateBlog,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: blogsQueryKey });
			queryClient.invalidateQueries({ queryKey: blogDetailQueryKey });
		}
	});
};

/**
 * Hook to update a blog's status (active/inactive/deleted)
 */
export const useUpdateBlogStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateBlogStatus,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: blogsQueryKey });
		}
	});
};

/**
 * Hook to upload a single blog image
 */
export const useUploadBlogImage = () => {
	return useMutation({
		mutationFn: uploadBlogImage
	});
};
