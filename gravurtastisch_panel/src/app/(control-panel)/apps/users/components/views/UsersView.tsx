'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AccessDeniedView from '@/components/AccessDeniedView';
import { styled } from '@mui/material/styles';
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	FormControl,
	IconButton,
	InputAdornment,
	MenuItem,
	Paper,
	Popover,
	Select,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import {
	format,
	isAfter,
	addDays,
	subDays,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameDay,
	isWithinInterval,
	addMonths,
	subMonths
} from 'date-fns';
import { useSnackbar } from 'notistack';
import { type MRT_ColumnDef, type MRT_Row, type MRT_SortingState } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { useAutoScrollRef } from 'src/hooks/useAutoScrollRef';
import CustomStatusSwitch from '@/components/CustomSwitch';
import usePermissions from '@/hooks/usePermissions';
import ManagementTabs from '@/components/ManagementTabs';
import { useRoles } from '../../../roles/api/hooks/useRoles';
import { useAllPlans } from '../../../plans/api/hooks/usePlans';
import {
	useAdminSellers,
	useAdminStaffUsers,
	useAdminUpdateUser,
	useCancelPlanForUser,
	useCreateAdminUser,
	useCreateTeamUser,
	useTeamUsers
} from '../../api/hooks/useUsers';
import { User } from '../../api/services/usersApiService';
import { getErrorMessage } from '@/utils/errorMessage';
import AssignPlanDialog from '../dialogs/AssignPlanDialog';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.'-]+$/;
const PHONE_CHARS_REGEX = /^[+0-9\s()]+$/;

const Root = styled(FusePageCarded)(() => ({
	padding: '0!important',
	'& .container': {
		maxWidth: '100%!important',
		padding: '0!important'
	},
	'& .FusePageCarded-wrapper': {
		borderRadius: '0!important',
		boxShadow: 'none!important',
		margin: '0!important'
	},
	'& .FusePageCarded-header': {
		marginBottom: '0px'
	},
	'& .FusePageCarded-contentWrapper': {
		overflow: 'hidden!important',
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		minHeight: 0
	},
	'& .FusePageCarded-content': {
		display: 'flex',
		flexDirection: 'column',
		flex: '1 1 auto',
		minHeight: 0,
		height: '100%',
		overflow: 'hidden'
	}
}));

function roleLabel(user: User) {
	if (typeof user.role_id === 'object' && user.role_id) {
		return user.role_id.role_name || '—';
	}
	if (typeof user.role_id === 'string' && user.role_id) {
		return user.role_id;
	}
	if (user.userType) {
		return user.userType === 'seller' ? 'Seller' : user.userType;
	}
}

function TableCopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!text) return;
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<Tooltip title={copied ? 'Copied!' : 'Copy'} arrow>
			<button
				type="button"
				onClick={handleCopy}
				className="inline-flex items-center justify-center p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors text-black dark:text-gray-200"
			>
				<FuseSvgIcon size={13} sx={{ color: 'inherit' }}>
					{copied ? 'heroicons-outline:check-circle' : 'heroicons-outline:document-duplicate'}
				</FuseSvgIcon>
			</button>
		</Tooltip>
	);
}

// Custom Date Range Picker Component matching Orders
interface DateRangePickerProps {
	value: Record<string, Date | null>;
	onChange: (range: Record<string, Date | null>) => void;
	onClose: () => void;
}

function CustomDateRangePicker({ value, onChange, onClose }: DateRangePickerProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
	const [tempRange, setTempRange] = useState<Record<string, Date | null>>(value);

	useEffect(() => {
		setTempRange(value);
		if (value.from) {
			setCurrentMonth(value.from);
		}
	}, [value]);

	const handleDateClick = (date: Date) => {
		if (!tempRange.from || (tempRange.from && tempRange.to)) {
			setTempRange({ from: date, to: null });
		} else {
			if (isAfter(date, tempRange.from)) {
				setTempRange({ ...tempRange, to: date });
			} else {
				setTempRange({ from: date, to: tempRange.from });
			}
		}
	};

	const handleApply = () => {
		if (tempRange.from && tempRange.to) {
			onChange(tempRange);
			onClose();
		}
	};

	const handleCancel = () => {
		setTempRange(value);
		onClose();
	};

	const getDaysInMonth = () => {
		const start = startOfMonth(currentMonth);
		const end = endOfMonth(currentMonth);
		const days = eachDayOfInterval({ start, end });

		const startPadding = start.getDay();
		const endPadding = 6 - end.getDay();

		const startPaddingDays = Array.from({ length: startPadding }, (_, i) =>
			subDays(start, startPadding - i)
		);
		const endPaddingDays = Array.from({ length: endPadding }, (_, i) =>
			addDays(end, i + 1)
		);

		return [...startPaddingDays, ...days, ...endPaddingDays];
	};

	const isInRange = (date: Date) => {
		if (!tempRange.from) return false;
		if (!tempRange.to) return isSameDay(date, tempRange.from);
		return isWithinInterval(date, { start: tempRange.from, end: tempRange.to });
	};

	const isRangeStart = (date: Date) => (tempRange.from ? isSameDay(date, tempRange.from) : false);
	const isRangeEnd = (date: Date) => (tempRange.to ? isSameDay(date, tempRange.to) : false);
	const isInHoverRange = (date: Date) => {
		if (!tempRange.from || tempRange.to) return false;
		return hoveredDate ? isWithinInterval(date, { start: tempRange.from, end: hoveredDate }) : false;
	};

	const days = getDaysInMonth();

	return (
		<Paper sx={{ p: { xs: 1.5, sm: 2 }, minWidth: { xs: 280, sm: 320 }, maxWidth: '100%', boxSizing: 'border-box' }}>
			{/* Header */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
					<FuseSvgIcon>lucide:chevron-left</FuseSvgIcon>
				</IconButton>
				<Typography variant="subtitle1" fontWeight={600}>
					{format(currentMonth, 'MMMM yyyy')}
				</Typography>
				<IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
					<FuseSvgIcon>lucide:chevron-right</FuseSvgIcon>
				</IconButton>
			</Box>

			{/* Day Headers */}
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
				{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
					<Box
						key={day}
						sx={{
							textAlign: 'center',
							py: 1,
							fontSize: '0.75rem',
							fontWeight: 'bold',
							color: 'text.secondary'
						}}
					>
						{day}
					</Box>
				))}
			</Box>

			{/* Calendar Grid */}
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
				{days.map((date, index) => {
					const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
					const isSelected = isInRange(date);
					const isStart = isRangeStart(date);
					const isEnd = isRangeEnd(date);
					const isHoverRange = isInHoverRange(date);

					return (
						<Box
							key={index}
							onClick={() => handleDateClick(date)}
							onMouseEnter={() => setHoveredDate(date)}
							onMouseLeave={() => setHoveredDate(null)}
							sx={{
								aspectRatio: '1',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								fontSize: '0.875rem',
								fontWeight: isStart || isEnd ? 'bold' : 'normal',
								color: isCurrentMonth ? 'text.primary' : 'text.disabled',
								backgroundColor:
									isStart || isEnd
										? 'rgba(25, 118, 210, 0.15)'
										: isHoverRange
											? 'rgba(25, 118, 210, 0.08)'
											: isSelected
												? 'rgba(25, 118, 210, 0.05)'
												: 'transparent',
								borderRadius: isStart
									? '50% 0 0 50%'
									: isEnd
										? '0 50% 50% 0'
										: '0',
								'&:hover': {
									backgroundColor: isStart || isEnd ? 'primary.100' : 'action.hover'
								},
								border: isStart || isEnd ? '1px solid' : 'none',
								borderColor: 'primary.main'
							}}
						>
							{format(date, 'd')}
						</Box>
					);
				})}
			</Box>

			{/* Actions */}
			<Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
				<Button onClick={handleCancel} color="inherit" size="small">
					Cancel
				</Button>
				<Button
					onClick={handleApply}
					variant="contained"
					size="small"
					disabled={!tempRange.from || !tempRange.to}
				>
					Apply
				</Button>
			</Box>
		</Paper>
	);
}

export type UsersViewVariant = 'sellers' | 'admin-users' | 'team';

export type UsersViewProps = {
	variant: UsersViewVariant;
	managementTab?: 'members' | 'users';
};

