import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import moment from 'moment';
import {
	TextField,
	Button,
	Typography,
	CircularProgress,
	InputAdornment,
	IconButton,
	MenuItem,
	Switch,
	Paper,
	Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useCreatePlan, useUpdatePlan, usePlanDetails } from '../../api/hooks/usePlans';
import { Plan } from '../../api/services/plansApiService';
import { getErrorMessage } from '@/utils/errorMessage';
import usePermissions from '@/hooks/usePermissions';
import AccessDeniedView from '@/components/AccessDeniedView';

export default function PlanFormView() {
	const { planId } = useParams<{ planId?: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();
	const { canCreate, canUpdate } = usePermissions();

	const isEdit = Boolean(planId);

	const hasAccess = isEdit ? canUpdate('plans') : canCreate('plans');

	const passedPlan = (location.state as any)?.plan as Plan | undefined;
	const { data: planDetailResponse, isLoading: isFetchingPlan } = usePlanDetails(isEdit && !passedPlan ? planId : undefined);

	const activePlan = passedPlan || planDetailResponse?.data;

	const createMutation = useCreatePlan();
	const updateMutation = useUpdatePlan();

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

	// Patch values when plan data arrives
	useEffect(() => {
		if (activePlan) {
			setName(activePlan.name || '');
			setPrice(activePlan.price !== undefined ? activePlan.price : '');
			setMarketplace(activePlan.marketplace !== undefined ? activePlan.marketplace : '');
			setRequestQuota(activePlan.request_quota !== undefined ? activePlan.request_quota : '');
			setBillingCycle(activePlan.billingCycle !== undefined ? Number(activePlan.billingCycle) : 1);
			setExpireAt(
				activePlan.expireAt && moment(activePlan.expireAt).isValid()
					? moment(activePlan.expireAt).format('YYYY-MM-DD')
					: ''
			);
			setStatus(activePlan.status !== undefined ? activePlan.status : 1);
		}
	}, [activePlan]);

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
			newErrors.name = 'Plan Name is required!';
		} else if (trimmedName.length < 2) {
			newErrors.name = 'Plan Name must be at least 2 characters';
		} else if (trimmedName.length > 100) {
			newErrors.name = 'Plan Name must not exceed 100 characters';
		}

		if (price === '' || price === null || price === undefined) {
			newErrors.price = 'Price is required!';
		} else if (isNaN(Number(price)) || Number(price) <= 0) {
			newErrors.price = 'Price must be greater than 0!';
		} else if (Number(price) > 9999999) {
			newErrors.price = 'Price cannot exceed 9,999,999';
		}

		if (marketplace === '' || marketplace === null || marketplace === undefined) {
			newErrors.marketplace = 'Marketplaces is required!';
		} else if (isNaN(Number(marketplace)) || Number(marketplace) <= 0) {
			newErrors.marketplace = 'Marketplaces must be greater than 0!';
		} else if (!Number.isInteger(Number(marketplace))) {
			newErrors.marketplace = 'Please enter a valid whole number';
		} else if (Number(marketplace) > 999) {
			newErrors.marketplace = 'Marketplaces cannot exceed 999';
		}

		if (requestQuota === '' || requestQuota === null || requestQuota === undefined) {
			newErrors.requestQuota = 'Request Quota is required!';
		} else if (isNaN(Number(requestQuota)) || Number(requestQuota) <= 0) {
			newErrors.requestQuota = 'Request Quota must be greater than 0!';
		} else if (!Number.isInteger(Number(requestQuota))) {
			newErrors.requestQuota = 'Please enter a valid whole number';
		} else if (Number(requestQuota) > 9999999) {
			newErrors.requestQuota = 'Request Quota cannot exceed 9,999,999';
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

	const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (isPending) return;

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
			if (isEdit && planId) {
				await updateMutation.mutateAsync({
					planId,
					payload
				});
				enqueueSnackbar('Plan updated successfully.', { variant: 'success', autoHideDuration: 2500 });
			} else {
				await createMutation.mutateAsync(payload);
				enqueueSnackbar('Plan created successfully.', { variant: 'success', autoHideDuration: 2500 });
			}
			navigate('/plans');
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, isEdit ? 'Failed to update plan' : 'Failed to create plan');
			enqueueSnackbar(errMsg, { variant: 'error' });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!hasAccess) {
		return <AccessDeniedView sectionTitle="Plan Management" />;
	}

	if (isEdit && isFetchingPlan && !activePlan) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[450px] p-8">
				<CircularProgress size={44} className="text-primary mb-4" />
				<Typography className="text-slate-600 dark:text-slate-300 font-medium text-base">
					Loading plan details...
				</Typography>
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col min-h-screen bg-white dark:bg-slate-900">
			{/* Consistent Sticky Top Header (offset by top-12 to stick directly below the 48px top toolbar) */}
			<div className="sticky top-12 z-20 w-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white px-4 sm:px-6 md:px-8 lg:px-10 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
				<div className="flex items-center gap-2.5 sm:gap-3">
					<IconButton
						onClick={() => navigate('/plans')}
						className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 shrink-0"
						size="small"
						title="Back to Plans"
						aria-label="Back to Plans"
					>
						<FuseSvgIcon size={20}>heroicons-outline:arrow-left</FuseSvgIcon>
					</IconButton>

					<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
						<FuseSvgIcon size={20} className="text-primary">
							heroicons-outline:cube
						</FuseSvgIcon>
					</div>

					<div className="flex flex-col min-w-0">
						<h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight flex items-center gap-2 truncate">
							<span>{isEdit ? 'Edit Plan' : 'Add Plan'}</span>
							{isEdit && name && (
								<span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
									{name}
								</span>
							)}
						</h1>
						<p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 m-0 font-medium leading-tight mt-1 truncate">
							{isEdit
								? 'Manage subscription plan pricing, limits, and marketplace quotas.'
								: 'Configure a new subscription tier with quotas, pricing, and billing terms.'}
						</p>
					</div>
				</div>

				{isEdit && (
					<div className="hidden sm:flex items-center">
						<Chip
							label={status === 1 ? 'Active Plan' : 'Inactive'}
							color={status === 1 ? 'success' : 'default'}
							size="small"
							className="font-semibold text-xs"
						/>
					</div>
				)}
			</div>

			{/* Main Full-Width Scrollable Content */}
			<div className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">
				<form id="plan-form" onSubmit={handleSubmit} noValidate>
					{/* Balanced 2x2 Full-Width Grid: Equal 50% width & matched row heights */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
						{/* Card 1: Basic Plan Information (Row 1, Left) */}
						<Paper className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 h-full flex flex-col justify-between">
							<div>
								<div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
									<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
										<FuseSvgIcon size={22}>heroicons-outline:cube</FuseSvgIcon>
									</div>
									<div>
										<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0">
											Plan Identification & Pricing
										</h2>
										<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0 mt-0.5">
											Define the commercial title, recurring billing fee, and billing cycle.
										</p>
									</div>
								</div>

								<div className="flex flex-col gap-5">
									<div>
										<label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">
											Plan Name <span className="text-red-500 font-bold ml-0.5">*</span>
										</label>
										<TextField
											fullWidth
											placeholder="e.g. Starter, Pro, Enterprise"
											value={name}
											inputProps={{ maxLength: 100 }}
											onChange={(e) => {
												setName(e.target.value);
												if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
											}}
											error={Boolean(errors.name)}
											helperText={errors.name || 'A distinctive name displayed to customers in the marketplace'}
											size="medium"
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
										<div>
											<label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">
												Price (€ EUR) <span className="text-red-500 font-bold ml-0.5">*</span>
											</label>
											<TextField
												fullWidth
												type="number"
												placeholder="0.00"
												value={price}
												inputProps={{ min: 0.01, max: 9999999, step: 'any' }}
												onChange={(e) => {
													setPrice(e.target.value);
													if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
												}}
												error={Boolean(errors.price)}
												helperText={errors.price || 'Recurring subscription cost in Euro'}
												InputProps={{
													startAdornment: (
														<InputAdornment position="start">
															<span className="font-semibold text-slate-500">€</span>
														</InputAdornment>
													)
												}}
											/>
										</div>

										<div>
											<label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">
												Billing Frequency <span className="text-red-500 font-bold ml-0.5">*</span>
											</label>
											<TextField
												select
												fullWidth
												value={billingCycle}
												onChange={(e) => setBillingCycle(Number(e.target.value))}
												helperText="Frequency of customer invoicing & renewal"
											>
												<MenuItem value={1}>Monthly (Every 1 Month)</MenuItem>
												<MenuItem value={3}>Quarterly (Every 3 Months)</MenuItem>
												<MenuItem value={12}>Yearly (Every 12 Months)</MenuItem>
											</TextField>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
								<FuseSvgIcon size={18} className="text-primary shrink-0">
									heroicons-outline:currency-euro
								</FuseSvgIcon>
								<span>
									Subscription fees are billed automatically per the selected frequency cycle.
								</span>
							</div>
						</Paper>

						{/* Card 2: Plan Visibility & Status (Row 1, Right) */}
						<Paper className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 h-full flex flex-col justify-between">
							<div>
								<div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
									<div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
										<FuseSvgIcon size={22}>heroicons-outline:shield-check</FuseSvgIcon>
									</div>
									<div>
										<h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0">
											Plan Visibility & Lifecycle
										</h3>
										<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0 mt-0.5">
											Configure display availability and expiration cutoffs.
										</p>
									</div>
								</div>

								<div className="flex flex-col gap-5">
									<div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
										<div>
											<Typography className="font-semibold text-sm text-slate-800 dark:text-slate-200">
												Status: {status === 1 ? 'Active' : 'Inactive'}
											</Typography>
											<Typography className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
												{status === 1 ? 'Visible to public and available for subscription' : 'Hidden from checkout and plan selection'}
											</Typography>
										</div>
										<Switch
											checked={status === 1}
											onChange={(e) => setStatus(e.target.checked ? 1 : 0)}
											color="primary"
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center justify-between">
											<span>Plan Expiry Date</span>
											<span className="text-xs text-slate-400 font-normal lowercase">(optional)</span>
										</label>
										<TextField
											fullWidth
											type="date"
											value={expireAt}
											onChange={(e) => {
												setExpireAt(e.target.value);
												if (errors.expireAt) setErrors((prev) => ({ ...prev, expireAt: undefined }));
											}}
											error={Boolean(errors.expireAt)}
											helperText={errors.expireAt || 'Optional cutoff date after which plan is deprecated'}
											InputLabelProps={{ shrink: true }}
										/>
									</div>
								</div>
							</div>

							<div className="mt-5 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2.5">
								<FuseSvgIcon size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0">
									heroicons-outline:information-circle
								</FuseSvgIcon>
								<span>
									Active plans are immediately visible to registered merchants during initial setup and plan upgrades.
								</span>
							</div>
						</Paper>

						{/* Card 3: Quotas & Operational Limits (Row 2, Left) */}
						<Paper className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 h-full flex flex-col justify-between">
							<div>
								<div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
									<div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
										<FuseSvgIcon size={22}>heroicons-outline:chart-bar</FuseSvgIcon>
									</div>
									<div>
										<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0">
											Quotas & Operational Limits
										</h2>
										<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0 mt-0.5">
											Specify the allocated marketplace slots and monthly review request allowance.
										</p>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
									<div>
										<label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">
											Marketplaces Allowed <span className="text-red-500 font-bold ml-0.5">*</span>
										</label>
										<TextField
											fullWidth
											type="number"
											placeholder="e.g. 1, 3, 5"
											value={marketplace}
											inputProps={{ min: 1, max: 999, step: 1 }}
											onChange={(e) => {
												setMarketplace(e.target.value);
												if (errors.marketplace) setErrors((prev) => ({ ...prev, marketplace: undefined }));
											}}
											error={Boolean(errors.marketplace)}
											helperText={errors.marketplace || 'Max Amazon marketplace regions seller can connect (1 - 999)'}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<FuseSvgIcon size={18} className="text-slate-400">
															heroicons-outline:building-storefront
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">
											Request Quota <span className="text-red-500 font-bold ml-0.5">*</span>
										</label>
										<TextField
											fullWidth
											type="number"
											placeholder="e.g. 500, 2000"
											value={requestQuota}
											inputProps={{ min: 1, max: 9999999, step: 1 }}
											onChange={(e) => {
												setRequestQuota(e.target.value);
												if (errors.requestQuota) setErrors((prev) => ({ ...prev, requestQuota: undefined }));
											}}
											error={Boolean(errors.requestQuota)}
											helperText={errors.requestQuota || 'Max review feedback requests allowed per cycle (1 - 9,999,999)'}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<FuseSvgIcon size={18} className="text-slate-400">
															heroicons-outline:envelope
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>
								</div>
							</div>

							<div className="mt-5 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
								<FuseSvgIcon size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0">
									heroicons-outline:check-circle
								</FuseSvgIcon>
								<span>
									Automated monthly resets apply to the request quota on the merchant's billing anniversary date.
								</span>
							</div>
						</Paper>

						{/* Card 4: Live Preview & Summary (Row 2, Right) */}
						<Paper className="p-6 sm:p-8 rounded-2xl border border-primary/25 dark:border-primary/30 shadow-xs bg-linear-to-br from-primary/5 via-white to-primary/5 dark:from-primary/10 dark:via-slate-900 dark:to-primary/10 h-full flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-5 pb-4 border-b border-primary/15 dark:border-primary/20">
									<div className="flex items-center gap-2.5">
										<div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">
											<FuseSvgIcon size={22}>heroicons-outline:sparkles</FuseSvgIcon>
										</div>
										<div>
											<h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0">
												Live Marketplace Preview
											</h3>
											<p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
												Real-time preview of how sellers see this tier
											</p>
										</div>
									</div>
									<Chip
										size="small"
										label={status === 1 ? 'ACTIVE' : 'INACTIVE'}
										color={status === 1 ? 'success' : 'default'}
										className="text-[10px] font-bold h-6 px-1.5"
									/>
								</div>

								<div className="flex flex-col gap-4">
									<div className="flex items-baseline justify-between flex-wrap gap-2">
										<span className="text-2xl font-black text-slate-900 dark:text-white truncate max-w-[280px]">
											{name || 'Plan Title'}
										</span>
										<div className="flex items-baseline gap-1 text-slate-800 dark:text-slate-100">
											<span className="text-3xl font-extrabold text-primary">€{price || '0'}</span>
											<span className="text-xs text-slate-500 font-medium">
												/ {billingCycle === 1 ? 'month' : billingCycle === 3 ? 'quarter' : billingCycle === 12 ? 'year' : `${billingCycle} months`}
											</span>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
										<div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
											<FuseSvgIcon size={18} className="text-primary shrink-0">
												heroicons-outline:building-storefront
											</FuseSvgIcon>
											<div className="flex flex-col">
												<span className="text-[10px] text-slate-400 uppercase font-semibold">Marketplaces</span>
												<span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{marketplace || 0} allowed</span>
											</div>
										</div>

										<div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800">
											<FuseSvgIcon size={18} className="text-emerald-500 shrink-0">
												heroicons-outline:envelope
											</FuseSvgIcon>
											<div className="flex flex-col">
												<span className="text-[10px] text-slate-400 uppercase font-semibold">Review Quota</span>
												<span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{requestQuota || 0} req/mo</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
								<span>Expiry deprecation:</span>
								<span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
									{expireAt ? expireAt : 'Never (Perpetual)'}
								</span>
							</div>
						</Paper>
					</div>
				</form>
			</div>

			{/* Sticky Bottom Actions Bar */}
			<div className="sticky bottom-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 md:px-8 lg:px-10 py-3.5 shadow-lg">
				<div className="w-full flex items-center justify-between gap-4">
					<div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
						<FuseSvgIcon size={16} className="text-slate-400">
							heroicons-outline:information-circle
						</FuseSvgIcon>
						<span>
							{isEdit ? 'Changes will immediately apply to new subscribers.' : 'Created plans will become visible based on active status.'}
						</span>
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto justify-end">
						<Button
							variant="outlined"
							color="inherit"
							onClick={() => navigate('/plans')}
							disabled={isPending}
							className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 normal-case px-5 py-2 font-medium"
						>
							Cancel
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={() => handleSubmit()}
							disabled={isPending}
							startIcon={
								<FuseSvgIcon size={18} className={isPending ? 'animate-spin' : ''}>
									{isPending
										? 'heroicons-outline:arrow-path'
										: isEdit
											? 'heroicons-outline:check'
											: 'heroicons-outline:plus'}
								</FuseSvgIcon>
							}
							className="normal-case px-6 py-2 font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30"
						>
							{isPending ? (isEdit ? 'Updating Plan...' : 'Creating Plan...') : isEdit ? 'Update Plan' : 'Create Plan'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
