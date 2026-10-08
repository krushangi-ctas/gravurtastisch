'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
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
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { type MRT_ColumnDef, type MRT_Row, type MRT_SortingState } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
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
	'& .container': {
		maxWidth: '100%!important'
	}
}));

function roleLabel(user: User) {
	if (typeof user.role_id === 'object' && user.role_id) {
		return user.role_id.role_name || '—';
	}
	return '—';
}

export type UsersViewVariant = 'sellers' | 'admin-users' | 'team';

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
	// Order-only users must not hit GET /roles (403 roles.view).
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
			enqueueSnackbar(err instanceof Error ? err.message : 'Failed to create user.', {
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
				enqueueSnackbar(err instanceof Error ? err.message : 'Failed to update status.', {
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
			enqueueSnackbar(err instanceof Error ? err.message : 'Failed to update user.', {
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
				enqueueSnackbar(err instanceof Error ? err.message : 'Failed to delete user.', {
					variant: 'error'
				});
			}
		},
		[updateMutation, enqueueSnackbar]
	);

	const columns = useMemo<MRT_ColumnDef<User>[]>(() => {
		const base: MRT_ColumnDef<User>[] = [
			{ accessorKey: 'name', header: 'Name' },
			{ accessorKey: 'email', header: 'Email' },
			{
				id: 'role',
				header: 'Role',
				Cell: ({ row }) => roleLabel(row.original)
			}
		];
		if (isSellersMode) {
			base.push(
				{
					accessorKey: 'businessName',
					header: 'Brand',
					Cell: ({ cell }) => cell.getValue<string>() || <span className="text-gray-300">N/A</span>
				},
				{
					accessorKey: 'planLimits.maxMarketplaces',
					header: 'Max Marketplaces'
				},
				{
					accessorKey: 'planLimits.maxReviewRequestsPerMonth',
					header: 'Monthly Quota',
					minSize: 160
				}
			);
		} else {
			base.push({
				accessorKey: 'contact_no',
				header: 'Phone',
				Cell: ({ cell }) => cell.getValue<string>() || <span className="text-gray-300">N/A</span>
			});
		}
		return base;
	}, [isSellersMode]);

	if (!hasAccess) {
		return <Navigate to="/" replace />;
	}

	if (activeQuery.isLoading && !activeQuery.data) {
		return (
			<Box className="flex h-64 items-center justify-center">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Root
			header={
				<div className="flex w-full flex-col justify-between gap-2 px-6 pt-4 pb-4 md:flex-row md:items-center">
					<div>
						<Typography className="text-3xl font-extrabold tracking-tight text-gray-900">
							{isSellersMode
								? 'Sellers'
								: isTeamMode
									? 'Team'
									: 'Admin Users'}
						</Typography>
						<Typography
							color="text.secondary"
							className="mt-1 text-sm"
						>
							{isSellersMode
								? 'Approve and manage seller organizations. Super admin accounts are never listed.'
								: isTeamMode
									? 'Manage seller team users. Seller admin accounts are hidden from this list.'
									: 'Manage admin staff and assign roles. Super admin accounts are only creatable via DB.'}
						</Typography>
					</div>
					{!isSellersMode && canCreate(sectionKey) && (
						<Button
							variant="contained"
							startIcon={<FuseSvgIcon size={18}>heroicons-outline:plus</FuseSvgIcon>}
							onClick={() => {
								resetCreateForm();
								setCreateOpen(true);
							}}
						>
							Create User
						</Button>
					)}
				</div>
			}
			content={
				<Box className="p-1">
					<DataTable
						columns={columns}
						data={users}
						tableId="users-management-table"
						enableRowActions
						positionActionsColumn="last"
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
						pageCount={totalPages}
						renderTopToolbarCustomActions={() => (
							<div className="ml-auto mr-2">
								<Tooltip title="Refresh list">
									<IconButton onClick={() => activeQuery.refetch()}>
										<FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>
									</IconButton>
								</Tooltip>
							</div>
						)}
						renderRowActions={({ row }: { row: MRT_Row<User> }) => (
							<Box className="flex items-center">
								{canUpdate(sectionKey) && (
									<>
										<Tooltip title={row.original.status === 1 ? 'Deactivate' : 'Activate'}>
											<IconButton
												onClick={() => handleStatusToggle(row.original, row.original.status)}
												className={
													row.original.status === 1
														? 'text-green-600'
														: 'text-gray-400'
												}
											>
												<FuseSvgIcon size={20}>
													{row.original.status === 1
														? 'heroicons-outline:check-circle'
														: 'heroicons-outline:x-circle'}
												</FuseSvgIcon>
											</IconButton>
										</Tooltip>
										<Tooltip title="Edit user">
											<IconButton onClick={() => handleOpenEdit(row.original)}>
												<FuseSvgIcon size={20}>heroicons-outline:pencil-square</FuseSvgIcon>
											</IconButton>
										</Tooltip>
									</>
								)}
								{canDelete(sectionKey) && (
									<Tooltip title="Delete user">
										<IconButton
											className="text-red-500"
											onClick={() => handleDeleteUser(row.original)}
										>
											<FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
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
					>
						<DialogTitle>Create User</DialogTitle>
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
						<DialogActions>
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
					>
						<DialogTitle>Edit User</DialogTitle>
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
						<DialogActions>
							<Button onClick={() => setEditOpen(false)}>Cancel</Button>
							<Button
								variant="contained"
								onClick={handleSaveEdit}
							>
								Save
							</Button>
						</DialogActions>
					</Dialog>
				</Box>
			}
		/>
	);
}

export default UsersAppView;
