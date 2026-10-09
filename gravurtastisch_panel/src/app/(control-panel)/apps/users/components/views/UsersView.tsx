'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
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
		<div className="w-full bg-primary-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex sm:flex-row items-center justify-between gap-2.5 shadow-md">
			{/* Left Title & Icon */}
			<div className="flex items-center gap-2.5 w-full sm:w-auto">
				<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 text-white">
					<FuseSvgIcon size={18} className="text-white">
						{icon}
					</FuseSvgIcon>
				</div>
				<h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0">
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

	const [formName, setFormName] = useState('');
	const [formEmail, setFormEmail] = useState('');
	const [formPhone, setFormPhone] = useState('');
	const [formRoleId, setFormRoleId] = useState('');
	const [maxMarketplaces, setMaxMarketplaces] = useState(5);
	const [maxReviewRequestsPerMonth, setMaxReviewRequestsPerMonth] = useState(1000);
	const [editBusinessName, setEditBusinessName] = useState('');

	useEffect(() => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}, [globalFilter, sortBy, variant]);

	const users = activeQuery.data?.data || [];
	const totalPages = activeQuery.data?.pagination?.lastPage || 1;
	const totalResults = activeQuery.data?.pagination?.total ?? (users.length);

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
			const errMsg = err instanceof Error ? err.message : String(err);
			enqueueSnackbar(errMsg || 'Failed to create user.', {
				variant: 'error'
			});
		}
	};

	const handleStatusToggle = useCallback(
		async (user: User, currentStatus: number) => {
			const userId = user._id ?? user.id;
			if (!userId) return;
			try {
				await updateMutation.mutateAsync({
					userId,
					payload: { status: currentStatus === 1 ? 0 : 1 }
				});
				enqueueSnackbar('User status updated.', { variant: 'success' });
			} catch (err: unknown) {
				const errMsg = err instanceof Error ? err.message : String(err);
				enqueueSnackbar(errMsg || 'Failed to update status.', {
					variant: 'error'
				});
			}
		},
		[updateMutation, enqueueSnackbar]
	);

	const handleOpenEdit = (user: User) => {
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
			const errMsg = err instanceof Error ? err.message : String(err);
			enqueueSnackbar(errMsg || 'Failed to update user.', {
				variant: 'error'
			});
		}
	};

	const handleDeleteUser = useCallback(
		async (user: User) => {
			const userId = user._id ?? user.id;
			if (!userId) return;
			try {
				await updateMutation.mutateAsync({ userId, payload: { status: 2 } });
				enqueueSnackbar(`${user.name} deleted.`, { variant: 'success' });
			} catch (err: unknown) {
				const errMsg = err instanceof Error ? err.message : String(err);
				enqueueSnackbar(errMsg || 'Failed to delete user.', {
					variant: 'error'
				});
			}
		},
		[updateMutation, enqueueSnackbar]
	);

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
							className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isActive
									? 'bg-emerald-100 text-emerald-700'
									: 'bg-amber-100 text-amber-700'
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
					accessorKey: 'planLimits.maxMarketplaces',
					header: 'MAX MARKETPLACES',
					size: 140,
					Cell: ({ cell }) => (
						<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
							{cell.getValue<number>() ?? '—'}
						</Typography>
					)
				},
				{
					accessorKey: 'planLimits.maxReviewRequestsPerMonth',
					header: 'MONTHLY QUOTA',
					size: 140,
					Cell: ({ cell }) => (
						<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
							{cell.getValue<number>()?.toLocaleString() ?? '—'}
						</Typography>
					)
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
		return <Navigate to="/" replace />;
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
						tableId="users-management-table"
						enableRowActions
						positionActionsColumn="last"
						displayColumnDefOptions={{
							'mrt-row-actions': {
								size: 90,
								minSize: 80,
								maxSize: 100
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
						onGlobalFilterChange={setGlobalFilter}
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
									padding: '4px 8px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									maxWidth: '100%'
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
										<Tooltip title={row.original.status === 1 ? 'Deactivate user' : 'Activate user'} arrow>
											<IconButton
												size="small"
												onClick={() => handleStatusToggle(row.original, row.original.status)}
												className={
													row.original.status === 1
														? 'text-emerald-600 hover:text-emerald-800 p-1.5'
														: 'text-amber-600 hover:text-amber-800 p-1.5'
												}
											>
												<FuseSvgIcon size={18}>
													{row.original.status === 1
														? 'heroicons-outline:check-circle'
														: 'heroicons-outline:x-circle'}
												</FuseSvgIcon>
											</IconButton>
										</Tooltip>
										<Tooltip title="Edit user" arrow>
											<IconButton
												size="small"
												onClick={() => handleOpenEdit(row.original)}
												className="text-slate-600 hover:text-slate-900 p-1.5"
											>
												<FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
											</IconButton>
										</Tooltip>
									</>
								)}
								{canDelete(sectionKey) && (
									<Tooltip title="Delete user" arrow>
										<IconButton
											size="small"
											className="text-red-500 hover:text-red-700 p-1.5"
											onClick={() => handleDeleteUser(row.original)}
										>
											<FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
										</IconButton>
									</Tooltip>
								)}
							</Box>
						)}
					/>

					{/* Create */}
					<Dialog
						open={createOpen}
						onClose={() => setCreateOpen(false)}
						maxWidth="sm"
						fullWidth
						PaperProps={{
							sx: {
								borderRadius: '16px',
								overflow: 'hidden'
							}
						}}
					>
						<DialogTitle className="font-bold">Create User</DialogTitle>
						<DialogContent className="flex flex-col gap-4 pt-2">
							<TextField
								label="Name"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								fullWidth
								required
							/>
							<TextField
								label="Email"
								value={formEmail}
								onChange={(e) => setFormEmail(e.target.value)}
								fullWidth
								required
							/>
							<TextField
								label="Phone"
								value={formPhone}
								onChange={(e) => setFormPhone(e.target.value)}
								fullWidth
							/>
							<FormControl fullWidth required>
								<InputLabel id="create-role-label">Role</InputLabel>
								<Select
									labelId="create-role-label"
									label="Role"
									value={formRoleId}
									onChange={(e) => setFormRoleId(String(e.target.value))}
								>
									{roles.map((role) => {
										const id = role.id || role._id || '';
										return (
											<MenuItem
												key={id}
												value={id}
											>
												{role.role_name}
											</MenuItem>
										);
									})}
								</Select>
							</FormControl>
							{!roles.length && (
								<Typography
									variant="body2"
									color="warning.main"
								>
									Create a role first before adding users.
								</Typography>
							)}
						</DialogContent>
						<DialogActions className="p-4 bg-slate-50">
							<Button onClick={() => setCreateOpen(false)}>Cancel</Button>
							<Button
								variant="contained"
								onClick={handleCreate}
								disabled={!roles.length}
							>
								Create
							</Button>
						</DialogActions>
					</Dialog>

					{/* Edit */}
					<Dialog
						open={editOpen}
						onClose={() => setEditOpen(false)}
						maxWidth="sm"
						fullWidth
						PaperProps={{
							sx: {
								borderRadius: '16px',
								overflow: 'hidden'
							}
						}}
					>
						<DialogTitle className="font-bold">Edit User</DialogTitle>
						<DialogContent className="flex flex-col gap-4 pt-2">
							<TextField
								label="Name"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								fullWidth
							/>
							<TextField
								label="Phone"
								value={formPhone}
								onChange={(e) => setFormPhone(e.target.value)}
								fullWidth
							/>
							<FormControl fullWidth>
								<InputLabel id="edit-role-label">Role</InputLabel>
								<Select
									labelId="edit-role-label"
									label="Role"
									value={formRoleId}
									onChange={(e) => setFormRoleId(String(e.target.value))}
								>
									{roles.map((role) => {
										const id = role.id || role._id || '';
										return (
											<MenuItem
												key={id}
												value={id}
											>
												{role.role_name}
											</MenuItem>
										);
									})}
								</Select>
							</FormControl>
							{isSellersMode && (
								<>
									<TextField
										label="Brand Name"
										value={editBusinessName}
										onChange={(e) => setEditBusinessName(e.target.value)}
										fullWidth
									/>
									{(isSuperAdmin || selectedUser?.userType === 'seller') && (
										<>
											<TextField
												label="Maximum Active Marketplaces"
												type="number"
												fullWidth
												value={maxMarketplaces}
												onChange={(e) => setMaxMarketplaces(Math.max(1, Number(e.target.value)))}
											/>
											<TextField
												label="Monthly Review Request Quota"
												type="number"
												fullWidth
												value={maxReviewRequestsPerMonth}
												onChange={(e) =>
													setMaxReviewRequestsPerMonth(Math.max(0, Number(e.target.value)))
												}
											/>
										</>
									)}
								</>
							)}
						</DialogContent>
						<DialogActions className="p-4 bg-slate-50">
							<Button onClick={() => setEditOpen(false)}>Cancel</Button>
							<Button
								variant="contained"
								onClick={handleSaveEdit}
							>
								Save
							</Button>
						</DialogActions>
					</Dialog>
				</Paper>
			}
			scroll="content"
		/>
	);
}

export default UsersAppView;