function UsersAppView({ variant, managementTab }: UsersViewProps) {
	const {
		canView,
		canCreate,
		canUpdate,
		canDelete,
		isSuperAdmin,
		scope
	} = usePermissions();
	const { enqueueSnackbar } = useSnackbar();
	const autoScrollRef = useAutoScrollRef<HTMLDivElement>();

	const isTeamMode = variant === 'team';
	const isSellersMode = variant === 'sellers';
	const sectionKey =
		variant === 'team'
			? '/team/members'
			: variant === 'sellers'
				? '/sellers'
				: '/user-management/users';
	const hasAccess = canView(sectionKey);

	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
	const [globalFilter, setGlobalFilter] = useState('');
	const [sorting, setSorting] = useState<MRT_SortingState>([]);

	// Plan Filter State
	const { data: plansRes } = useAllPlans({ limit: 100, status: 1 }, hasAccess && isSellersMode);
	const allPlans = useMemo(() => {
		const raw = (plansRes as any)?.data;
		if (Array.isArray(raw)) return raw;
		if (Array.isArray((plansRes as any)?.results)) return (plansRes as any)?.results;
		return [];
	}, [plansRes]);
	const allPlanIds = useMemo(
		() => allPlans.map((p: any) => String(p.id || p._id)),
		[allPlans]
	);

	const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
	const [hasUserFilteredPlans, setHasUserFilteredPlans] = useState(false);

	useEffect(() => {
		if (allPlanIds.length > 0 && !hasUserFilteredPlans && selectedPlans.length === 0) {
			setSelectedPlans(allPlanIds);
		}
	}, [allPlanIds, hasUserFilteredPlans, selectedPlans.length]);

	// Date Range Filter State
	const [searchDate, setSearchDate] = useState<Record<string, Date | null>>({
		from: null,
		to: null
	});
	const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);

	const sortKey = sorting[0]?.id || 'createdAt';
	const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
	const sortBy = sorting.length > 0 ? `${sortKey}:${sortOrder}` : undefined;

	const isAllPlansSelected =
		!hasUserFilteredPlans ||
		selectedPlans.length === 0 ||
		(allPlanIds.length > 0 && selectedPlans.length === allPlanIds.length);
	const plansParam = isAllPlansSelected ? undefined : selectedPlans;

	const fromParam = searchDate.from ? searchDate.from.toISOString() : undefined;
	const toParam = searchDate.to ? searchDate.to.toISOString() : undefined;

	const listParams = {
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: globalFilter,
		sortBy,
		...(isSellersMode
			? {
				plans: plansParam,
				from: fromParam,
				to: toParam
			}
			: {})
	};

	const sellersQuery = useAdminSellers(listParams, hasAccess && isSellersMode);
	const adminStaffQuery = useAdminStaffUsers(
		listParams,
		hasAccess && variant === 'admin-users'
	);
	const teamQuery = useTeamUsers(listParams, hasAccess && isTeamMode);
	const activeQuery = isSellersMode
		? sellersQuery
		: isTeamMode
			? teamQuery
			: adminStaffQuery;

	// Only load roles when this user can manage users (assign roles) or view roles.
	const canLoadRoles =
		hasAccess &&
		(canView('roles') || canCreate(sectionKey) || canUpdate(sectionKey));
	const { data: rolesRes } = useRoles({ scope, limit: 100 }, canLoadRoles);
	const roles = rolesRes?.data || [];

	const updateMutation = useAdminUpdateUser();
	const createAdminMutation = useCreateAdminUser();
	const createTeamMutation = useCreateTeamUser();
	const cancelPlanMutation = useCancelPlanForUser();

	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	// Assign Plan Dialog state
	const [assignPlanOpen, setAssignPlanOpen] = useState(false);
	const [sellerForPlan, setSellerForPlan] = useState<User | null>(null);

	const handleOpenAssignPlan = useCallback((user: User) => {
		(document.activeElement as HTMLElement)?.blur();
		setSellerForPlan(user);
		setAssignPlanOpen(true);
	}, []);

	// Confirmation Dialog state
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		type: 'status' | 'delete' | 'cancelPlan';
		user: User | null;
		targetStatus?: number;
	}>({
		open: false,
		type: 'status',
		user: null
	});

	const handleOpenCancelPlan = useCallback((user: User) => {
		(document.activeElement as HTMLElement)?.blur();
		setConfirmState({
			open: true,
			type: 'cancelPlan',
			user
		});
	}, []);
	const [isActionLoading, setIsActionLoading] = useState(false);

	const [formName, setFormName] = useState('');
	const [formEmail, setFormEmail] = useState('');
	const [formPhone, setFormPhone] = useState('');
	const [formRoleId, setFormRoleId] = useState('');
	const [maxMarketplaces, setMaxMarketplaces] = useState(5);
	const [maxReviewRequestsPerMonth, setMaxReviewRequestsPerMonth] = useState(1000);
	const [editBusinessName, setEditBusinessName] = useState('');

	const [createErrors, setCreateErrors] = useState<{
		name?: string;
		email?: string;
		phone?: string;
		roleId?: string;
	}>({});

	const [editErrors, setEditErrors] = useState<{
		name?: string;
		phone?: string;
		roleId?: string;
		businessName?: string;
		maxMarketplaces?: string;
		maxReviewRequestsPerMonth?: string;
	}>({});

	const validateCreateUser = (
		nameVal: string,
		emailVal: string,
		phoneVal: string,
		roleVal: string
	) => {
		const errs: { name?: string; email?: string; phone?: string; roleId?: string } = {};

		const trimmedName = nameVal.trim();
		if (!trimmedName) {
			errs.name = 'Full name is required!';
		} else if (trimmedName.length < 2) {
			errs.name = 'Full name must be at least 2 characters.';
		} else if (trimmedName.length > 60) {
			errs.name = 'Full name cannot exceed 60 characters.';
		} else if (!NAME_REGEX.test(trimmedName)) {
			errs.name = 'Full name can only contain letters, spaces, hyphens, and apostrophes.';
		}

		const trimmedEmail = emailVal.trim();
		if (!trimmedEmail) {
			errs.email = 'Email address is required!';
		} else if (trimmedEmail.length > 100) {
			errs.email = 'Email address cannot exceed 100 characters.';
		} else if (!EMAIL_REGEX.test(trimmedEmail)) {
			errs.email = 'Please enter a valid email address.';
		}

		const trimmedPhone = phoneVal.trim();
		if (trimmedPhone) {
			const digitsOnly = trimmedPhone.replace(/\D/g, '');
			if (trimmedPhone.includes('-')) {
				errs.phone = 'Phone number cannot contain hyphens (-).';
			} else if (trimmedPhone.length > 20) {
				errs.phone = 'Phone number cannot exceed 20 characters.';
			} else if (!PHONE_CHARS_REGEX.test(trimmedPhone) || digitsOnly.length < 10 || digitsOnly.length > 20) {
				errs.phone = 'Please enter a valid phone number (between 10 and 20 digits).';
			}
		}

		// Role is only required for Admin Users and Team (not Sellers)
		if (!isSellersMode && !roleVal) {
			errs.roleId = 'Role is required!';
		}

		return errs;
	};

	const validateEditUser = (
		nameVal: string,
		phoneVal: string,
		roleVal: string,
		businessVal?: string
	) => {
		const errs: {
			name?: string;
			phone?: string;
			roleId?: string;
			businessName?: string;
			maxMarketplaces?: string;
			maxReviewRequestsPerMonth?: string;
		} = {};

		const trimmedName = nameVal.trim();
		if (!trimmedName) {
			errs.name = 'Full name is required!';
		} else if (trimmedName.length < 2) {
			errs.name = 'Full name must be at least 2 characters.';
		} else if (trimmedName.length > 60) {
			errs.name = 'Full name cannot exceed 60 characters.';
		} else if (!NAME_REGEX.test(trimmedName)) {
			errs.name = 'Full name can only contain letters, spaces, hyphens, and apostrophes.';
		}

		const trimmedPhone = phoneVal.trim();
		if (trimmedPhone) {
			const digitsOnly = trimmedPhone.replace(/\D/g, '');
			if (trimmedPhone.includes('-')) {
				errs.phone = 'Phone number cannot contain hyphens (-).';
			} else if (trimmedPhone.length > 20) {
				errs.phone = 'Phone number cannot exceed 20 characters.';
			} else if (!PHONE_CHARS_REGEX.test(trimmedPhone) || digitsOnly.length < 10 || digitsOnly.length > 20) {
				errs.phone = 'Please enter a valid phone number (between 10 and 20 digits).';
			}
		}

		if (isSellersMode) {
			if (businessVal !== undefined) {
				const trimmedBiz = businessVal.trim();
				if (trimmedBiz.length > 100) {
					errs.businessName = 'Brand name cannot exceed 100 characters.';
				}
			}
			if (isNaN(Number(maxMarketplaces)) || Number(maxMarketplaces) <= 0) {
				errs.maxMarketplaces = 'Must be greater than 0';
			}
			if (isNaN(Number(maxReviewRequestsPerMonth)) || Number(maxReviewRequestsPerMonth) <= 0) {
				errs.maxReviewRequestsPerMonth = 'Must be greater than 0';
			}
		}

		return errs;
	};

	useEffect(() => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}, [variant]);

	const users = useMemo(() => {
		if (Array.isArray(activeQuery.data?.data)) {
			return activeQuery.data.data;
		}
		if (Array.isArray((activeQuery.data as any)?.results)) {
			return (activeQuery.data as any).results;
		}
		return [];
	}, [activeQuery.data]);

	const totalResults = useMemo(() => {
		return (
			activeQuery.data?.pagination?.totalResults ??
			activeQuery.data?.pagination?.length ??
			activeQuery.data?.pagination?.total ??
			users.length
		);
	}, [activeQuery.data, users.length]);

	const totalPages = useMemo(() => {
		return (
			activeQuery.data?.pagination?.totalPages ||
			activeQuery.data?.pagination?.lastPage ||
			Math.ceil(totalResults / pagination.pageSize) ||
			1
		);
	}, [activeQuery.data, totalResults, pagination.pageSize]);

	const handleGlobalFilterChange = useCallback((updaterOrValue: any) => {
		setGlobalFilter((prev) => {
			const newVal = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
			return newVal;
		});
		setPagination((prev) => ({
			...prev,
			pageIndex: 0
		}));
	}, []);

	const handleSortingChange = useCallback((updaterOrValue: any) => {
		setSorting((prev) => {
			const newVal = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
			return newVal;
		});
		setPagination((prev) => ({
			...prev,
			pageIndex: 0
		}));
	}, []);

	const resetCreateForm = () => {
		setFormName('');
		setFormEmail('');
		setFormPhone('');
		setFormRoleId('');
		setCreateErrors({});
	};

	const handleCreate = async () => {
		const errs = validateCreateUser(formName, formEmail, formPhone, formRoleId);
		setCreateErrors(errs);
		if (Object.keys(errs).length > 0) {
			const firstError = Object.values(errs)[0];
			enqueueSnackbar(firstError, { variant: 'error' });
			return;
		}

		try {
			const payload: any = {
				name: formName.trim(),
				email: formEmail.trim(),
				contact_no: formPhone.trim(),
				...(formRoleId ? { role_id: formRoleId } : {})
			};
			if (isTeamMode) {
				await createTeamMutation.mutateAsync(payload);
			} else {
				await createAdminMutation.mutateAsync(payload);
			}
			enqueueSnackbar('User created successfully.', { variant: 'success' });
			setCreateOpen(false);
			resetCreateForm();
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, 'Failed to create user.');
			enqueueSnackbar(errMsg, {
				variant: 'error'
			});
		}
	};

	const handleOpenStatusConfirm = (user: User, currentStatus: number) => {
		setConfirmState({
			open: true,
			type: 'status',
			user,
			targetStatus: currentStatus === 1 ? 0 : 1
		});
	};

	const handleOpenDeleteConfirm = (user: User) => {
		(document.activeElement as HTMLElement)?.blur();
		setConfirmState({
			open: true,
			type: 'delete',
			user
		});
	};

	const handleConfirmAction = async () => {
		if (!confirmState.user) return;
		const userId = confirmState.user._id ?? confirmState.user.id;
		if (!userId) return;

		setIsActionLoading(true);
		try {
			if (confirmState.type === 'delete') {
				await updateMutation.mutateAsync({ userId, payload: { status: 2 } });
				enqueueSnackbar(`"${confirmState.user.name}" has been deleted successfully.`, {
					variant: 'success',
					autoHideDuration: 2000
				});
			} else if (confirmState.type === 'status' && confirmState.targetStatus !== undefined) {
				await updateMutation.mutateAsync({
					userId,
					payload: { status: confirmState.targetStatus }
				});
				enqueueSnackbar(
					`User status updated to ${confirmState.targetStatus === 1 ? 'Active' : 'Inactive'}.`,
					{ variant: 'success', autoHideDuration: 2000 }
				);
			} else if (confirmState.type === 'cancelPlan') {
				await cancelPlanMutation.mutateAsync({ userId });
				enqueueSnackbar(
					`Subscription plan for "${confirmState.user.name || confirmState.user.email}" has been cancelled.`,
					{ variant: 'success', autoHideDuration: 3000 }
				);
			}
			setConfirmState({ open: false, type: 'status', user: null });
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, 'Action failed. Please try again.');
			enqueueSnackbar(errMsg, { variant: 'error' });
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleOpenEdit = (user: User) => {
		(document.activeElement as HTMLElement)?.blur();
		setSelectedUser(user);
		setFormName(user.name || '');
		setFormPhone(user.contact_no || '');
		setFormRoleId(
			typeof user.role_id === 'object'
				? user.role_id?.id || user.role_id?._id || ''
				: user.role_id || ''
		);
		setMaxMarketplaces(user.planLimits?.maxMarketplaces ?? 5);
		setMaxReviewRequestsPerMonth(user.planLimits?.maxReviewRequestsPerMonth ?? 1000);
		setEditBusinessName(user.businessName ?? '');
		setEditOpen(true);
	};

	const handleSaveEdit = async () => {
		if (!selectedUser) return;
		const userId = selectedUser._id ?? selectedUser.id;
		if (!userId) return;

		const errs = validateEditUser(
			formName,
			formPhone,
			formRoleId,
			isSellersMode ? editBusinessName : undefined
		);
		setEditErrors(errs);
		if (Object.keys(errs).length > 0) {
			const firstError = Object.values(errs)[0];
			enqueueSnackbar(firstError, { variant: 'error' });
			return;
		}

		try {
			await updateMutation.mutateAsync({
				userId,
				payload: {
					name: formName.trim(),
					contact_no: formPhone.trim(),
					role_id: formRoleId || undefined,
					businessName: isSellersMode ? editBusinessName.trim() : undefined,
					planLimits: isSellersMode
						? {
							maxMarketplaces,
							maxReviewRequestsPerMonth
						}
						: undefined
				}
			});
			enqueueSnackbar('User updated successfully.', { variant: 'success' });
			setEditOpen(false);
			setEditErrors({});
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, 'Failed to update user.');
			enqueueSnackbar(errMsg, {
				variant: 'error'
			});
		}
	};

	const handleRefresh = useCallback(() => {
		setGlobalFilter('');
		setSorting([]);
		setPagination((prev) => ({
			...prev,
			pageIndex: 0
		}));
		setSearchDate({ from: null, to: null });
		setDateAnchorEl(null);
		setHasUserFilteredPlans(false);
		if (allPlanIds.length > 0) {
			setSelectedPlans(allPlanIds);
		} else {
			setSelectedPlans([]);
		}
		activeQuery.refetch();
	}, [activeQuery, allPlanIds]);

	const getPlanBadgeStyle = (planName?: string | null) => {
		const name = (planName || '').toLowerCase();
		if (name.includes('bronze') || name.includes('gold') || name.includes('basic')) {
			return {
				bg: (t: any) => (t.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)'),
				color: (t: any) => (t.palette.mode === 'dark' ? '#FBBF24' : '#B45309'),
				border: (t: any) => (t.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.28)')
			};
		}
		if (name.includes('growth') || name.includes('pro') || name.includes('vip')) {
			return {
				bg: (t: any) => (t.palette.mode === 'dark' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.08)'),
				color: (t: any) => (t.palette.mode === 'dark' ? '#C4B5FD' : '#7C3AED'),
				border: (t: any) => (t.palette.mode === 'dark' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(124, 58, 237, 0.25)')
			};
		}
		return {
			bg: (t: any) => (t.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.08)'),
			color: (t: any) => (t.palette.mode === 'dark' ? '#A5B4FC' : '#4F46E5'),
			border: (t: any) => (t.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.25)')
		};
	};

	const columns = useMemo<MRT_ColumnDef<User>[]>(() => {
		const base: MRT_ColumnDef<User>[] = [
			{
				accessorKey: 'createdAt',
				header: 'Date',
				size: 180,
				minSize: 170,
				Cell: ({ cell, row }) => {
					const val = (cell.getValue?.() as string) || row.original?.createdAt;
					const user = row.original;
					const isPaymentCancelled = user?.subscriptionStatus === 3 || user?.subscriptionStatus === 0;

					if (!val || !moment(val).isValid()) {
						return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					}
					const m = moment(val);
					return (
						<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
							{isSellersMode && (
								<Box
									sx={{
										width: 15,
										height: 15,
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0
									}}
								>
									{isPaymentCancelled ? (
										<Tooltip title="Payment Canceled" arrow>
											<Box
												component="span"
												sx={{
													display: 'inline-flex',
													alignItems: 'center',
													color: (t) => (t.palette.mode === 'dark' ? '#F87171' : '#DC2626'),
													cursor: 'help'
												}}
											>
												<FuseSvgIcon size={14} sx={{ color: 'inherit' }}>
													heroicons-outline:x-circle
												</FuseSvgIcon>
											</Box>
										</Tooltip>
									) : null}
								</Box>
							)}
							<Tooltip title={m.format('DD MMM YYYY, hh:mm:ss A')} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 400,
										color: (t) => (t.palette.mode === 'dark' ? '#94A3B8' : '#475569'),
										whiteSpace: 'nowrap'
									}}
								>
									{m.format('DD-MM-YYYY hh:mm A')}
								</Typography>
							</Tooltip>
						</Box>
					);
				}
			},
			{
				accessorKey: 'name',
				header: 'Name',
				size: 140,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>() || '—';

					return (
						<Box sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1.25, maxWidth: '100%' }}>
							<Tooltip title={val} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: !isSellersMode ? 500 : 400,
										color: !isSellersMode
											? (t) => (t.palette.mode === 'dark' ? '#FACC15' : '#CA8A04')
											: 'text.primary',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}}
								>
									{val}
								</Typography>
							</Tooltip>
						</Box>
					);
				}
			},
			{
				accessorKey: 'email',
				header: 'Email',
				size: 180,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					if (!val) return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;

					if (isSellersMode) {
						return (
							<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
								<Tooltip title={val} arrow>
									<Typography
										component="span"
										sx={{
											fontSize: 12,
											fontWeight: 400,
											lineHeight: 1.25,
											px: 0.75,
											py: 0.25,
											bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(147, 51, 234, 0.25)' : '#F3E8FF'),
											color: (t) => (t.palette.mode === 'dark' ? '#F3F4F6' : '#000000'),
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
											maxWidth: 220
										}}
									>
										{val}
									</Typography>
								</Tooltip>
								<TableCopyButton text={val} />
							</Box>
						);
					}

					return (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
							<Tooltip title={val} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 400,
										color: 'text.primary',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										maxWidth: 220
									}}
								>
									{val}
								</Typography>
							</Tooltip>
							<TableCopyButton text={val} />
						</Box>
					);
				}
			}
		];

		// Include Mobile Number for sellers right after email
		if (isSellersMode) {
			base.push({
				accessorKey: 'contact_no',
				header: 'Mobile',
				size: 140,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					if (!val) return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;

					return (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
							<Tooltip title={val} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 400,
										color: 'text.primary',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}}
								>
									{val}
								</Typography>
							</Tooltip>
							<TableCopyButton text={val} />
						</Box>
					);
				}
			});
		}

		// Role column: excluded for Sellers, but included for Admin Users & Team
		if (!isSellersMode) {
			base.push({
				id: 'role',
				header: 'Role',
				size: 130,
				enableSorting: true,
				accessorFn: (row) => roleLabel(row) || '',
				Cell: ({ row }) => {
					const rawLabel = roleLabel(row.original);
					const label = rawLabel !== '—' ? rawLabel : '—';

					if (!label || label === '—') {
						return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					}

					return (
						<Tooltip title={label} arrow>
							<Box sx={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}>
								<Typography
									component="span"
									sx={{
										fontSize: 12,
										fontWeight: 400,
										lineHeight: 1.25,
										px: 0.75,
										py: 0.25,
										bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(147, 51, 234, 0.25)' : '#F3E8FF'),
										color: (t) => (t.palette.mode === 'dark' ? '#F3F4F6' : '#000000'),
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}}
								>
									{label}
								</Typography>
							</Box>
						</Tooltip>
					);
				}
			});
		}

		if (isSellersMode) {
			base.push(
				{
					accessorKey: 'businessName',
					header: 'Brand',
					size: 160,
					minSize: 130,
					Cell: ({ cell }) => {
						const val = cell.getValue<string>();
						if (!val) {
							return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
						}
						return (
							<Tooltip title={val} arrow>
								<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}>
									<Typography
										component="span"
										sx={{
											fontSize: 12,
											fontWeight: 400,
											lineHeight: 1.25,
											px: 0.75,
											py: 0.25,
											bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(234, 179, 8, 0.25)' : '#FEF9C3'),
											color: (t) => (t.palette.mode === 'dark' ? '#F3F4F6' : '#000000'),
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap'
										}}
									>
										{val}
									</Typography>
									<TableCopyButton text={val} />
								</Box>
							</Tooltip>
						);
					}
				},
				{
					id: 'currentPlan',
					header: 'Plan',
					size: 130,
					enableSorting: true,
					accessorFn: (row) => {
						const isPaymentCancelled = row.subscriptionStatus === 3 || row.subscriptionStatus === 0;
						const activePlan = Array.isArray(row.plans) ? row.plans.find((p) => p.status === 1) : null;
						const queuedPlan = Array.isArray(row.plans) ? row.plans.find((p) => p.status === 4) : null;
						const cancelledPlan = Array.isArray(row.plans) ? row.plans[0] : null;
						const planName =
							activePlan?.name ||
							(typeof row.currentPlanId === 'object' ? (row.currentPlanId as any)?.name : null) ||
							(isPaymentCancelled ? (cancelledPlan?.name || 'Cancelled Plan') : null);
						return planName || queuedPlan?.name || (isPaymentCancelled ? 'Cancelled' : '');
					},
					Cell: ({ row }) => {
						const user = row.original;
						const isPaymentCancelled = user.subscriptionStatus === 3 || user.subscriptionStatus === 0;
						const activePlan = Array.isArray(user.plans) ? user.plans.find((p) => p.status === 1) : null;
						const queuedPlan = Array.isArray(user.plans) ? user.plans.find((p) => p.status === 4) : null;
						const cancelledPlan = Array.isArray(user.plans) ? user.plans[0] : null;
						const planName =
							activePlan?.name ||
							(typeof user.currentPlanId === 'object' ? user.currentPlanId?.name : null) ||
							(isPaymentCancelled ? (cancelledPlan?.name || 'Cancelled Plan') : null);

						const displayName = planName || queuedPlan?.name || (isPaymentCancelled ? 'Cancelled' : null);

						if (!displayName) {
							return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
						}

						return (
							<Tooltip title={displayName} arrow>
								<Typography
									component="span"
									sx={{
										fontSize: 12,
										fontWeight: 400,
										lineHeight: 1.25,
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										px: 1.25,
										py: 0.25,
										borderRadius: '9999px',
										bgcolor: isPaymentCancelled
											? (t) => (t.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2')
											: (t) => (t.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.25)' : '#E0E7FF'),
										color: isPaymentCancelled
											? (t) => (t.palette.mode === 'dark' ? '#FCA5A5' : '#B91C1C')
											: (t) => (t.palette.mode === 'dark' ? '#F3F4F6' : '#000000'),
										whiteSpace: 'nowrap'
									}}
								>
									{displayName}
								</Typography>
							</Tooltip>
						);
					}
				},
				{
					id: 'expireDate',
					header: 'Expire Date',
					size: 160,
					enableSorting: true,
					accessorFn: (row) => {
						const isPaymentCancelled = row.subscriptionStatus === 3 || row.subscriptionStatus === 0;
						if (isPaymentCancelled) return '';
						const activePlan = Array.isArray(row.plans) ? row.plans.find((p) => p.status === 1) : null;
						return activePlan?.expireAt ? new Date(activePlan.expireAt).getTime() : 0;
					},
					Cell: ({ row }) => {
						const user = row.original;
						const isPaymentCancelled = user.subscriptionStatus === 3 || user.subscriptionStatus === 0;
						const activePlan = Array.isArray(user.plans) ? user.plans.find((p) => p.status === 1) : null;
						const isExpired =
							!isPaymentCancelled &&
							(user.subscriptionStatus === 2 ||
								(activePlan?.expireAt && new Date(activePlan.expireAt).getTime() < Date.now()));

						const hasExpiry = Boolean(activePlan?.expireAt) && !isPaymentCancelled;

						if (isPaymentCancelled) {
							return (
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 400,
										color: (t) => (t.palette.mode === 'dark' ? '#F87171' : '#DC2626'),
										whiteSpace: 'nowrap'
									}}
								>
									Cancelled
								</Typography>
							);
						}

						if (isExpired) {
							return (
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 400,
										color: (t) => (t.palette.mode === 'dark' ? '#F87171' : '#DC2626'),
										whiteSpace: 'nowrap'
									}}
								>
									Expired
								</Typography>
							);
						}

						if (!hasExpiry) {
							return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
						}

						const m = moment(activePlan.expireAt);
						if (!m.isValid()) {
							return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
						}

						return (
							<Tooltip title={m.format('DD MMM YYYY, hh:mm:ss A')} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 400,
										color: (t) => (t.palette.mode === 'dark' ? '#94A3B8' : '#475569'),
										whiteSpace: 'nowrap'
									}}
								>
									{m.format('DD-MM-YYYY hh:mm A')}
								</Typography>
							</Tooltip>
						);
					}
				},
				{
					id: 'planLimits.maxMarketplaces',
					header: 'Markets',
					size: 85,
					minSize: 80,
					maxSize: 95,
					muiTableHeadCellProps: {
						sx: {
							width: '85px !important',
							maxWidth: '95px !important',
							whiteSpace: 'nowrap !important'
						}
					},
					muiTableBodyCellProps: {
						sx: {
							width: '85px !important',
							maxWidth: '95px !important'
						}
					},
					accessorFn: (row) => {
						const activePlan = Array.isArray(row.plans) ? row.plans.find((p) => p.status === 1) : null;
						return activePlan?.marketplace ?? row.planLimits?.maxMarketplaces ?? null;
					},
					Cell: ({ cell }) => {
						const val = cell.getValue<number>();
						if (val === null || val === undefined) {
							return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
						}
						return (
							<Tooltip title={`Max Marketplaces: ${val}`} arrow>
								<Typography
									component="span"
									sx={{
										fontSize: 12,
										fontWeight: 400,
										lineHeight: 1.25,
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										px: 1,
										py: 0.25,
										borderRadius: '4px',
										bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.25)' : '#BBF7D0'),
										color: (t) => (t.palette.mode === 'dark' ? '#86EFAC' : '#15803D'),
										minWidth: 24,
										whiteSpace: 'nowrap'
									}}
								>
									{val}
								</Typography>
							</Tooltip>
						);
					}
				},
				{
					id: 'planLimits.maxReviewRequestsPerMonth',
					header: 'Quota',
					size: 85,
					minSize: 80,
					maxSize: 95,
					muiTableHeadCellProps: {
						sx: {
							width: '85px !important',
							maxWidth: '95px !important',
							whiteSpace: 'nowrap !important'
						}
					},
					muiTableBodyCellProps: {
						sx: {
							width: '85px !important',
							maxWidth: '95px !important'
						}
					},
					accessorFn: (row) => {
						const activePlan = Array.isArray(row.plans) ? row.plans.find((p) => p.status === 1) : null;
						return activePlan?.request_quota ?? row.planLimits?.maxReviewRequestsPerMonth ?? null;
					},
					Cell: ({ cell }) => {
						const val = cell.getValue<number>();
						if (val === null || val === undefined) {
							return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
						}
						const numericVal = Number(val);
						return (
							<Tooltip title={`Monthly Request Quota: ${numericVal.toLocaleString()}`} arrow>
								<Typography
									component="span"
									sx={{
										fontSize: 12,
										fontWeight: 400,
										lineHeight: 1.25,
										display: 'inline-flex',
										alignItems: 'center',
										px: 0.75,
										py: 0.25,
										borderRadius: '3px',
										bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(234, 179, 8, 0.25)' : '#FEF9C3'),
										color: (t) => (t.palette.mode === 'dark' ? '#FEF08A' : '#713F12'),
										whiteSpace: 'nowrap'
									}}
								>
									{numericVal.toLocaleString()}
								</Typography>
							</Tooltip>
						);
					}
				},
				{
					id: 'planLimits.usedReviewRequests',
					header: 'Used',
					size: 85,
					minSize: 80,
					maxSize: 95,
					muiTableHeadCellProps: {
						sx: {
							width: '85px !important',
							maxWidth: '95px !important',
							whiteSpace: 'nowrap !important'
						}
					},
					muiTableBodyCellProps: {
						sx: {
							width: '85px !important',
							maxWidth: '95px !important'
						}
					},
					accessorFn: (row) => row.planLimits?.usedReviewRequests ?? (row as any).usedReviewRequests ?? 0,
					Cell: ({ cell, row }) => {
						const used = cell.getValue<number>() ?? 0;
						const activePlan = Array.isArray(row.original.plans) ? row.original.plans.find((p) => p.status === 1) : null;
						const quota = activePlan?.request_quota ?? row.original.planLimits?.maxReviewRequestsPerMonth ?? 0;
						const percent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

						return (
							<Tooltip
								title={`Requests Used: ${used.toLocaleString()} / ${quota > 0 ? quota.toLocaleString() : '—'} (${percent}%)`}
								arrow
							>
								<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
									<Typography
										sx={{
											fontSize: 12,
											fontWeight: 400,
											color: 'text.primary',
											lineHeight: 1.2
										}}
									>
										{used >= 1000 ? `${(used / 1000).toFixed(used % 1000 === 0 ? 0 : 1)}k` : used.toLocaleString()}
										{' / '}
										{quota > 0 ? (quota >= 1000 ? `${Math.round(quota / 1000)}k` : quota) : '—'}
									</Typography>
								</Box>
							</Tooltip>
						);
					}
				}
			);
		} else {
			base.push({
				accessorKey: 'contact_no',
				header: 'PHONE',
				size: 150,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					if (!val) {
						return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					}
					return (
						<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
							<Tooltip title={val} arrow>
								<Typography
									sx={{
										fontSize: 12,
										color: 'text.primary',
										fontWeight: 400,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}}
								>
									{val}
								</Typography>
							</Tooltip>
							<TableCopyButton text={val} />
						</Box>
					);
				}
			});
		}

		return base;
	}, [isSellersMode]);

	if (!hasAccess) {
		return (
			<AccessDeniedView
				sectionTitle={isSellersMode ? 'Sellers' : isTeamMode ? 'Team' : 'Admin Users'}
			/>
		);
	}

	const isManagement = !isSellersMode;
	const activeTabKey = managementTab || (isTeamMode ? 'members' : 'users');
	const title = isSellersMode
		? 'Sellers'
		: isTeamMode
			? 'Team'
			: 'Users';
	const icon = isSellersMode
		? 'lucide:store'
		: isTeamMode
			? 'lucide:users'
			: 'lucide:user-cog';
	const tabsNode = isManagement ? <ManagementTabs activeTab={activeTabKey} /> : undefined;

	const handlePlanChange = (event: { target: { value: string | string[] } }) => {
		const value = event.target.value;
		const newValue = typeof value === 'string' ? value.split(',') : value;

		setPagination((prev) => ({ ...prev, pageIndex: 0 }));

		if (newValue.includes('')) {
			const isCurrentlyAll =
				!hasUserFilteredPlans ||
				selectedPlans.length === 0 ||
				(allPlanIds.length > 0 && selectedPlans.length === allPlanIds.length);
			if (isCurrentlyAll) {
				setSelectedPlans([]);
				setHasUserFilteredPlans(true);
			} else {
				setSelectedPlans(allPlanIds);
				setHasUserFilteredPlans(false);
			}
		} else {
			const filtered = newValue.filter((id) => id !== '');
			setSelectedPlans(filtered);
			setHasUserFilteredPlans(true);
		}
	};

	const formatDateRange = () => {
		if (!searchDate.from && !searchDate.to) return 'Date Range';
		if (searchDate.from && searchDate.to) {
			return `${format(searchDate.from, 'MMM dd')} - ${format(searchDate.to, 'MMM dd, yyyy')}`;
		}
		if (searchDate.from) return `From ${format(searchDate.from, 'MMM dd, yyyy')}`;
		if (searchDate.to) return `Until ${format(searchDate.to, 'MMM dd, yyyy')}`;
		return 'Date Range';
	};

	const actionButtons = isSellersMode ? (
		<div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
			{/* Date Range Picker Trigger */}
			<div className="relative">
				<button
					type="button"
					onClick={(e) => setDateAnchorEl(dateAnchorEl ? null : e.currentTarget)}
					style={{ height: '38px', minHeight: '38px', maxHeight: '38px' }}
					className="h-[38px] flex items-center justify-between gap-2 px-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 outline-none hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs transition-colors shrink-0"
				>
					<div className="flex items-center gap-1.5">
						<FuseSvgIcon size={15} className="text-slate-500 dark:text-slate-400">
							heroicons-outline:calendar
						</FuseSvgIcon>
						<span className="text-slate-700 dark:text-slate-200">{formatDateRange()}</span>
					</div>
					<FuseSvgIcon size={14} className="text-slate-400">
						heroicons-outline:calendar-days
					</FuseSvgIcon>
				</button>

				<Popover
					open={Boolean(dateAnchorEl)}
					anchorEl={dateAnchorEl}
					onClose={() => setDateAnchorEl(null)}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'right'
					}}
					transformOrigin={{
						vertical: 'top',
						horizontal: 'right'
					}}
					slotProps={{
						paper: {
							sx: {
								mt: 1,
								boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
								borderRadius: '12px',
								overflow: 'hidden'
							}
						}
					}}
				>
					<CustomDateRangePicker
						value={searchDate}
						onChange={(range) => {
							setSearchDate(range);
							setDateAnchorEl(null);
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
						onClose={() => setDateAnchorEl(null)}
					/>
				</Popover>
			</div>

			{/* Plan Multi-Select Filter */}
			<FormControl
				size="small"
				className="min-w-[150px] bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
				sx={{
					height: '38px !important',
					minHeight: '38px !important',
					maxHeight: '38px !important',
					justifyContent: 'center',
					'& .MuiInputBase-root': {
						height: '38px !important',
						minHeight: '38px !important',
						maxHeight: '38px !important',
						borderRadius: '8px !important',
						backgroundColor: 'transparent !important',
						fontSize: '12px !important'
					},
					'& .MuiOutlinedInput-notchedOutline': {
						border: 'none !important'
					},
					'& .MuiSelect-select': {
						py: '0 !important',
						height: '38px !important',
						minHeight: '38px !important',
						maxHeight: '38px !important',
						lineHeight: '38px !important',
						display: 'flex !important',
						alignItems: 'center !important',
						fontSize: '12px !important',
						boxSizing: 'border-box !important'
					}
				}}
			>
				<Select
					value={
						!hasUserFilteredPlans || selectedPlans.length === 0
							? (allPlanIds.length > 0 ? allPlanIds : [])
							: selectedPlans
					}
					onChange={handlePlanChange}
					displayEmpty
					className="text-xs bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 border-0"
					sx={{
						height: '38px !important',
						borderRadius: '8px !important',
						'& .MuiOutlinedInput-notchedOutline': {
							border: 'none !important'
						},
						'& .MuiSelect-select': {
							py: '0 !important',
							height: '38px !important',
							display: 'flex !important',
							alignItems: 'center !important',
							fontSize: '12px !important'
						}
					}}
					MenuProps={{
						PaperProps: {
							sx: {
								maxHeight: 380,
								borderRadius: '12px',
								boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)'
							}
						}
					}}
					multiple
					renderValue={(selected: any) => {
						const current = Array.isArray(selected) ? selected : [];
						const isAll =
							!hasUserFilteredPlans ||
							current.length === 0 ||
							(allPlanIds.length > 0 && current.length === allPlanIds.length);
						if (isAll) {
							return (
								<span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 text-xs font-semibold">
									<FuseSvgIcon size={15} className="text-slate-600 dark:text-slate-300">
										heroicons-outline:sparkles
									</FuseSvgIcon>
									ALL PLANS
								</span>
							);
						}
						const selectedNames = current
							.map((id: string) => allPlans.find((p: any) => String(p.id || p._id) === String(id))?.name || id)
							.filter(Boolean);
						const label =
							selectedNames.length > 2
								? `${selectedNames.length} Plans`
								: selectedNames.join(', ');
						return (
							<span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 text-xs font-semibold truncate max-w-[150px]">
								<FuseSvgIcon size={15} className="text-slate-600 dark:text-slate-300 shrink-0">
									heroicons-outline:sparkles
								</FuseSvgIcon>
								<span className="truncate">{label}</span>
							</span>
						);
					}}
				>
					<MenuItem
						value=""
						sx={{
							py: 1,
							px: 2,
							minHeight: 38,
							'&:hover': {
								bgcolor: (t) =>
									t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'
							}
						}}
					>
						<Checkbox
							checked={
								!hasUserFilteredPlans ||
								selectedPlans.length === 0 ||
								(allPlanIds.length > 0 && selectedPlans.length === allPlanIds.length)
							}
							size="small"
							sx={{
								p: 0.5,
								mr: 1,
								color: '#94a3b8',
								'&.Mui-checked': { color: 'var(--color-primary-700, #0032ab)' }
							}}
						/>
						<em className="text-xs font-semibold not-italic text-slate-800 dark:text-slate-100">
							ALL PLANS
						</em>
					</MenuItem>
					{allPlans.map((plan: any) => {
						const planId = String(plan.id || plan._id);
						const isChecked =
							!hasUserFilteredPlans ||
							selectedPlans.length === 0 ||
							selectedPlans.includes(planId);
						return (
							<MenuItem
								key={planId}
								value={planId}
								sx={{
									py: 1,
									px: 2,
									minHeight: 38,
									'&:hover': {
										bgcolor: (t) =>
											t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'
									}
								}}
							>
								<Checkbox
									checked={isChecked}
									size="small"
									sx={{
										p: 0.5,
										mr: 1,
										color: '#94a3b8',
										'&.Mui-checked': { color: 'var(--color-primary-700, #0032ab)' }
									}}
								/>
								<span className="text-xs font-medium text-slate-700 dark:text-slate-200">
									{plan.name}
								</span>
							</MenuItem>
						);
					})}
				</Select>
			</FormControl>
		</div>
	) : !isSellersMode && canCreate(sectionKey) ? (
		<button
			type="button"
			onClick={() => {
				resetCreateForm();
				setCreateOpen(true);
			}}
			style={{ height: '38px' }}
			className="h-[38px] flex-1 sm:flex-initial px-3.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border-0"
		>
			<FuseSvgIcon size={16} className="text-white">
				heroicons-outline:plus
			</FuseSvgIcon>
			<span>Add User</span>
		</button>
	) : null;

	return (
		<Root
			content={
				<Paper
					ref={autoScrollRef}
					className="flex w-full flex-auto rounded-none mt-0"
					elevation={0}
					square
					sx={{
						borderRadius: '0px !important',
						boxShadow: 'none !important',
						display: 'flex',
						flexDirection: 'column',
						minHeight: 0,
						'& .MuiPaper-root': {
							display: 'flex',
							flexDirection: 'column',
							flex: '1 1 auto',
							minHeight: 0,
							height: '100%'
						}
					}}
				>
					<DataTable
						columns={columns}
						data={users}
						tableId={isSellersMode ? 'sellers-table-v6' : isTeamMode ? 'team-table-v2' : 'admin-users-table-v2'}
						title={title}
						icon={icon}
						tabs={tabsNode}
						actionButtons={actionButtons}
						onRefresh={handleRefresh}
						enableRowActions
						positionActionsColumn="last"
						displayColumnDefOptions={{
							'mrt-row-actions': {
								size: isSellersMode ? 190 : 115,
								minSize: isSellersMode ? 180 : 105,
								maxSize: isSellersMode ? 210 : 125,
								muiTableHeadCellProps: {
									className: 'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700',
									sx: {
										width: isSellersMode ? '190px !important' : '115px !important',
										minWidth: isSellersMode ? '180px !important' : '105px !important'
									}
								},
								muiTableBodyCellProps: {
									sx: {
										width: isSellersMode ? '190px !important' : '115px !important',
										minWidth: isSellersMode ? '180px !important' : '105px !important',
										px: '8px !important'
									}
								}
							}
						}}
						enableRowSelection={false}
						state={{
							isLoading: activeQuery.isLoading,
							pagination,
							globalFilter,
							sorting
						}}
						onPaginationChange={setPagination}
						onGlobalFilterChange={handleGlobalFilterChange}
						onSortingChange={handleSortingChange}
						manualPagination
						manualFiltering
						manualSorting
						rowCount={totalResults}
						pageCount={totalPages}
						muiTableBodyRowProps={({ row }: any) => {
							const user = row.original;
							const isPaymentCancelled = isSellersMode && (user?.subscriptionStatus === 3 || user?.subscriptionStatus === 0);

							const baseRowSx = {
								minHeight: '38px',
								height: '38px'
							};

							if (isSellersMode && isPaymentCancelled) {
								return {
									sx: {
										...baseRowSx,
										backgroundColor: (theme: any) =>
											theme.palette.mode === 'dark'
												? 'rgba(239, 68, 68, 0.16) !important'
												: '#FEF2F2 !important',
										'& td': {
											backgroundColor: (theme: any) =>
												theme.palette.mode === 'dark'
													? 'rgba(239, 68, 68, 0.16) !important'
													: '#FEF2F2 !important',
											borderColor: (theme: any) =>
												theme.palette.mode === 'dark'
													? 'rgba(239, 68, 68, 0.3) !important'
													: '#FECACA !important'
										},
										'&:hover, &:hover td': {
											backgroundColor: (theme: any) =>
												theme.palette.mode === 'dark'
													? 'rgba(239, 68, 68, 0.25) !important'
													: '#FEE2E2 !important'
										}
									}
								};
							}
							return {
								sx: {
									...baseRowSx,
									'&:hover, &:hover td, &:hover td:before': {
										backgroundColor: (theme: any) =>
											theme.palette.mode === 'dark'
												? '#1f2937 !important'
												: '#f3f4f6 !important'
									},
									'&:hover td:after': {
										backgroundColor: 'transparent !important'
									}
								}
							};
						}}
						muiTableProps={{
							sx: {
								tableLayout: 'auto',
								minWidth: { xs: isSellersMode ? '1080px' : '880px', lg: '100%' },
								'& .MuiTableCell-root': {
									borderBottom: '1px solid',
									borderColor: 'divider',
									padding: '6px 10px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									maxWidth: '100%'
								},
								'& .MuiTableHead-root, & .MuiTableHead-root .MuiTableCell-root': {
									fontWeight: 600,
									fontSize: 12,
									letterSpacing: 'normal',
									textTransform: 'none',
									whiteSpace: 'nowrap !important',
									overflow: 'visible !important',
									textOverflow: 'clip !important',
									wordBreak: 'normal',
									padding: '8px 10px',
									textAlign: 'left',
									'& .MuiTableSortLabel-root': {
										overflow: 'visible !important',
										textOverflow: 'clip !important',
										whiteSpace: 'nowrap !important'
									},
									'& .Mui-TableHeadCell-Content': {
										overflow: 'visible !important',
										whiteSpace: 'nowrap !important'
									},
									'& .Mui-TableHeadCell-Content-Labels': {
										overflow: 'visible !important',
										whiteSpace: 'nowrap !important'
									}
								}
							}
						}}
						muiTableHeadProps={{
							className: 'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700'
						}}
						muiTableHeadRowProps={{
							className: 'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700'
						}}
						muiTableHeadCellProps={{
							className: 'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700'
						}}
						muiBottomToolbarProps={{
							className:
								'flex flex-row items-center justify-end min-h-[46px] h-[46px] py-0 px-2 sm:px-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-x-auto',
							sx: {
								backgroundColor: (theme: any) =>
									theme.palette?.mode === 'dark' ? '#1f2937' : '#f3f4f6',
								borderTop: '1px solid',
								borderColor: (theme: any) =>
									theme.palette?.mode === 'dark' ? '#374151' : '#e5e7eb',
								flexShrink: 0,
								marginTop: 'auto',
								position: 'sticky',
								bottom: 0,
								zIndex: 2,
								minHeight: '46px !important',
								height: '46px !important',
								display: 'flex',
								alignItems: 'center',
								justifyContent: { xs: 'center', sm: 'flex-end' },
								'& .MuiTablePagination-root': {
									overflow: 'visible',
									width: 'auto',
									minHeight: '46px !important',
									height: '46px !important',
									display: 'flex',
									alignItems: 'center'
								},
								'& .MuiTablePagination-toolbar': {
									flexWrap: 'nowrap',
									alignItems: 'center',
									justifyContent: { xs: 'center', sm: 'flex-end' },
									gap: { xs: 0.5, sm: 1 },
									minHeight: '46px !important',
									height: '46px !important',
									paddingLeft: { xs: 1, sm: 2 },
									paddingRight: { xs: 1, sm: 2 },
									py: '0 !important',
									my: 'auto'
								},
								'& .MuiTablePagination-selectLabel': {
									fontSize: { xs: '11px', sm: '13px' },
									margin: '0 !important',
									lineHeight: '1.2 !important',
									display: 'inline-flex',
									alignItems: 'center'
								},
								'& .MuiTablePagination-displayedRows': {
									fontSize: { xs: '11px', sm: '13px' },
									margin: '0 !important'
								},
								'& .MuiTablePagination-input': {
									marginRight: { xs: 0.5, sm: 1 },
									marginLeft: 0.5,
									display: 'inline-flex',
									alignItems: 'center',
									'& .MuiSelect-select': {
										paddingTop: '3px !important',
										paddingBottom: '3px !important',
										fontSize: { xs: '11px', sm: '13px' },
										display: 'inline-flex',
										alignItems: 'center'
									}
								},
								'& .MuiTablePagination-actions': {
									marginLeft: { xs: 0.5, sm: 1 },
									display: 'inline-flex',
									alignItems: 'center',
									'& .MuiIconButton-root': {
										padding: '4px'
									}
								},
								'& .MuiPagination-root': {
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center'
								},
								'& .MuiPaginationItem-root': {
									minWidth: { xs: 26, sm: 30 },
									height: { xs: 26, sm: 30 },
									fontSize: { xs: 12, sm: 13 },
									padding: { xs: '0 3px', sm: '0 6px' },
									margin: '0 1px',
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center'
								}
							}
						}}
						muiTableContainerProps={{
							className: 'flex-auto custom-table-scrollbar',
							sx: {
								maxWidth: '100%',
								width: '100%',
								flex: '1 1 auto',
								minHeight: 0,
								overflowX: 'auto',
								overflowY: 'auto',
								WebkitOverflowScrolling: 'touch',
								scrollbarWidth: 'thin',
								scrollbarColor: '#94a3b8 #f1f5f9',
								'&::-webkit-scrollbar': { height: 6, width: 6 },
								'&::-webkit-scrollbar-track': {
									backgroundColor: (theme: any) =>
										theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
									borderRadius: 9999
								},
								'&::-webkit-scrollbar-thumb': {
									backgroundColor: '#94a3b8',
									borderRadius: 9999,
									border: (theme: any) =>
										theme.palette.mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
									'&:hover': {
										backgroundColor: '#64748b'
									}
								}
							}
						}}
						renderRowActions={({ row }: { row: MRT_Row<User> }) => {
							const user = row.original;
							const isPaymentCancelled = isSellersMode && (user.subscriptionStatus === 3 || user.subscriptionStatus === 0);

							return (
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap', minWidth: 'max-content' }}>
									{canUpdate(sectionKey) && (
										<>
											<Tooltip
												title={
													isPaymentCancelled
														? 'Payment Cancelled (Inactive Seller)'
														: row.original.status === 1
															? 'Click to deactivate user'
															: 'Click to activate user'
												}
												arrow
											>
												<Box
													onClick={() => {
														if (isPaymentCancelled) return;
														handleOpenStatusConfirm(row.original, row.original.status);
													}}
													className={`${isPaymentCancelled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} inline-flex items-center p-0.5`}
													sx={{ lineHeight: 0 }}
												>
													<CustomStatusSwitch
														size="small"
														checked={!isPaymentCancelled && row.original.status === 1}
														sx={{ pointerEvents: 'none' }}
													/>
												</Box>
											</Tooltip>
											{isSellersMode && (
												<>
													<Tooltip title="Assign Plan" arrow>
														<IconButton
															size="small"
															onClick={(e) => {
																(e.currentTarget as HTMLElement)?.blur();
																handleOpenAssignPlan(row.original);
															}}
															sx={{
																p: 0.6,
																borderRadius: '6px',
																color: (t) => (t.palette.mode === 'dark' ? '#34D399' : '#059669'),
																'&:hover': {
																	bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
																}
															}}
														>
															<FuseSvgIcon size={16}>heroicons-outline:credit-card</FuseSvgIcon>
														</IconButton>
													</Tooltip>
													<Tooltip title="Cancel Plan" arrow>
														<IconButton
															size="small"
															onClick={(e) => {
																(e.currentTarget as HTMLElement)?.blur();
																handleOpenCancelPlan(row.original);
															}}
															sx={{
																p: 0.6,
																borderRadius: '6px',
																color: (t) => (t.palette.mode === 'dark' ? '#F87171' : '#DC2626'),
																'&:hover': {
																	bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
																}
															}}
														>
															<FuseSvgIcon size={16}>heroicons-outline:x-circle</FuseSvgIcon>
														</IconButton>
													</Tooltip>
												</>
											)}
											<Tooltip title="Edit user" arrow>
												<IconButton
													size="small"
													onClick={(e) => {
														(e.currentTarget as HTMLElement)?.blur();
														handleOpenEdit(row.original);
													}}
													sx={{
														p: 0.6,
														borderRadius: '6px',
														color: 'text.secondary',
														'&:hover': {
															color: 'text.primary',
															bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
														}
													}}
												>
													<FuseSvgIcon size={16}>heroicons-outline:pencil-square</FuseSvgIcon>
												</IconButton>
											</Tooltip>
										</>
									)}
									{canDelete(sectionKey) && (
										<Tooltip title="Delete user" arrow>
											<IconButton
												size="small"
												onClick={(e) => {
													(e.currentTarget as HTMLElement)?.blur();
													handleOpenDeleteConfirm(row.original);
												}}
												sx={{
													p: 0.6,
													borderRadius: '6px',
													color: (t) => t.palette.mode === 'dark' ? '#F87171' : '#DC2626',
													'&:hover': {
														bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'
													}
												}}
											>
												<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
											</IconButton>
										</Tooltip>
									)}
								</Box>
							);
						}}
					/>

					{/* Create User Dialog */}
					<Dialog
						open={createOpen}
						onClose={() => setCreateOpen(false)}
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
						<div className="flex flex-col h-full min-h-0 overflow-hidden">
							{/* Top Banner Header */}
							<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
										<FuseSvgIcon size={18} className="text-primary">
											{isTeamMode ? 'heroicons-outline:user-group' : 'heroicons-outline:user-plus'}
										</FuseSvgIcon>
									</div>
									<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0 truncate">
										{isTeamMode ? 'Create Team Member' : 'Create Admin User'}
									</h2>
								</div>

								<IconButton
									size="small"
									onClick={() => setCreateOpen(false)}
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
								<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
									<div>
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Full Name <span className="text-red-500">*</span>
										</label>
										<TextField
											fullWidth
											required
											placeholder="e.g., Alex Wright"
											value={formName}
											onChange={(e) => {
												setFormName(e.target.value);
												if (createErrors.name) setCreateErrors((prev) => ({ ...prev, name: undefined }));
											}}
											onBlur={() => {
												const errs = validateCreateUser(formName, formEmail, formPhone, formRoleId);
												setCreateErrors((prev) => ({ ...prev, name: errs.name }));
											}}
											error={!!createErrors.name}
											helperText={createErrors.name}
											variant="outlined"
											size="small"
											inputProps={{ maxLength: 60 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<FuseSvgIcon size={16} className="text-gray-400">
															heroicons-outline:user
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>

									<div>
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Email Address <span className="text-red-500">*</span>
										</label>
										<TextField
											fullWidth
											required
											type="email"
											placeholder="e.g., alex@gravurtastisch.de"
											value={formEmail}
											onChange={(e) => {
												setFormEmail(e.target.value);
												if (createErrors.email) setCreateErrors((prev) => ({ ...prev, email: undefined }));
											}}
											onBlur={() => {
												const errs = validateCreateUser(formName, formEmail, formPhone, formRoleId);
												setCreateErrors((prev) => ({ ...prev, email: errs.email }));
											}}
											error={!!createErrors.email}
											helperText={createErrors.email}
											variant="outlined"
											size="small"
											inputProps={{ maxLength: 100 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<FuseSvgIcon size={16} className="text-gray-400">
															heroicons-outline:envelope
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>

									<div>
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Phone Number
										</label>
										<TextField
											fullWidth
											placeholder="e.g., +49 151 2345001"
											value={formPhone}
											onKeyDown={(e) => {
												if (e.key === '-') {
													e.preventDefault();
												}
											}}
											onChange={(e) => {
												const raw = e.target.value;
												if (raw.includes('-')) {
													const cleaned = raw.replace(/-/g, '');
													setFormPhone(cleaned);
													setCreateErrors((prev) => ({ ...prev, phone: 'Phone number cannot contain hyphens (-).' }));
												} else {
													setFormPhone(raw);
													if (createErrors.phone) setCreateErrors((prev) => ({ ...prev, phone: undefined }));
												}
											}}
											onBlur={() => {
												const errs = validateCreateUser(formName, formEmail, formPhone, formRoleId);
												setCreateErrors((prev) => ({ ...prev, phone: errs.phone }));
											}}
											error={!!createErrors.phone}
											helperText={createErrors.phone}
											variant="outlined"
											size="small"
											inputProps={{ maxLength: 20 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<FuseSvgIcon size={16} className="text-gray-400">
															heroicons-outline:phone
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>

									{!isSellersMode && (
										<div>
											<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
												Role <span className="text-red-500">*</span>
											</label>
											<FormControl fullWidth size="small" required error={!!createErrors.roleId}>
												<Select
													value={formRoleId}
													onChange={(e) => {
														setFormRoleId(String(e.target.value));
														if (createErrors.roleId) setCreateErrors((prev) => ({ ...prev, roleId: undefined }));
													}}
													displayEmpty
													renderValue={(selected) => {
														if (!selected) {
															return <span className="text-gray-400 text-xs sm:text-sm">Select a role...</span>;
														}
														const roleObj = roles.find((r) => (r.id || r._id) === selected);
														return <span className="text-gray-800 text-xs sm:text-sm font-semibold">{roleObj?.role_name || selected}</span>;
													}}
													startAdornment={
														<InputAdornment position="start">
															<FuseSvgIcon size={16} className="text-gray-400">
																heroicons-outline:shield-check
															</FuseSvgIcon>
														</InputAdornment>
													}
												>
													{roles.map((role) => {
														const id = role.id || role._id || '';
														return (
															<MenuItem key={id} value={id}>
																<span className="text-xs sm:text-sm">{role.role_name}</span>
															</MenuItem>
														);
													})}
												</Select>
												{createErrors.roleId && (
													<Typography variant="caption" color="error" className="mt-1">
														{createErrors.roleId}
													</Typography>
												)}
											</FormControl>
											{!roles.length && (
												<Typography variant="body2" className="text-amber-600 text-xs mt-1.5 flex items-center gap-1">
													<FuseSvgIcon size={14}>heroicons-outline:exclamation-triangle</FuseSvgIcon>
													Create a role first before adding users.
												</Typography>
											)}
										</div>
									)}
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
									onClick={() => setCreateOpen(false)}
									className="capitalize text-slate-700 hover:bg-slate-100 rounded-xl px-4 sm:px-5 py-2 border border-slate-300 font-semibold text-xs sm:text-sm"
									sx={{
										borderRadius: '12px',
										textTransform: 'capitalize'
									}}
								>
									Cancel
								</Button>
								<Button
									variant="contained"
									onClick={handleCreate}
									disabled={!roles.length}
									className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl px-5 sm:px-7 py-2 shadow-xs transition-all capitalize text-xs sm:text-sm disabled:opacity-50"
									startIcon={<FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>}
									sx={{
										bgcolor: 'primary.main',
										'&:hover': { bgcolor: 'primary.dark' },
										borderRadius: '12px',
										textTransform: 'capitalize',
										px: { xs: 2.5, sm: 3.5 },
										py: 1
									}}
								>
									Create User
								</Button>
							</DialogActions>
						</div>
					</Dialog>

					{/* Edit User Dialog */}
					<Dialog
						open={editOpen}
						onClose={() => setEditOpen(false)}
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
						<div className="flex flex-col h-full min-h-0 overflow-hidden">
							{/* Top Banner Header */}
							<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
										<FuseSvgIcon size={18} className="text-primary">
											heroicons-outline:pencil-square
										</FuseSvgIcon>
									</div>
									<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0 truncate">
										Edit User
									</h2>
								</div>

								<IconButton
									size="small"
									onClick={() => setEditOpen(false)}
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
								<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
									<div>
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Full Name <span className="text-red-500">*</span>
										</label>
										<TextField
											fullWidth
											required
											placeholder="Full Name"
											value={formName}
											onChange={(e) => {
												setFormName(e.target.value);
												if (editErrors.name) setEditErrors((prev) => ({ ...prev, name: undefined }));
											}}
											error={!!editErrors.name}
											helperText={editErrors.name}
											variant="outlined"
											size="small"
											inputProps={{ maxLength: 60 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<FuseSvgIcon size={16} className="text-gray-400">
															heroicons-outline:user
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>

									<div>
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Phone Number
										</label>
										<TextField
											fullWidth
											placeholder="Phone Number"
											value={formPhone}
											onKeyDown={(e) => {
												if (e.key === '-') {
													e.preventDefault();
												}
											}}
											onChange={(e) => {
												const raw = e.target.value;
												if (raw.includes('-')) {
													const cleaned = raw.replace(/-/g, '');
													setFormPhone(cleaned);
													setEditErrors((prev) => ({ ...prev, phone: 'Phone number cannot contain hyphens (-).' }));
												} else {
													setFormPhone(raw);
													if (editErrors.phone) setEditErrors((prev) => ({ ...prev, phone: undefined }));
												}
											}}
											onBlur={() => {
												const errs = validateEditUser(
													formName,
													formPhone,
													formRoleId,
													isSellersMode ? editBusinessName : undefined
												);
												setEditErrors((prev) => ({ ...prev, phone: errs.phone }));
											}}
											error={!!editErrors.phone}
											helperText={editErrors.phone}
											variant="outlined"
											size="small"
											inputProps={{ maxLength: 20 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<FuseSvgIcon size={16} className="text-gray-400">
															heroicons-outline:phone
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>

									{!isSellersMode && (
										<div>
											<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
												Role
											</label>
											<FormControl fullWidth size="small">
												<Select
													value={formRoleId}
													onChange={(e) => {
														setFormRoleId(String(e.target.value));
														if (editErrors.roleId) setEditErrors((prev) => ({ ...prev, roleId: undefined }));
													}}
													displayEmpty
													renderValue={(selected) => {
														if (!selected) {
															return <span className="text-gray-400 text-xs sm:text-sm">Select a role...</span>;
														}
														const roleObj = roles.find((r) => (r.id || r._id) === selected);
														return <span className="text-gray-800 text-xs sm:text-sm font-semibold">{roleObj?.role_name || selected}</span>;
													}}
													startAdornment={
														<InputAdornment position="start">
															<FuseSvgIcon size={16} className="text-gray-400">
																heroicons-outline:shield-check
															</FuseSvgIcon>
														</InputAdornment>
													}
												>
													{roles.map((role) => {
														const id = role.id || role._id || '';
														return (
															<MenuItem key={id} value={id}>
																<span className="text-xs sm:text-sm">{role.role_name}</span>
															</MenuItem>
														);
													})}
												</Select>
											</FormControl>
										</div>
									)}

									{isSellersMode && (
										<>
											<div>
												<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
													Brand Name
												</label>
												<TextField
													placeholder="Brand Name"
													value={editBusinessName}
													onChange={(e) => {
														setEditBusinessName(e.target.value);
														if (editErrors.businessName) setEditErrors((prev) => ({ ...prev, businessName: undefined }));
													}}
													error={!!editErrors.businessName}
													helperText={editErrors.businessName}
													fullWidth
													variant="outlined"
													size="small"
													inputProps={{ maxLength: 100 }}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-gray-400">
																	heroicons-outline:building-storefront
																</FuseSvgIcon>
															</InputAdornment>
														)
													}}
												/>
											</div>

											{(isSuperAdmin || selectedUser?.userType === 'seller') && (
												<>
													<div>
														<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
															Maximum Active Marketplaces
														</label>
														<TextField
															type="number"
															fullWidth
															variant="outlined"
															size="small"
															inputProps={{ min: 1 }}
															value={maxMarketplaces}
															onKeyDown={(e) => {
																if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') {
																	e.preventDefault();
																}
															}}
															onChange={(e) => {
																const val = e.target.value;
																const num = Number(val);
																setMaxMarketplaces(num);
																if (val !== '' && (isNaN(num) || num <= 0)) {
																	setEditErrors((prev) => ({ ...prev, maxMarketplaces: 'Must be greater than 0' }));
																} else {
																	setEditErrors((prev) => ({ ...prev, maxMarketplaces: undefined }));
																}
															}}
															onWheel={(e) => (e.target as HTMLElement).blur()}
															error={!!editErrors.maxMarketplaces}
															helperText={editErrors.maxMarketplaces}
															InputProps={{
																startAdornment: (
																	<InputAdornment position="start">
																		<FuseSvgIcon size={16} className="text-gray-400">
																			heroicons-outline:cube
																		</FuseSvgIcon>
																	</InputAdornment>
																)
															}}
														/>
													</div>

													<div>
														<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
															Monthly Review Request Quota
														</label>
														<TextField
															type="number"
															fullWidth
															variant="outlined"
															size="small"
															inputProps={{ min: 1 }}
															value={maxReviewRequestsPerMonth}
															onKeyDown={(e) => {
																if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') {
																	e.preventDefault();
																}
															}}
															onChange={(e) => {
																const val = e.target.value;
																const num = Number(val);
																setMaxReviewRequestsPerMonth(num);
																if (val !== '' && (isNaN(num) || num <= 0)) {
																	setEditErrors((prev) => ({ ...prev, maxReviewRequestsPerMonth: 'Must be greater than 0' }));
																} else {
																	setEditErrors((prev) => ({ ...prev, maxReviewRequestsPerMonth: undefined }));
																}
															}}
															onWheel={(e) => (e.target as HTMLElement).blur()}
															error={!!editErrors.maxReviewRequestsPerMonth}
															helperText={editErrors.maxReviewRequestsPerMonth}
															InputProps={{
																startAdornment: (
																	<InputAdornment position="start">
																		<FuseSvgIcon size={16} className="text-gray-400">
																			heroicons-outline:envelope
																		</FuseSvgIcon>
																	</InputAdornment>
																)
															}}
														/>
													</div>
												</>
											)}
										</>
									)}
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
									onClick={() => setEditOpen(false)}
									className="capitalize text-slate-700 hover:bg-slate-100 rounded-xl px-4 sm:px-5 py-2 border border-slate-300 font-semibold text-xs sm:text-sm"
									sx={{
										borderRadius: '12px',
										textTransform: 'capitalize'
									}}
								>
									Cancel
								</Button>
								<Button
									variant="contained"
									onClick={handleSaveEdit}
									className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl px-5 sm:px-7 py-2 shadow-xs transition-all capitalize text-xs sm:text-sm"
									startIcon={<FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>}
									sx={{
										bgcolor: 'primary.main',
										'&:hover': { bgcolor: 'primary.dark' },
										borderRadius: '12px',
										textTransform: 'capitalize',
										px: { xs: 2.5, sm: 3.5 },
										py: 1
									}}
								>
									Save Changes
								</Button>
							</DialogActions>
						</div>
					</Dialog>

					{/* Custom Confirmation Dialog for User Status Change & Delete */}
					<Dialog
						open={confirmState.open}
						onClose={() => !isActionLoading && setConfirmState((prev) => ({ ...prev, open: false }))}
						disableRestoreFocus
						maxWidth="xs"
						fullWidth
						PaperProps={{
							sx: {
								borderRadius: '16px',
								overflow: 'hidden',
								p: 0,
								boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
							}
						}}
					>
						<div className="p-6 pb-5 bg-white flex items-start justify-between gap-4">
							<div className="flex items-start gap-3.5">
								<div
									className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${confirmState.type === 'delete' || confirmState.type === 'cancelPlan' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'
										}`}
								>
									<FuseSvgIcon size={24} className={confirmState.type === 'delete' || confirmState.type === 'cancelPlan' ? 'text-red-500' : 'text-amber-500'}>
										{confirmState.type === 'delete' ? 'heroicons-outline:trash' : confirmState.type === 'cancelPlan' ? 'heroicons-outline:x-circle' : 'heroicons-outline:exclamation-triangle'}
									</FuseSvgIcon>
								</div>
								<div className="flex flex-col">
									<h3 className="text-base font-bold text-slate-800 m-0">
										{confirmState.type === 'delete' ? 'Delete User' : confirmState.type === 'cancelPlan' ? 'Cancel Subscription Plan' : 'Change User Status'}
									</h3>
									<p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed m-0">
										{confirmState.type === 'delete' ? (
											<>
												Are you sure you want to delete{' '}
												<strong className="text-slate-800 font-semibold">{confirmState.user?.name}</strong>? This action cannot be undone.
											</>
										) : confirmState.type === 'cancelPlan' ? (
											<>
												Are you sure you want to cancel the subscription plan for{' '}
												<strong className="text-slate-800 font-semibold">{confirmState.user?.name || confirmState.user?.email}</strong>?
												The seller will no longer be able to use marketplaces or send review requests until a new plan is assigned.
											</>
										) : (
											<>
												Are you sure you want to change status of{' '}
												<strong className="text-slate-800 font-semibold">{confirmState.user?.name}</strong> to{' '}
												<strong className="text-slate-800 font-semibold">
													{confirmState.targetStatus === 1 ? 'Active' : 'Inactive'}
												</strong>
												?
											</>
										)}
									</p>
								</div>
							</div>
							<IconButton
								size="small"
								onClick={() => !isActionLoading && setConfirmState((prev) => ({ ...prev, open: false }))}
								className="text-slate-400 hover:text-slate-600 -mt-1 -mr-1"
							>
								<FuseSvgIcon size={18}>heroicons-outline:x-mark</FuseSvgIcon>
							</IconButton>
						</div>

						<div className="bg-slate-50/70 px-6 py-3.5 flex items-center justify-end gap-3 border-t border-slate-100">
							<button
								type="button"
								onClick={() => setConfirmState((prev) => ({ ...prev, open: false }))}
								disabled={isActionLoading}
								className="h-9 px-5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleConfirmAction}
								disabled={isActionLoading}
								className={`h-9 px-5 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs border-0 flex items-center gap-1.5 text-white ${confirmState.type === 'delete' || confirmState.type === 'cancelPlan'
									? 'bg-red-600 hover:bg-red-700'
									: 'bg-primary-800 hover:bg-primary-900'
									}`}
							>
								{isActionLoading && <CircularProgress size={14} color="inherit" />}
								<span>{confirmState.type === 'delete' ? 'Delete' : confirmState.type === 'cancelPlan' ? 'Cancel Plan' : 'Change Status'}</span>
							</button>
						</div>
					</Dialog>

					{/* Assign Plan Dialog */}
					<AssignPlanDialog
						open={assignPlanOpen}
						onClose={() => {
							setAssignPlanOpen(false);
							setSellerForPlan(null);
						}}
						user={sellerForPlan}
					/>
				</Paper>
			}
			scroll="content"
		/>
	);
}

export default UsersAppView;
