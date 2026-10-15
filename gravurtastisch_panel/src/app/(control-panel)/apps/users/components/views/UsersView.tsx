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
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputAdornment,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { type MRT_ColumnDef, type MRT_Row, type MRT_SortingState } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { useAutoScrollRef } from 'src/hooks/useAutoScrollRef';
import CustomStatusSwitch from '@/components/CustomSwitch';
import usePermissions from '@/hooks/usePermissions';
import { useRoles } from '../../../roles/api/hooks/useRoles';
import {
	useAdminSellers,
	useAdminStaffUsers,
	useAdminUpdateUser,
	useCreateAdminUser,
	useCreateTeamUser,
	useTeamUsers
} from '../../api/hooks/useUsers';
import { User } from '../../api/services/usersApiService';
import { getErrorMessage } from '@/utils/errorMessage';
import AssignPlanDialog from '../dialogs/AssignPlanDialog';

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
	return '—';
}

export type UsersViewVariant = 'sellers' | 'admin-users' | 'team';

function UsersHeader({
	variant,
	canCreateUser,
	onCreateClick,
	onRefresh
}: {
	variant: UsersViewVariant;
	canCreateUser: boolean;
	onCreateClick: () => void;
	onRefresh: () => void;
}) {
	const isSellersMode = variant === 'sellers';
	const isTeamMode = variant === 'team';
	const title = isSellersMode ? 'Sellers' : isTeamMode ? 'Team' : 'Admin Users';
	const icon = isSellersMode
		? 'lucide:store'
		: isTeamMode
			? 'lucide:users'
			: 'lucide:user-cog';

	return (
		<div className="w-full bg-secondary-500 text-slate-900 px-4 sm:px-6 py-2 sm:py-2.5 flex sm:flex-row items-center justify-between gap-2.5 shadow-md">
			{/* Left Title & Icon */}
			<div className="flex items-center gap-2.5 w-full sm:w-auto">
				<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-black/10 text-slate-900">
					<FuseSvgIcon size={18} className="text-slate-900">
						{icon}
					</FuseSvgIcon>
				</div>
				<h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 m-0">
					{title}
				</h1>
			</div>

			{/* Right Controls: Refresh + Add User */}
			<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
				<Tooltip title="Refresh list" arrow>
					<button
						type="button"
						onClick={onRefresh}
						style={{ height: '32px', width: '32px' }}
						className="h-8 w-8 flex items-center justify-center rounded-lg bg-white text-slate-800 hover:bg-slate-100 transition-all shadow-xs cursor-pointer border-0 shrink-0"
					>
						<FuseSvgIcon size={16} className="text-slate-800">
							heroicons-outline:arrow-path
						</FuseSvgIcon>
					</button>
				</Tooltip>

				{!isSellersMode && canCreateUser && (
					<button
						type="button"
						onClick={onCreateClick}
						style={{ height: '32px' }}
						className="h-8 px-3 bg-primary-800 hover:bg-primary-900 text-white text-xs sm:text-sm font-semibold rounded-lg border border-white/80 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
					>
						<FuseSvgIcon size={15} className="text-white">
							heroicons-outline:plus
						</FuseSvgIcon>
						<span>Add User</span>
					</button>
				)}
			</div>
		</div>
	);
}

