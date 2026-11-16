import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getPublishedTree,
	getPublishedChildDetails,
	getModulesTree,
	getModuleById,
	createModule,
	updateModule,
	deleteModule,
	uploadScreenshot,
	createStep,
	updateStep,
	deleteStep,
	reorderSteps,
	reorderModules
} from '../services/guideDocumentsApiService';

export const publishedTreeQueryKey = ['guide-documents-published-tree'];
export const publishedChildQueryKey = ['guide-documents-published-child'];
export const modulesTreeQueryKey = ['guide-documents-modules-tree'];
export const moduleDetailQueryKey = ['guide-documents-module-detail'];

export const usePublishedTree = (isAdminSection?: boolean, enabled = true) => {
	return useQuery({
		queryKey: [...publishedTreeQueryKey, isAdminSection],
		queryFn: () => getPublishedTree(isAdminSection),
		enabled,
		staleTime: 5000
	});
};

export const usePublishedChildDetails = (childModuleId?: string, enabled = true) => {
	return useQuery({
		queryKey: [...publishedChildQueryKey, childModuleId],
		queryFn: () => (childModuleId ? getPublishedChildDetails(childModuleId) : Promise.reject('No childModuleId')),
		enabled: Boolean(childModuleId) && enabled,
		staleTime: 5000
	});
};

export const useModulesTree = (params: { search?: string; isAdminSection?: boolean } = {}, enabled = true) => {
	return useQuery({
		queryKey: [...modulesTreeQueryKey, params.search, params.isAdminSection],
		queryFn: () => getModulesTree(params),
		enabled,
		staleTime: 2000
	});
};

export const useModuleDetails = (moduleId?: string, enabled = true) => {
	return useQuery({
		queryKey: [...moduleDetailQueryKey, moduleId],
		queryFn: () => (moduleId ? getModuleById(moduleId) : Promise.reject('No moduleId')),
		enabled: Boolean(moduleId) && enabled,
		staleTime: 2000
	});
};

export const useCreateModule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createModule,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: modulesTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedTreeQueryKey });
		}
	});
};

export const useUpdateModule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateModule,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: modulesTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: [...moduleDetailQueryKey, variables.moduleId] });
			queryClient.invalidateQueries({ queryKey: publishedChildQueryKey });
		}
	});
};

export const useDeleteModule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteModule,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: modulesTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedTreeQueryKey });
		}
	});
};

export const useUploadScreenshot = () => {
	return useMutation({
		mutationFn: uploadScreenshot
	});
};

export const useCreateStep = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createStep,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: moduleDetailQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedChildQueryKey });
			queryClient.invalidateQueries({ queryKey: modulesTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedTreeQueryKey });
		}
	});
};

export const useUpdateStep = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateStep,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: moduleDetailQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedChildQueryKey });
			queryClient.invalidateQueries({ queryKey: modulesTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedTreeQueryKey });
		}
	});
};

export const useDeleteStep = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteStep,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: moduleDetailQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedChildQueryKey });
			queryClient.invalidateQueries({ queryKey: modulesTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedTreeQueryKey });
		}
	});
};

export const useReorderSteps = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: reorderSteps,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: moduleDetailQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedChildQueryKey });
			queryClient.invalidateQueries({ queryKey: modulesTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedTreeQueryKey });
		}
	});
};

export const useReorderModules = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: reorderModules,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: modulesTreeQueryKey });
			queryClient.invalidateQueries({ queryKey: publishedTreeQueryKey });
		}
	});
};
