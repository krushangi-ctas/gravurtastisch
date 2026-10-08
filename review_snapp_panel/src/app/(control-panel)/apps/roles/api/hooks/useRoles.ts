import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createRole,
	deleteRole,
	getRoles,
	getSections,
	updateRole
} from '../services/rolesApiService';

const rolesKey = ['roles-list'];
const sectionsKey = ['roles-sections'];

export const useSections = (scope?: 'admin' | 'seller', enabled = true) =>
	useQuery({
		queryKey: [...sectionsKey, scope],
		queryFn: () => getSections(scope),
		staleTime: 60_000,
		enabled
	});

export const useRoles = (
	params: {
		scope?: 'admin' | 'seller';
		page?: number;
		limit?: number;
		search?: string;
	} = {},
	enabled = true
) =>
	useQuery({
		queryKey: [...rolesKey, params],
		queryFn: () => getRoles(params),
		staleTime: 1500,
		enabled
	});

export const useCreateRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createRole,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKey })
	});
};

export const useUpdateRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ roleId, payload }: { roleId: string; payload: Parameters<typeof updateRole>[1] }) =>
			updateRole(roleId, payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKey })
	});
};

export const useDeleteRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteRole,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKey })
	});
};
