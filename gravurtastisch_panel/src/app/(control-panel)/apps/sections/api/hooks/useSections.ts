import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createSection,
	deleteSection,
	getSectionsList,
	toggleSectionStatus,
	updateSection
} from '../services/sectionsApiService';

export const sectionsListKey = ['sections-list'];
const rolesSectionsKey = ['roles-sections'];

export const useSectionsList = (
	params: {
		scope?: 'admin' | 'seller';
		page?: number;
		limit?: number;
		search?: string;
		status?: number | string;
		sortBy?: string;
	} = {},
	enabled = true
) =>
	useQuery({
		queryKey: [...sectionsListKey, params],
		queryFn: () => getSectionsList(params),
		staleTime: 1500,
		enabled
	});

export const useCreateSection = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createSection,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sectionsListKey });
			queryClient.invalidateQueries({ queryKey: rolesSectionsKey });
		}
	});
};

export const useUpdateSection = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			sectionId,
			payload
		}: {
			sectionId: string;
			payload: Parameters<typeof updateSection>[1];
		}) => updateSection(sectionId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sectionsListKey });
			queryClient.invalidateQueries({ queryKey: rolesSectionsKey });
		}
	});
};

export const useDeleteSection = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteSection,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sectionsListKey });
			queryClient.invalidateQueries({ queryKey: rolesSectionsKey });
		}
	});
};

export const useToggleSectionStatus = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ sectionId, status }: { sectionId: string; status: number }) =>
			toggleSectionStatus(sectionId, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sectionsListKey });
			queryClient.invalidateQueries({ queryKey: rolesSectionsKey });
		}
	});
};