function UsersAppView({ variant }: { variant: UsersViewVariant }) {
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
		variant === 'team' ? 'user' : variant === 'sellers' ? 'sellers' : 'users';
	const hasAccess = canView(sectionKey);

	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
	const [globalFilter, setGlobalFilter] = useState('');
	const [sorting, setSorting] = useState<MRT_SortingState>([]);

	const sortKey = sorting[0]?.id || 'createdAt';
	const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
	const sortBy = sorting.length > 0 ? `${sortKey}:${sortOrder}` : undefined;

	const listParams = {
		page: pagination.pageIndex + 1,
		limit: pagination.pageSize,
		search: globalFilter,
		sortBy
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
		type: 'status' | 'delete';
		user: User | null;
		targetStatus?: number;
	}>({
		open: false,
		type: 'status',
		user: null
	});
	const [isActionLoading, setIsActionLoading] = useState(false);

	const [formName, setFormName] = useState('');
	const [formEmail, setFormEmail] = useState('');
	const [formPhone, setFormPhone] = useState('');
	const [formRoleId, setFormRoleId] = useState('');
	const [maxMarketplaces, setMaxMarketplaces] = useState(5);
	const [maxReviewRequestsPerMonth, setMaxReviewRequestsPerMonth] = useState(1000);
	const [editBusinessName, setEditBusinessName] = useState('');

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

	const resetCreateForm = () => {
		setFormName('');
		setFormEmail('');
		setFormPhone('');
		setFormRoleId('');
	};

	const handleCreate = async () => {
		if (!formName.trim() || !formEmail.trim() || !formRoleId) {
			enqueueSnackbar('Name, email, and role are required.', { variant: 'error' });
			return;
		}
		try {
			const payload = {
				name: formName.trim(),
				email: formEmail.trim(),
				contact_no: formPhone,
				role_id: formRoleId
			};
			if (isTeamMode) {
				await createTeamMutation.mutateAsync(payload);
			} else {
				await createAdminMutation.mutateAsync(payload);
			}
			enqueueSnackbar('User created.', { variant: 'success' });
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
				enqueueSnackbar(`"${confirmState.user.name}" has been deleted.`, {
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
		try {
			await updateMutation.mutateAsync({
				userId,
				payload: {
					name: formName,
					contact_no: formPhone,
					role_id: formRoleId || undefined,
					businessName: isSellersMode ? editBusinessName : undefined,
					planLimits: isSellersMode
						? {
							maxMarketplaces,
							maxReviewRequestsPerMonth
						}
						: undefined
				}
			});
			enqueueSnackbar('User updated.', { variant: 'success' });
			setEditOpen(false);
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, 'Failed to update user.');
			enqueueSnackbar(errMsg, {
				variant: 'error'
			});
		}
	};

	const handleRefresh = useCallback(() => {
		setGlobalFilter('');
		setPagination((prev) => ({
			...prev,
			pageIndex: 0
		}));
		activeQuery.refetch();
	}, [activeQuery]);

	const columns = useMemo<MRT_ColumnDef<User>[]>(() => {
		const base: MRT_ColumnDef<User>[] = [
			{
				accessorKey: 'name',
				header: 'NAME',
				size: 150,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return (
						<Tooltip title={val || '—'} arrow>
							<Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
								{val || '—'}
							</Typography>
						</Tooltip>
					);
				}
			},
			{
				accessorKey: 'email',
				header: 'EMAIL',
				size: 180,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return (
						<Tooltip title={val || '—'} arrow>
							<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
								{val || '—'}
							</Typography>
						</Tooltip>
					);
				}
			},
			{
				id: 'role',
				header: 'ROLE',
				size: 120,
				Cell: ({ row }) => (
					<Typography sx={{ fontSize: 12, color: 'text.primary', fontWeight: 500 }}>
						{roleLabel(row.original)}
					</Typography>
				)
			},
			{
				accessorKey: 'status',
				header: 'STATUS',
				size: 100,
				Cell: ({ cell }) => {
					const status = cell.getValue<number>();
					const isActive = status === 1;
					return (
						<span
							className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isActive
								? 'bg-emerald-50 text-emerald-700 border-emerald-200'
								: 'bg-amber-50 text-amber-700 border-amber-200'
								}`}
						>
							{isActive ? 'Active' : 'Inactive'}
						</span>
					);
				}
			}
		];
		if (isSellersMode) {
			base.push(
				{
					accessorKey: 'businessName',
					header: 'BRAND',
					size: 140,
					Cell: ({ cell }) => {
						const val = cell.getValue<string>();
						return (
							<Typography sx={{ fontSize: 12, color: 'text.primary' }}>
								{val || '—'}
							</Typography>
						);
					}
				},
				{
					id: 'currentPlan',
					header: 'PLAN',
					size: 210,
					Cell: ({ row }) => {
						const user = row.original;
						const activePlan = Array.isArray(user.plans) ? user.plans.find((p) => p.status === 1) : null;
						const queuedPlan = Array.isArray(user.plans) ? user.plans.find((p) => p.status === 4) : null;
						const planName =
							activePlan?.name ||
							(typeof user.currentPlanId === 'object' ? user.currentPlanId?.name : null);
						const isExpired =
							user.subscriptionStatus === 2 ||
							(activePlan?.expireAt && new Date(activePlan.expireAt).getTime() < Date.now());

						if (!planName && !queuedPlan) {
							return (
								<span className="text-xs text-slate-400 font-medium">
									—
								</span>
							);
						}

						const hasExpiry = Boolean(activePlan?.expireAt);

						return (
							<div className="flex flex-col">
								<div className="flex items-center gap-1.5">
									<span className="font-semibold text-slate-900 text-xs">
										{planName || queuedPlan?.name}
									</span>
									{isExpired && (
										<span className="text-[11px] font-semibold text-rose-600">
											(Expired)
										</span>
									)}
								</div>
								{(hasExpiry || queuedPlan) && (
									<div className="flex items-center gap-1.5 text-[11px] leading-tight mt-0.5">
										{hasExpiry && (
											<span className="text-slate-500 font-normal whitespace-nowrap">
												Exp: {moment(activePlan.expireAt).format('DD MMM YYYY')}
											</span>
										)}
										{queuedPlan && (
											<>
												{hasExpiry && <span className="text-slate-300">•</span>}
												<span className="text-blue-600 font-medium whitespace-nowrap">
													Next: {queuedPlan.name}
												</span>
											</>
										)}
									</div>
								)}
							</div>
						);
					}
				},
				{
					id: 'planLimits.maxMarketplaces',
					header: 'MAX MARKETPLACES',
					size: 140,
					accessorFn: (row) => {
						const activePlan = Array.isArray(row.plans) ? row.plans.find((p) => p.status === 1) : null;
						return activePlan?.marketplace ?? row.planLimits?.maxMarketplaces ?? null;
					},
					Cell: ({ cell }) => (
						<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
							{cell.getValue<number>() ?? '—'}
						</Typography>
					)
				},
				{
					id: 'planLimits.maxReviewRequestsPerMonth',
					header: 'MONTHLY QUOTA',
					size: 140,
					accessorFn: (row) => {
						const activePlan = Array.isArray(row.plans) ? row.plans.find((p) => p.status === 1) : null;
						return activePlan?.request_quota ?? row.planLimits?.maxReviewRequestsPerMonth ?? null;
					},
					Cell: ({ cell }) => (
						<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
							{cell.getValue<number>()?.toLocaleString() ?? '—'}
						</Typography>
					)
				},
				{
					id: 'planLimits.usedReviewRequests',
					header: 'REQUESTS USED',
					size: 140,
					accessorFn: (row) => row.planLimits?.usedReviewRequests ?? (row as any).usedReviewRequests ?? 0,
					Cell: ({ cell, row }) => {
						const used = cell.getValue<number>() ?? 0;
						const activePlan = Array.isArray(row.original.plans) ? row.original.plans.find((p) => p.status === 1) : null;
						const quota = activePlan?.request_quota ?? row.original.planLimits?.maxReviewRequestsPerMonth ?? 0;
						return (
							<div className="flex items-center gap-1">
								<Typography sx={{ fontSize: 12, fontWeight: 600, color: used > 0 ? '#0F172A' : '#64748B' }}>
									{used.toLocaleString()}
								</Typography>
								{quota > 0 && (
									<Typography sx={{ fontSize: 11, color: '#94A3B8' }}>
										/ {quota.toLocaleString()}
									</Typography>
								)}
							</div>
						);
					}
				}
			);
		} else {
			base.push({
				accessorKey: 'contact_no',
				header: 'PHONE',
				size: 130,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return (
						<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
							{val || '—'}
						</Typography>
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

	return (
		<Root
			header={
				<UsersHeader
					variant={variant}
					canCreateUser={canCreate(sectionKey)}
					onCreateClick={() => {
						resetCreateForm();
						setCreateOpen(true);
					}}
					onRefresh={handleRefresh}
				/>
			}
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
						tableId={isSellersMode ? 'sellers-table' : isTeamMode ? 'team-table' : 'admin-users-table'}
						enableRowActions
						positionActionsColumn="last"
						displayColumnDefOptions={{
							'mrt-row-actions': {
								size: 105,
								minSize: 95,
								maxSize: 115
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
						onSortingChange={setSorting}
						manualPagination
						manualFiltering
						manualSorting
						rowCount={totalResults}
						pageCount={totalPages}
						muiTableContainerProps={{
							sx: {
								maxWidth: '100%',
								flex: '1 1 auto',
								minHeight: 0,
								overflow: 'auto',
								'&::-webkit-scrollbar': { height: 8, width: 8 },
								'&::-webkit-scrollbar-track': {
									backgroundColor: 'background.default',
									borderRadius: 4
								},
								'&::-webkit-scrollbar-thumb': {
									backgroundColor: 'divider',
									borderRadius: 4,
									'&:hover': { backgroundColor: 'text.disabled' }
								}
							}
						}}
						muiBottomToolbarProps={{
							className:
								'flex flex-row items-center justify-end min-h-[46px] h-[46px] py-0 px-2 sm:px-4 bg-gray-100',
							sx: {
								borderTop: '1px solid',
								borderColor: 'divider',
								flexShrink: 0,
								marginTop: 'auto',
								position: 'sticky',
								bottom: 0,
								zIndex: 2,
								minHeight: '46px !important',
								height: '46px !important',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'flex-end',
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
									justifyContent: 'flex-end',
									gap: { xs: 0.5, sm: 1 },
									minHeight: '46px !important',
									height: '46px !important',
									paddingLeft: { xs: 1, sm: 2 },
									paddingRight: { xs: 1, sm: 2 },
									py: '0 !important',
									my: 'auto'
								},
								'& .MuiTablePagination-selectLabel': {
									fontSize: { xs: '12px', sm: '13px' },
									margin: '0 !important',
									lineHeight: '1.2 !important',
									display: 'inline-flex',
									alignItems: 'center'
								},
								'& .MuiTablePagination-input': {
									marginRight: { xs: 0.5, sm: 1 },
									marginLeft: 0.5,
									display: 'inline-flex',
									alignItems: 'center',
									'& .MuiSelect-select': {
										paddingTop: '3px !important',
										paddingBottom: '3px !important',
										fontSize: { xs: '12px', sm: '13px' },
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
						muiTableHeadProps={{
							className: 'bg-gray-100 border-t border-b border-gray-200'
						}}
						muiTableHeadRowProps={{
							className: 'bg-gray-100 border-t border-b border-gray-200'
						}}
						muiTableHeadCellProps={{
							className: 'bg-gray-100 border-t border-b border-gray-200'
						}}
						muiTableProps={{
							sx: {
								tableLayout: 'auto',
								minWidth: '100%',
								'& .MuiTableRow-root:hover': {
									backgroundColor: 'action.hover',
									transition: 'background-color 0.15s ease'
								},
								'& .MuiTableCell-root': {
									borderBottom: '1px solid',
									borderColor: 'divider',
									padding: '2px 8px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									maxWidth: '100%',
									height: '37px',
									boxSizing: 'border-box'
								},
								'& .MuiTableHead-root, & .MuiTableHead-root .MuiTableCell-root': {
									fontWeight: 700,
									fontSize: 11.5,
									letterSpacing: 0.3,
									textTransform: 'uppercase',
									color: 'text.secondary',
									borderTop: '1px solid',
									borderBottom: '1px solid',
									borderColor: 'rgb(229 231 235)',
									padding: '6px 8px',
									maxWidth: '100%',
									textAlign: 'left'
								}
							}
						}}
						renderRowActions={({ row }: { row: MRT_Row<User> }) => (
							<Box className="flex items-center gap-1">
								{canUpdate(sectionKey) && (
									<>
										<Tooltip title={row.original.status === 1 ? 'Click to deactivate user' : 'Click to activate user'} arrow>
											<Box
												onClick={() => handleOpenStatusConfirm(row.original, row.original.status)}
												className="cursor-pointer inline-flex items-center p-0.5"
												sx={{ lineHeight: 0 }}
											>
												<CustomStatusSwitch
													size="small"
													checked={row.original.status === 1}
													sx={{ pointerEvents: 'none' }}
												/>
											</Box>
										</Tooltip>
										<Tooltip title="Edit user" arrow>
											<IconButton
												size="small"
												onClick={(e) => {
													(e.currentTarget as HTMLElement)?.blur();
													handleOpenEdit(row.original);
												}}
												className="text-slate-600 hover:text-slate-900 p-1"
											>
												<FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
											</IconButton>
										</Tooltip>
										{isSellersMode && (
											<Tooltip title="Assign Plan" arrow>
												<IconButton
													size="small"
													onClick={(e) => {
														(e.currentTarget as HTMLElement)?.blur();
														handleOpenAssignPlan(row.original);
													}}
													className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 transition-colors"
												>
													<FuseSvgIcon size={18}>lucide:sparkles</FuseSvgIcon>
												</IconButton>
											</Tooltip>
										)}
									</>
								)}
								{canDelete(sectionKey) && (
									<Tooltip title="Delete user" arrow>
										<IconButton
											size="small"
											className="text-red-500 hover:text-red-700 p-1"
											onClick={(e) => {
												(e.currentTarget as HTMLElement)?.blur();
												handleOpenDeleteConfirm(row.original);
											}}
										>
											<FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
										</IconButton>
									</Tooltip>
								)}
							</Box>
						)}
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
							<div className="bg-secondary-500 text-slate-900 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center w-7 h-7 rounded bg-black/10 shrink-0">
										<FuseSvgIcon size={18} className="text-slate-900">
											{isTeamMode ? 'heroicons-outline:user-group' : 'heroicons-outline:user-plus'}
										</FuseSvgIcon>
									</div>
									<h1 className="text-base sm:text-lg font-bold text-slate-900 m-0 truncate">
										{isTeamMode ? 'Create Team Member' : 'Create Admin User'}
									</h1>
								</div>

								<IconButton
									size="small"
									onClick={() => setCreateOpen(false)}
									className="text-slate-900 hover:bg-black/10 transition-colors"
									aria-label="Close"
								>
									<FuseSvgIcon size={20} className="text-slate-900">heroicons-outline:x-mark</FuseSvgIcon>
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
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Full Name <span className="text-red-500">*</span>
										</Typography>
										<TextField
											fullWidth
											required
											placeholder="e.g., Alex Wright"
											value={formName}
											onChange={(e) => setFormName(e.target.value)}
											variant="outlined"
											size="small"
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
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Email Address <span className="text-red-500">*</span>
										</Typography>
										<TextField
											fullWidth
											required
											type="email"
											placeholder="e.g., alex@gravurtastisch.de"
											value={formEmail}
											onChange={(e) => setFormEmail(e.target.value)}
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
										/>
									</div>

									<div>
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Phone Number
										</Typography>
										<TextField
											fullWidth
											placeholder="e.g., +49 151 2345001"
											value={formPhone}
											onChange={(e) => setFormPhone(e.target.value)}
											variant="outlined"
											size="small"
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

									<div>
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Role <span className="text-red-500">*</span>
										</Typography>
										<FormControl fullWidth size="small" required>
											<Select
												value={formRoleId}
												onChange={(e) => setFormRoleId(String(e.target.value))}
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
										{!roles.length && (
											<Typography variant="body2" className="text-amber-600 text-xs mt-1.5 flex items-center gap-1">
												<FuseSvgIcon size={14}>heroicons-outline:exclamation-triangle</FuseSvgIcon>
												Create a role first before adding users.
											</Typography>
										)}
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
									className="bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-5 sm:px-7 py-2 shadow-sm transition-all capitalize text-xs sm:text-sm disabled:opacity-50"
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
							<div className="bg-secondary-500 text-slate-900 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center w-7 h-7 rounded bg-black/10 shrink-0">
										<FuseSvgIcon size={18} className="text-slate-900">
											heroicons-outline:pencil-square
										</FuseSvgIcon>
									</div>
									<h1 className="text-base sm:text-lg font-bold text-slate-900 m-0 truncate">
										Edit User
									</h1>
								</div>

								<IconButton
									size="small"
									onClick={() => setEditOpen(false)}
									className="text-slate-900 hover:bg-black/10 transition-colors"
									aria-label="Close"
								>
									<FuseSvgIcon size={20} className="text-slate-900">heroicons-outline:x-mark</FuseSvgIcon>
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
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Full Name
										</Typography>
										<TextField
											fullWidth
											placeholder="Full Name"
											value={formName}
											onChange={(e) => setFormName(e.target.value)}
											variant="outlined"
											size="small"
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
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Phone Number
										</Typography>
										<TextField
											fullWidth
											placeholder="Phone Number"
											value={formPhone}
											onChange={(e) => setFormPhone(e.target.value)}
											variant="outlined"
											size="small"
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

									<div>
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Role
										</Typography>
										<FormControl fullWidth size="small">
											<Select
												value={formRoleId}
												onChange={(e) => setFormRoleId(String(e.target.value))}
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

									{isSellersMode && (
										<>
											<div>
												<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
													Brand Name
												</Typography>
												<TextField
													placeholder="Brand Name"
													value={editBusinessName}
													onChange={(e) => setEditBusinessName(e.target.value)}
													fullWidth
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
												/>
											</div>

											{(isSuperAdmin || selectedUser?.userType === 'seller') && (
												<>
													<div>
														<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
															Maximum Active Marketplaces
														</Typography>
														<TextField
															type="number"
															fullWidth
															variant="outlined"
															size="small"
															value={maxMarketplaces}
															onChange={(e) => setMaxMarketplaces(Math.max(1, Number(e.target.value)))}
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
														<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
															Monthly Review Request Quota
														</Typography>
														<TextField
															type="number"
															fullWidth
															variant="outlined"
															size="small"
															value={maxReviewRequestsPerMonth}
															onChange={(e) =>
																setMaxReviewRequestsPerMonth(Math.max(0, Number(e.target.value)))
															}
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
									className="bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-5 sm:px-7 py-2 shadow-sm transition-all capitalize text-xs sm:text-sm"
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
									className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${confirmState.type === 'delete' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'
										}`}
								>
									<FuseSvgIcon size={24} className={confirmState.type === 'delete' ? 'text-red-500' : 'text-amber-500'}>
										{confirmState.type === 'delete' ? 'heroicons-outline:trash' : 'heroicons-outline:exclamation-triangle'}
									</FuseSvgIcon>
								</div>
								<div className="flex flex-col">
									<h3 className="text-base font-bold text-slate-800 m-0">
										{confirmState.type === 'delete' ? 'Delete User' : 'Change User Status'}
									</h3>
									<p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed m-0">
										{confirmState.type === 'delete' ? (
											<>
												Are you sure you want to delete{' '}
												<strong className="text-slate-800 font-semibold">{confirmState.user?.name}</strong>? This action cannot be undone.
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
								className={`h-9 px-5 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs border-0 flex items-center gap-1.5 text-white ${confirmState.type === 'delete'
									? 'bg-red-600 hover:bg-red-700'
									: 'bg-primary-800 hover:bg-primary-900'
									}`}
							>
								{isActionLoading && <CircularProgress size={14} color="inherit" />}
								<span>{confirmState.type === 'delete' ? 'Delete' : 'Change Status'}</span>
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
