import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersQueryKey } from './useOrders';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { sendFeedbackUrl } from '@/configs/env';
import { useSnackbar } from 'notistack';

export const useUpdateOrder = () => {
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	return useMutation({
		mutationFn: sendFeedback,
		onSuccess: (response: any) => {
			queryClient.invalidateQueries({ queryKey: ordersQueryKey, exact: false });

			// Since fetchWithAuth resolves HTTP errors rather than throwing, check the status here
			if (response?.status === 200 || response?.status === true) {
				enqueueSnackbar(response?.message || 'Review request scheduled successfully!', {
					variant: 'success',
					autoHideDuration: 3000,
				});
			} else {
				console.error('Feedback request schedule failed:', response);
				enqueueSnackbar(response?.message || 'Failed to schedule review request. Quota exceeded or marketplace is inactive.', {
					variant: 'error',
					autoHideDuration: 5000,
				});
			}
		},
		onError: (error: any) => {
			console.error('Failed to schedule review request:', error);
			enqueueSnackbar(error?.message || 'An unexpected error occurred while scheduling review request.', {
				variant: 'error',
				autoHideDuration: 5000,
			});
		}
	});
};

const sendFeedback = async (payload: Record<string, any>) => {
	return await fetchWithAuth(`${sendFeedbackUrl}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
};
