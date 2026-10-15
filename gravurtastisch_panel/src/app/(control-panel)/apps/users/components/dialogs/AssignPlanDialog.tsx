import { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import {
	Dialog,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	CircularProgress,
	IconButton,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Checkbox,
	FormControlLabel,
	Paper,
	Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { User } from '../../api/services/usersApiService';
import { useAssignPlanToUser } from '../../api/hooks/useUsers';
import { useAllPlans } from '../../../plans/api/hooks/usePlans';
import { Plan } from '../../../plans/api/services/plansApiService';
import { getErrorMessage } from '@/utils/errorMessage';

interface AssignPlanDialogProps {
	open: boolean;
	onClose: () => void;
	user: User | null;
}

export default function AssignPlanDialog({ open, onClose, user }: AssignPlanDialogProps) {
	const { enqueueSnackbar } = useSnackbar();
	const assignPlanMutation = useAssignPlanToUser();

	// Fetch active plans available in the system
	const { data: plansData, isLoading: isLoadingPlans } = useAllPlans({ status: 1, limit: 100 }, open);
	const plans: Plan[] = useMemo(() => {
		const raw = (plansData as any)?.data;
		return Array.isArray(raw) ? raw : [];
	}, [plansData]);

	const [selectedPlanId, setSelectedPlanId] = useState<string>('');
	const [sendNotification, setSendNotification] = useState<boolean>(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Find user's current active plan if any
	const currentActivePlan = useMemo(() => {
		if (!user) return null;
		if (Array.isArray(user.plans) && user.plans.length > 0) {
			const active = user.plans.find((p) => p.status === 1);
			if (active) return active;
			return user.plans[user.plans.length - 1];
		}
		if (user.currentPlanId && typeof user.currentPlanId === 'object') {
			return user.currentPlanId;
		}
		return null;
	}, [user]);

	const isCurrentPlanExpired = useMemo(() => {
		if (!user) return false;
		if (user.subscriptionStatus === 2) return true;
		if (currentActivePlan?.expireAt) {
			return new Date(currentActivePlan.expireAt).getTime() < Date.now();
		}
		return false;
	}, [user, currentActivePlan]);

	const hasActiveNonExpiredPlan = useMemo(() => {
		return Boolean(currentActivePlan && !isCurrentPlanExpired && currentActivePlan.expireAt);
	}, [currentActivePlan, isCurrentPlanExpired]);

	// Find user's latest expiration across all active (1) or queued (4) plans
	const latestExpireMoment = useMemo(() => {
		if (!user) return null;
		const now = Date.now();
		let latest: moment.Moment | null = null;

		if (Array.isArray(user.plans) && user.plans.length > 0) {
			user.plans.forEach((p) => {
				if ((p.status === 1 || p.status === 4) && p.expireAt) {
					const exp = moment(p.expireAt);
					if (exp.valueOf() > now) {
						if (!latest || exp.isAfter(latest)) {
							latest = exp;
						}
					}
				}
			});
		}

		if (!latest && hasActiveNonExpiredPlan && currentActivePlan?.expireAt) {
			latest = moment(currentActivePlan.expireAt);
		}

		return latest;
	}, [user, hasActiveNonExpiredPlan, currentActivePlan]);

	const hasOngoingPlan = Boolean(latestExpireMoment);

	// Selected plan object
	const selectedPlan = useMemo(() => {
		return plans.find((p) => String(p._id || p.id) === String(selectedPlanId)) || null;
	}, [plans, selectedPlanId]);

	// Billing cycle is automatically taken from the selected plan's configuration
	const billingCycle = useMemo(() => {
		return Number(selectedPlan?.billingCycle) || 1;
	}, [selectedPlan]);

	// Start date for the newly assigned plan
	const estimatedStartDate = useMemo(() => {
		if (hasOngoingPlan && latestExpireMoment) {
			return latestExpireMoment.format('DD MMM YYYY');
		}
		return moment().format('DD MMM YYYY');
	}, [hasOngoingPlan, latestExpireMoment]);

	// Calculate estimated expiry date
	const estimatedExpireDate = useMemo(() => {
		let base = hasOngoingPlan && latestExpireMoment ? moment(latestExpireMoment) : moment();

		if (billingCycle === 2) {
			return base.add(3, 'months').format('DD MMM YYYY');
		}
		if (billingCycle === 3) {
			return base.add(1, 'year').format('DD MMM YYYY');
		}
		return base.add(1, 'month').format('DD MMM YYYY');
	}, [billingCycle, hasOngoingPlan, latestExpireMoment]);

	// Reset state when opening dialog
	useEffect(() => {
		if (open) {
			if (currentActivePlan?.planId) {
				setSelectedPlanId(String(currentActivePlan.planId));
			} else if (plans.length > 0) {
				setSelectedPlanId(String(plans[0]._id || plans[0].id));
			} else {
				setSelectedPlanId('');
			}
			setSendNotification(true);
			setIsSubmitting(false);
		}
	}, [open, currentActivePlan, plans]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!user) {
			enqueueSnackbar('No seller selected', { variant: 'error' });
			return;
		}

		if (!selectedPlanId) {
			enqueueSnackbar('Please select a plan to assign', { variant: 'warning' });
			return;
		}

		setIsSubmitting(true);
		try {
			const userId = user._id || user.id || '';

			const result = await assignPlanMutation.mutateAsync({
				userId,
				payload: {
					planId: selectedPlanId,
					billingCycle,
					activationMode: 'extend',
					sendNotification
				}
			});

			enqueueSnackbar(
				result?.message || `Plan "${selectedPlan?.name || ''}" assigned successfully!`,
				{ variant: 'success' }
			);
			onClose();
		} catch (error) {
			enqueueSnackbar(getErrorMessage(error) || 'Failed to assign plan', { variant: 'error' });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={isSubmitting ? undefined : onClose}
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
				{/* Dialog Header */}
				<div className="bg-secondary-500 text-slate-900 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="flex items-center justify-center w-7 h-7 rounded bg-black/10 shrink-0">
							<FuseSvgIcon size={18} className="text-slate-900">
								lucide:sparkles
							</FuseSvgIcon>
						</div>
						<div>
							<h2 className="text-base font-bold tracking-tight text-slate-900 m-0">
								Assign Plan to Seller
							</h2>
							<p className="text-xs text-slate-700 m-0">
								Manually assign, renew, or upgrade subscription plan for this seller
							</p>
						</div>
					</div>

					<IconButton
						size="small"
						onClick={onClose}
						disabled={isSubmitting}
						className="text-slate-900/70 hover:text-slate-900 hover:bg-black/10 transition-colors p-1"
					>
						<FuseSvgIcon size={18}>heroicons-outline:x-mark</FuseSvgIcon>
					</IconButton>
				</div>

				<DialogContent dividers sx={{ p: { xs: 2, sm: 2.5 } }} className="space-y-4">
					{/* Seller Information Card */}
					{user && (
						<Paper
							variant="outlined"
							sx={{
								p: 2,
								backgroundColor: '#F8FAFC',
								borderRadius: 2,
								borderColor: '#E2E8F0'
							}}
						>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<div>
									<Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
										{user.name || '—'}
									</Typography>
									<Typography sx={{ fontSize: 12, color: '#64748B' }}>
										{user.email} {user.businessName ? `• Brand: ${user.businessName}` : ''}
									</Typography>
								</div>

								{/* Current status badge */}
								<div>
									{currentActivePlan ? (
										<span
											className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
												isCurrentPlanExpired
													? 'bg-rose-50 text-rose-700 border-rose-200'
													: 'bg-emerald-50 text-emerald-700 border-emerald-200'
											}`}
										>
											{isCurrentPlanExpired
												? `Current: ${currentActivePlan.name} (Expired)`
												: `Current: ${currentActivePlan.name} (Active)`}
										</span>
									) : (
										<span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-100 text-slate-600 border-slate-200">
											No Active Plan
										</span>
									)}
								</div>
							</div>

							{currentActivePlan?.expireAt && (
								<Typography sx={{ fontSize: 11.5, color: '#64748B', mt: 1 }}>
									{isCurrentPlanExpired ? 'Expired on: ' : 'Current expiry: '}
									<strong className="text-slate-800">{moment(currentActivePlan.expireAt).format('DD MMM YYYY')}</strong>
								</Typography>
							)}
						</Paper>
					)}

					{/* Plan Selection */}
					{isLoadingPlans ? (
						<div className="flex items-center justify-center py-6">
							<CircularProgress size={24} />
							<Typography sx={{ ml: 1.5, fontSize: 13, color: 'text.secondary' }}>
								Loading available plans...
							</Typography>
						</div>
					) : plans.length === 0 ? (
						<Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'warning.main' }}>
							<Typography sx={{ fontSize: 13, color: 'warning.main' }}>
								No active plans found in the system. Please create a plan first under the Plans section.
							</Typography>
						</Paper>
					) : (
						<div className="space-y-3.5">
							{/* Select Plan */}
							<FormControl fullWidth size="small">
								<InputLabel id="select-plan-label">Select Plan</InputLabel>
								<Select
									labelId="select-plan-label"
									value={selectedPlanId}
									label="Select Plan"
									onChange={(e) => setSelectedPlanId(e.target.value)}
									disabled={isSubmitting}
									sx={{
										bgcolor: '#FFFFFF',
										borderRadius: 1.5,
										'& .MuiSelect-select': {
											display: 'flex',
											alignItems: 'center',
											py: 1.25
										}
									}}
									MenuProps={{
										PaperProps: {
											sx: {
												maxHeight: 320,
												borderRadius: 2,
												mt: 0.5,
												boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
												border: '1px solid #E2E8F0',
												p: 0.5
											}
										}
									}}
									renderValue={(selectedId) => {
										const p = plans.find((item) => String(item._id || item.id) === String(selectedId));
										if (!p) return <span className="text-slate-400">Select Plan</span>;
										const isYearly = p.billingCycle === 3;
										const isQuarterly = p.billingCycle === 2;
										const cycleBadge = isYearly ? 'Annual' : isQuarterly ? 'Quarterly' : 'Monthly';
										const cycleSuffix = isYearly ? '/yr' : isQuarterly ? '/qtr' : '/mo';
										const cycleTextColor = isYearly
											? 'text-blue-600'
											: isQuarterly
											? 'text-sky-600'
											: 'text-slate-500';

										return (
											<div className="flex items-center justify-between w-full pr-1">
												<div className="flex items-center gap-1.5">
													<span className="font-semibold text-slate-800 text-[13px]">{p.name}</span>
													<span className={`text-xs font-semibold ${cycleTextColor}`}>
														({cycleBadge})
													</span>
												</div>
												<span className="text-xs text-slate-500 font-medium">
													${Number(p.price || 0).toFixed(2)} {cycleSuffix}
												</span>
											</div>
										);
									}}
								>
									{plans.map((p) => {
										const isYearly = p.billingCycle === 3;
										const isQuarterly = p.billingCycle === 2;
										const cycleBadge = isYearly ? 'Annual' : isQuarterly ? 'Quarterly' : 'Monthly';
										const cycleSuffix = isYearly ? '/yr' : isQuarterly ? '/qtr' : '/mo';
										const cycleTextColor = isYearly
											? 'text-blue-600'
											: isQuarterly
											? 'text-sky-600'
											: 'text-slate-500';

										return (
											<MenuItem
												key={p._id || p.id}
												value={String(p._id || p.id)}
												className="hover:bg-slate-50 transition-colors"
												sx={{
													py: 1.25,
													px: 1.75,
													borderRadius: 1,
													my: 0.25
												}}
											>
												<div className="flex items-center justify-between w-full gap-3">
													<div className="flex items-center gap-1.5 min-w-0">
														<span className="font-semibold text-slate-800 text-[13px]">{p.name}</span>
														<span className={`text-xs font-semibold ${cycleTextColor}`}>
															({cycleBadge})
														</span>
													</div>
													<div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
														<span className="font-semibold text-slate-700">
															${Number(p.price || 0).toFixed(2)} {cycleSuffix}
														</span>
														<span className="text-slate-300">•</span>
														<span>{p.marketplace ?? 1} Channels</span>
														<span className="text-slate-300">•</span>
														<span>{Number(p.request_quota || 0).toLocaleString()} Quota</span>
													</div>
												</div>
											</MenuItem>
										);
									})}
								</Select>
							</FormControl>

							{/* Informative notification if seller already has an active/ongoing plan */}
							{hasOngoingPlan && (
								<div className="rounded-xl border border-blue-200/90 bg-blue-50/70 p-3 sm:p-3.5 flex items-start gap-3">
									<div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 mt-0.5">
										<FuseSvgIcon size={18}>heroicons-outline:clock</FuseSvgIcon>
									</div>
									<div className="min-w-0 flex-1">
										<Typography className="text-xs font-bold text-blue-950">
											Ongoing Plan: {currentActivePlan?.name || 'Active Subscription'}
										</Typography>
										<Typography className="text-[11.5px] text-blue-800/90 mt-0.5 leading-relaxed">
											The seller currently has an active plan running until <strong>{latestExpireMoment?.format('DD MMM YYYY')}</strong>. The newly assigned plan will be queued and will automatically start right after the current plan completes.
										</Typography>
									</div>
								</div>
							)}

							{/* Selected Plan Details & Summary Box */}
							{selectedPlan && (
								<Paper
									variant="outlined"
									sx={{
										p: 2,
										backgroundColor: '#F8FAFC',
										borderColor: '#E2E8F0',
										borderRadius: 2
									}}
								>
									<Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#475569', mb: 1.25, textTransform: 'uppercase', letterSpacing: 0.6 }}>
										Plan Assignment Summary
									</Typography>
									<div className="grid grid-cols-2 gap-2.5 text-xs">
										<div>
											<span className="text-slate-500">Plan Name:</span>{' '}
											<strong className="text-slate-900">{selectedPlan.name}</strong>
										</div>
										<div>
											<span className="text-slate-500">Billing Cycle:</span>{' '}
											<strong className="text-slate-900">
												{billingCycle === 3
													? 'Annual (1 Year)'
													: billingCycle === 2
														? 'Quarterly (3 Months)'
														: 'Monthly (1 Month)'}
											</strong>
										</div>
										<div>
											<span className="text-slate-500">Sales Channels:</span>{' '}
											<strong className="text-slate-900">{selectedPlan.marketplace ?? 1} channels</strong>
										</div>
										<div>
											<span className="text-slate-500">Monthly Quota:</span>{' '}
											<strong className="text-slate-900">
												{Number(selectedPlan.request_quota || 0).toLocaleString()} units/mo
											</strong>
										</div>
										<div>
											<span className="text-slate-500">Price:</span>{' '}
											<strong className="text-slate-900">
												${Number(selectedPlan.price || 0).toFixed(2)}{' '}
												<span className="text-slate-500 font-normal">{billingCycle === 3 ? '/yr' : billingCycle === 2 ? '/qtr' : '/mo'}</span>
											</strong>
										</div>
										<div className="col-span-2 pt-2 border-t border-slate-200 mt-0.5 grid grid-cols-2 gap-2.5">
											<div>
												<span className="text-slate-500">Starts On:</span>{' '}
												<strong className="text-slate-900 block mt-0.5">{estimatedStartDate}</strong>
												{hasOngoingPlan ? (
													<span className="text-slate-400 text-[11px]">
														(Starts after current plan)
													</span>
												) : (
													<span className="text-slate-400 text-[11px]">
														(Starts immediately today)
													</span>
												)}
											</div>
											<div>
												<span className="text-slate-500">Calculated Expiry Date:</span>{' '}
												<strong className="text-blue-700 font-bold block mt-0.5">{estimatedExpireDate}</strong>
												<span className="text-slate-400 text-[11px]">
													(Valid for {billingCycle === 3 ? '1 year' : billingCycle === 2 ? '3 months' : '1 month'})
												</span>
											</div>
										</div>
									</div>
								</Paper>
							)}

							{/* Send confirmation email checkbox */}
							<FormControlLabel
								control={
									<Checkbox
										checked={sendNotification}
										onChange={(e) => setSendNotification(e.target.checked)}
										size="small"
										color="primary"
										disabled={isSubmitting}
									/>
								}
								label={
									<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
										Send subscription confirmation email to seller ({user?.email})
									</Typography>
								}
							/>
						</div>
					)}
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
						disabled={isSubmitting || isLoadingPlans || plans.length === 0}
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
						{isSubmitting ? 'Assigning Plan...' : 'Assign Plan'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
