import { useState, useEffect } from 'react';
import moment from 'moment';
import {
	Dialog,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Typography,
	CircularProgress,
	InputAdornment
} from '@mui/material';
import CustomStatusSwitch from '@/components/CustomSwitch';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useCreatePlan, useUpdatePlan } from '../../api/hooks/usePlans';
import { Plan } from '../../api/services/plansApiService';

interface PlanFormDialogProps {
	open: boolean;
	onClose: () => void;
	plan?: Plan | null;
}

export default function PlanFormDialog({ open, onClose, plan }: PlanFormDialogProps) {
	const { enqueueSnackbar } = useSnackbar();
	const createMutation = useCreatePlan();
	const updateMutation = useUpdatePlan();

	const isEdit = Boolean(plan);

	const [name, setName] = useState('');
	const [price, setPrice] = useState<string | number>('');
	const [marketplace, setMarketplace] = useState<string | number>('');
	const [requestQuota, setRequestQuota] = useState<string | number>('');
	const [expireAt, setExpireAt] = useState('');
	const [status, setStatus] = useState<number>(1);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Populate form state when editing or resetting
	useEffect(() => {
		if (open) {
			if (plan) {
				setName(plan.name || '');
				setPrice(plan.price !== undefined ? plan.price : '');
				setMarketplace(plan.marketplace !== undefined ? plan.marketplace : '');
				setRequestQuota(plan.request_quota !== undefined ? plan.request_quota : '');
				setExpireAt(plan.expireAt && moment(plan.expireAt).isValid() ? moment(plan.expireAt).format('YYYY-MM-DD') : '');
				setStatus(plan.status !== undefined ? plan.status : 1);
			} else {
				setName('');
				setPrice('');
				setMarketplace('');
				setRequestQuota('');
				setExpireAt('');
				setStatus(1);
			}
		}
	}, [open, plan]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			enqueueSnackbar('Plan name is required', { variant: 'error' });
			return;
		}

		if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
			enqueueSnackbar('Please enter a valid price (minimum 0)', { variant: 'error' });
			return;
		}

		if (marketplace === '' || isNaN(Number(marketplace)) || Number(marketplace) < 0) {
			enqueueSnackbar('Please enter a valid number of marketplaces (minimum 0)', { variant: 'error' });
			return;
		}

		if (requestQuota === '' || isNaN(Number(requestQuota)) || Number(requestQuota) < 0) {
			enqueueSnackbar('Please enter a valid monthly request quota (minimum 0)', { variant: 'error' });
			return;
		}

		setIsSubmitting(true);

		const payload = {
			name: name.trim(),
			price: Number(price),
			marketplace: Number(marketplace),
			request_quota: Number(requestQuota),
			expireAt: expireAt ? new Date(expireAt).toISOString() : null,
			status: Number(status)
		};

		try {
			if (isEdit && (plan?._id || plan?.id)) {
				const planId = (plan._id || plan.id) as string;
				await updateMutation.mutateAsync({
					planId,
					payload
				});
				enqueueSnackbar('Plan updated successfully', { variant: 'success', autoHideDuration: 2000 });
			} else {
				await createMutation.mutateAsync(payload);
				enqueueSnackbar('Plan created successfully', { variant: 'success', autoHideDuration: 2000 });
			}
			onClose();
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : String(err) || (isEdit ? 'Failed to update plan' : 'Failed to create plan');
			enqueueSnackbar(errMsg, { variant: 'error' });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: 'hidden',
					p: 0,
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
					m: { xs: 1.5, sm: 2 }
				}
			}}
		>
			<form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
				{/* Top Deep Navy Banner Header */}
				<div className="bg-primary-700 text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="flex items-center justify-center w-7 h-7 rounded bg-white/20 shrink-0">
							<FuseSvgIcon size={18} className="text-white">
								heroicons-outline:cube
							</FuseSvgIcon>
						</div>
						<h1 className="text-base sm:text-lg font-bold text-white m-0 truncate">
							{isEdit ? 'Edit Plan' : 'Add New Plan'}
						</h1>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md border border-white/20 transition-colors cursor-pointer shrink-0"
					>
						<FuseSvgIcon size={14}>heroicons-outline:x-mark</FuseSvgIcon>
						<span>Close</span>
					</button>
				</div>

				<DialogContent
					className="p-4 sm:p-6 flex flex-col gap-4 bg-gray-50/60"
					sx={{
						flex: '1 1 auto',
						overflowY: 'auto',
						minHeight: 0
					}}
				>
					{/* Plan Name */}
					<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
						<div>
							<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
								Plan Name <span className="text-red-500">*</span>
							</Typography>
							<TextField
								fullWidth
								required
								placeholder="e.g., Basic, Professional, Enterprise"
								value={name}
								onChange={(e) => setName(e.target.value)}
								variant="outlined"
								size="small"
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<FuseSvgIcon size={16} className="text-gray-400">
												heroicons-outline:tag
											</FuseSvgIcon>
										</InputAdornment>
									)
								}}
							/>
						</div>

						{/* Price ($) */}
						<div>
							<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
								Price (in USD $) <span className="text-red-500">*</span>
							</Typography>
							<TextField
								fullWidth
								required
								type="number"
								inputProps={{ min: 0, step: 'any' }}
								placeholder="e.g., 250"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								variant="outlined"
								size="small"
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<span className="font-bold text-gray-600 text-sm">$</span>
										</InputAdornment>
									)
								}}
								helperText="Billing amount in US Dollars ($)"
							/>
						</div>

						{/* Marketplaces Allowed */}
						<div>
							<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
								Marketplace Accounts Allowed <span className="text-red-500">*</span>
							</Typography>
							<TextField
								fullWidth
								required
								type="number"
								inputProps={{ min: 0, step: 1 }}
								placeholder="e.g., 5"
								value={marketplace}
								onChange={(e) => setMarketplace(e.target.value)}
								variant="outlined"
								size="small"
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<FuseSvgIcon size={16} className="text-gray-400">
												heroicons-outline:building-storefront
											</FuseSvgIcon>
										</InputAdornment>
									)
								}}
								helperText="Maximum connected marketplaces supported under this plan"
							/>
						</div>

						{/* Request Quota */}
						<div>
							<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
								Monthly Request Quota <span className="text-red-500">*</span>
							</Typography>
							<TextField
								fullWidth
								required
								type="number"
								inputProps={{ min: 0, step: 1 }}
								placeholder="e.g., 2000"
								value={requestQuota}
								onChange={(e) => setRequestQuota(e.target.value)}
								variant="outlined"
								size="small"
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<FuseSvgIcon size={16} className="text-gray-400">
												heroicons-outline:envelope
											</FuseSvgIcon>
										</InputAdornment>
									)
								}}
								helperText="Allowed monthly solicitation / review requests quota (e.g. 2000 requests/month)"
							/>
						</div>

						{/* Plan Expiry Date (Optional) */}
						<div>
							<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
								Expire At (Optional)
							</Typography>
							<TextField
								fullWidth
								type="date"
								value={expireAt}
								onChange={(e) => setExpireAt(e.target.value)}
								variant="outlined"
								size="small"
								InputLabelProps={{ shrink: true }}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<FuseSvgIcon size={16} className="text-gray-400">
												heroicons-outline:calendar
											</FuseSvgIcon>
										</InputAdornment>
									)
								}}
								helperText="Plan expiration date. Leave blank if plan has no expiry."
							/>
						</div>

						{/* Status Toggle Switch */}
						<div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50/70">
							<div className="flex flex-col gap-0.5">
								<Typography className="text-xs font-semibold text-gray-800">
									Plan Status
								</Typography>
								<Typography className="text-[11px] text-gray-500">
									{status === 1
										? 'This plan is active and available for users'
										: 'This plan is deactivated and hidden'}
								</Typography>
							</div>

							<div className="flex items-center gap-2">
								<span
									className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-all ${
										status === 1
											? 'bg-primary-50 text-primary-700 border border-primary-200'
											: 'bg-red-50 text-red-600 border border-red-200'
									}`}
								>
									{status === 1 ? 'Active' : 'Deactive'}
								</span>
								<CustomStatusSwitch
									checked={status === 1}
									onChange={(e) => setStatus(e.target.checked ? 1 : 0)}
								/>
							</div>
						</div>
					</div>
				</DialogContent>

				{/* Bottom Action Footer */}
				<DialogActions
					className="px-4 sm:px-6 py-3 bg-slate-50/90 border-t border-slate-200 flex justify-end gap-3 shrink-0"
					sx={{
						flexShrink: 0,
						borderTop: '1px solid #e2e8f0',
						bgcolor: '#f8fafc',
						px: { xs: 2, sm: 3 },
						py: 1.5
					}}
				>
					<Button
						onClick={onClose}
						disabled={isSubmitting}
						className="capitalize text-slate-700 hover:bg-slate-100 rounded-xl px-4 sm:px-5 py-2 border border-slate-300 font-semibold text-xs sm:text-sm"
						sx={{
							borderRadius: '12px',
							textTransform: 'capitalize'
						}}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={isSubmitting}
						className="bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-5 sm:px-7 py-2 shadow-sm transition-all capitalize text-xs sm:text-sm disabled:opacity-50"
						startIcon={
							isSubmitting ? (
								<CircularProgress size={16} color="inherit" />
							) : (
								<FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>
							)
						}
						sx={{
							bgcolor: 'primary.main',
							'&:hover': { bgcolor: 'primary.dark' },
							borderRadius: '12px',
							textTransform: 'capitalize',
							px: { xs: 2.5, sm: 3.5 },
							py: 1
						}}
					>
						{isSubmitting ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
