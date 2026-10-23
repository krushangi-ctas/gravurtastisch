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
	InputAdornment,
	IconButton,
	MenuItem
} from '@mui/material';
import CustomStatusSwitch from '@/components/CustomSwitch';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useCreatePlan, useUpdatePlan } from '../../api/hooks/usePlans';
import { Plan } from '../../api/services/plansApiService';
import { getErrorMessage } from '@/utils/errorMessage';

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
	const [billingCycle, setBillingCycle] = useState<number>(1);
	const [expireAt, setExpireAt] = useState('');
	const [status, setStatus] = useState<number>(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<{
		name?: string;
		price?: string;
		marketplace?: string;
		requestQuota?: string;
		expireAt?: string;
	}>({});

	// Populate form state when editing or resetting
	useEffect(() => {
		if (open) {
			setErrors({});
			if (plan) {
				setName(plan.name || '');
				setPrice(plan.price !== undefined ? plan.price : '');
				setMarketplace(plan.marketplace !== undefined ? plan.marketplace : '');
				setRequestQuota(plan.request_quota !== undefined ? plan.request_quota : '');
				setBillingCycle(plan.billingCycle !== undefined ? Number(plan.billingCycle) : 1);
				setExpireAt(plan.expireAt && moment(plan.expireAt).isValid() ? moment(plan.expireAt).format('YYYY-MM-DD') : '');
				setStatus(plan.status !== undefined ? plan.status : 1);
			} else {
				setName('');
				setPrice('');
				setMarketplace('');
				setRequestQuota('');
				setBillingCycle(1);
				setExpireAt('');
				setStatus(1);
			}
		}
	}, [open, plan]);

	const validateForm = () => {
		const newErrors: {
			name?: string;
			price?: string;
			marketplace?: string;
			requestQuota?: string;
			expireAt?: string;
		} = {};

		const trimmedName = name.trim();
		if (!trimmedName) {
			newErrors.name = 'Plan name is required';
		} else if (trimmedName.length < 2) {
			newErrors.name = 'Plan name must be at least 2 characters';
		} else if (trimmedName.length > 50) {
			newErrors.name = 'Plan name must not exceed 50 characters';
		}

		if (price === '' || price === null || price === undefined) {
			newErrors.price = 'Price is required';
		} else if (isNaN(Number(price)) || Number(price) <= 0) {
			newErrors.price = 'Must be greater than 0';
		} else if (Number(price) > 9999999) {
			newErrors.price = 'Price cannot exceed €9,999,999';
		}

		if (marketplace === '' || marketplace === null || marketplace === undefined) {
			newErrors.marketplace = 'Marketplace count is required';
		} else if (isNaN(Number(marketplace)) || Number(marketplace) <= 0) {
			newErrors.marketplace = 'Must be greater than 0';
		} else if (!Number.isInteger(Number(marketplace))) {
			newErrors.marketplace = 'Please enter a valid whole number';
		} else if (Number(marketplace) > 9999999) {
			newErrors.marketplace = 'Marketplaces allowed cannot exceed 9,999,999';
		}

		if (requestQuota === '' || requestQuota === null || requestQuota === undefined) {
			newErrors.requestQuota = 'Request quota is required';
		} else if (isNaN(Number(requestQuota)) || Number(requestQuota) <= 0) {
			newErrors.requestQuota = 'Must be greater than 0';
		} else if (!Number.isInteger(Number(requestQuota))) {
			newErrors.requestQuota = 'Please enter a valid whole number';
		} else if (Number(requestQuota) > 10000000) {
			newErrors.requestQuota = 'Request quota cannot exceed 10,000,000';
		}

		if (expireAt) {
			const todayStr = moment().format('YYYY-MM-DD');
			if (expireAt < todayStr) {
				newErrors.expireAt = 'Expiry date must be a future date';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			enqueueSnackbar('Please correct the highlighted errors in the form', { variant: 'error' });
			return;
		}

		setIsSubmitting(true);

		const payload = {
			name: name.trim(),
			price: Number(price),
			currency: 'eur',
			marketplace: Number(marketplace),
			request_quota: Number(requestQuota),
			billingCycle: Number(billingCycle) || 1,
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
				enqueueSnackbar('Plan updated successfully.', { variant: 'success', autoHideDuration: 2000 });
			} else {
				await createMutation.mutateAsync(payload);
				enqueueSnackbar('Plan created successfully.', { variant: 'success', autoHideDuration: 2000 });
			}
			onClose();
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, isEdit ? 'Failed to update plan' : 'Failed to create plan');
			enqueueSnackbar(errMsg, { variant: 'error' });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			disableRestoreFocus
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
				{/* Top Header */}
				<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
							<FuseSvgIcon size={18} className="text-primary">
								heroicons-outline:cube
							</FuseSvgIcon>
						</div>
						<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0 truncate">
							{isEdit ? 'Edit Plan' : 'Add New Plan'}
						</h2>
					</div>

					<IconButton
						size="small"
						onClick={onClose}
						className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
						aria-label="Close"
					>
						<FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
					</IconButton>
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
							<label className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-1.5 block">
								Plan Name <span className="text-red-500">*</span>
							</label>
							<TextField
								fullWidth
								required
								placeholder="e.g., Basic, Professional, Enterprise"
								value={name}
								onChange={(e) => {
									const val = e.target.value.slice(0, 50);
									setName(val);
									if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
								}}
								inputProps={{ maxLength: 50 }}
								error={Boolean(errors.name)}
								helperText={errors.name}
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

						{/* Price */}
						<div>
							<label className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-1.5 block">
								Price (in EUR €) <span className="text-red-500">*</span>
							</label>
							<TextField
								fullWidth
								required
								type="number"
								inputProps={{ min: 0.01, max: 9999999, step: 'any' }}
								placeholder="e.g., 250"
								value={price}
								onKeyDown={(e) => {
									if (e.key === '-' || e.key === 'e' || e.key === 'E') {
										e.preventDefault();
									}
								}}
								onChange={(e) => {
									const val = e.target.value;
									setPrice(val);
									const num = Number(val);
									if (val !== '' && (isNaN(num) || num <= 0)) {
										setErrors((prev) => ({ ...prev, price: 'Must be greater than 0' }));
									} else if (num > 9999999) {
										setErrors((prev) => ({ ...prev, price: 'Price cannot exceed €9,999,999' }));
									} else if (errors.price) {
										setErrors((prev) => ({ ...prev, price: undefined }));
									}
								}}
								onWheel={(e) => (e.target as HTMLElement).blur()}
								error={Boolean(errors.price)}
								variant="outlined"
								size="small"
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<span className="font-bold text-gray-600 text-sm">€</span>
										</InputAdornment>
									)
								}}
								helperText={
									errors.price ||
									(billingCycle === 3
										? 'Total billed annually in EUR (€) — set full yearly price'
										: billingCycle === 2
											? 'Total billed quarterly in EUR (€) — set full 3-month price'
											: 'Billed monthly in EUR (€)')
								}
							/>
						</div>

						{/* Billing Cycle */}
						<div>
							<label className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-1.5 block">
								Billing Cycle <span className="text-red-500">*</span>
							</label>
							<TextField
								select
								fullWidth
								required
								size="small"
								value={billingCycle}
								onChange={(e) => setBillingCycle(Number(e.target.value))}
								variant="outlined"
								helperText="Select recurring billing cycle frequency"
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<FuseSvgIcon size={16} className="text-[#B38B5B]">
												{billingCycle === 3
													? 'heroicons-outline:sparkles'
													: billingCycle === 2
														? 'heroicons-outline:clock'
														: 'heroicons-outline:calendar'}
											</FuseSvgIcon>
										</InputAdornment>
									)
								}}
							>
								<MenuItem value={1}>
									<div className="flex items-center gap-2 py-0.5">
										<FuseSvgIcon size={16} className="text-[#B38B5B]">
											heroicons-outline:calendar
										</FuseSvgIcon>
										<span className="font-semibold text-slate-800">Monthly</span>
										<span className="text-xs text-slate-400 font-normal">
											(Every 1 Month)
										</span>
									</div>
								</MenuItem>
								<MenuItem value={2}>
									<div className="flex items-center gap-2 py-0.5">
										<FuseSvgIcon size={16} className="text-[#B38B5B]">
											heroicons-outline:clock
										</FuseSvgIcon>
										<span className="font-semibold text-slate-800">Quarterly</span>
										<span className="text-xs text-slate-400 font-normal">
											(Every 3 Months)
										</span>
									</div>
								</MenuItem>
								<MenuItem value={3}>
									<div className="flex items-center gap-2 py-0.5">
										<FuseSvgIcon size={16} className="text-[#B38B5B]">
											heroicons-outline:sparkles
										</FuseSvgIcon>
										<span className="font-semibold text-slate-800">Yearly / Annual</span>
										<span className="text-xs text-slate-400 font-normal">
											(Every 12 Months)
										</span>
									</div>
								</MenuItem>
							</TextField>
						</div>

						{/* Marketplaces Allowed */}
						<div>
							<label className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-1.5 block">
								Marketplace Accounts Allowed <span className="text-red-500">*</span>
							</label>
							<TextField
								fullWidth
								required
								type="number"
								inputProps={{ min: 1, max: 9999999, step: 1 }}
								placeholder="e.g., 5"
								value={marketplace}
								onKeyDown={(e) => {
									if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') {
										e.preventDefault();
									}
								}}
								onChange={(e) => {
									const val = e.target.value;
									setMarketplace(val);
									const num = Number(val);
									if (val !== '' && (isNaN(num) || num <= 0)) {
										setErrors((prev) => ({ ...prev, marketplace: 'Must be greater than 0' }));
									} else if (num > 9999999) {
										setErrors((prev) => ({ ...prev, marketplace: 'Marketplaces allowed cannot exceed 9,999,999' }));
									} else if (errors.marketplace) {
										setErrors((prev) => ({ ...prev, marketplace: undefined }));
									}
								}}
								onWheel={(e) => (e.target as HTMLElement).blur()}
								error={Boolean(errors.marketplace)}
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
								helperText={errors.marketplace || 'Maximum connected marketplaces supported under this plan (min: 1, max: 9,999,999)'}
							/>
						</div>

						{/* Request Quota */}
						<div>
							<label className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-1.5 block">
								Monthly Request Quota <span className="text-red-500">*</span>
							</label>
							<TextField
								fullWidth
								required
								type="number"
								inputProps={{ min: 1, max: 10000000, step: 1 }}
								placeholder="e.g., 2000"
								value={requestQuota}
								onKeyDown={(e) => {
									if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') {
										e.preventDefault();
									}
								}}
								onChange={(e) => {
									const val = e.target.value;
									setRequestQuota(val);
									if (val !== '' && (isNaN(Number(val)) || Number(val) <= 0)) {
										setErrors((prev) => ({ ...prev, requestQuota: 'Must be greater than 0' }));
									} else if (errors.requestQuota) {
										setErrors((prev) => ({ ...prev, requestQuota: undefined }));
									}
								}}
								onWheel={(e) => (e.target as HTMLElement).blur()}
								error={Boolean(errors.requestQuota)}
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
								helperText={errors.requestQuota || 'Allowed monthly solicitation / review requests quota (e.g. 2000 requests/month)'}
							/>
						</div>

						{/* Plan Expiry Date (Optional) */}
						<div>
							<label className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase mb-1.5 block">
								Expire At (Optional)
							</label>
							<TextField
								fullWidth
								type="date"
								inputProps={{
									min: moment().format('YYYY-MM-DD')
								}}
								value={expireAt}
								onChange={(e) => {
									const val = e.target.value;
									setExpireAt(val);
									const todayStr = moment().format('YYYY-MM-DD');
									if (val && val < todayStr) {
										setErrors((prev) => ({ ...prev, expireAt: 'Expiry date must be a future date' }));
									} else if (errors.expireAt) {
										setErrors((prev) => ({ ...prev, expireAt: undefined }));
									}
								}}
								error={Boolean(errors.expireAt)}
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
								helperText={errors.expireAt || 'Plan expiration date. Only future dates are allowed. Leave blank if plan has no expiry.'}
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
									className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-all ${status === 1
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
