'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	IconButton,
	InputAdornment,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { useAutoScrollRef } from 'src/hooks/useAutoScrollRef';
import usePermissions from '@/hooks/usePermissions';
import {
	useCreateRole,
	useDeleteRole,
	useRoles,
	useSections,
	useUpdateRole
} from '../../api/hooks/useRoles';
import { Role, RolePermission } from '../../api/services/rolesApiService';

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

const emptyFlags = () => ({
	canView: false,
	canCreate: false,
	canUpdate: false,
	canDelete: false
});

function RolesHeader({
	canCreateRole,
	onCreateClick,
	onRefresh
}: {
	canCreateRole: boolean;
	onCreateClick: () => void;
	onRefresh: () => void;
}) {
	return (
		<div className="w-full bg-primary-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex sm:flex-row items-center justify-between gap-2.5 shadow-md">
			{/* Left Title & Icon */}
			<div className="flex items-center gap-2.5 w-full sm:w-auto">
				<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 text-white">
					<FuseSvgIcon size={18} className="text-white">
						heroicons-outline:shield-check
					</FuseSvgIcon>
				</div>
				<h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0">
					Roles
				</h1>
			</div>

			{/* Right Controls: Refresh + Add Role */}
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

				{canCreateRole && (
					<button
						type="button"
						onClick={onCreateClick}
						style={{ height: '32px' }}
						className="h-8 px-3 bg-primary-800 hover:bg-primary-900 text-white text-xs sm:text-sm font-semibold rounded-lg border border-white/80 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
					>
						<FuseSvgIcon size={15} className="text-white">
							heroicons-outline:plus
						</FuseSvgIcon>
						<span>Add Role</span>
					</button>
				)}
			</div>
		</div>
	);
}

function RolesView() {
	const { canView, canCreate, canUpdate, canDelete, scope } = usePermissions();
	const { enqueueSnackbar } = useSnackbar();
	const autoScrollRef = useAutoScrollRef<HTMLDivElement>();

	const canAccessRoles = canView('roles');
	const { data: sectionsRes, isLoading: sectionsLoading } = useSections(
		scope,
		canAccessRoles
	);
	const { data: rolesRes, isLoading, refetch } = useRoles(
		{ scope, limit: 100 },
		canAccessRoles
	);
	const createMutation = useCreateRole();
	const updateMutation = useUpdateRole();
	const deleteMutation = useDeleteRole();

	const sections = useMemo(() => sectionsRes?.data || [], [sectionsRes?.data]);
	const roles = useMemo(() => rolesRes?.data || [], [rolesRes?.data]);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Role | null>(null);
	const [roleName, setRoleName] = useState('');
	const [description, setDescription] = useState('');
	const [matrix, setMatrix] = useState<Record<string, ReturnType<typeof emptyFlags>>>({});

	// Delete confirmation state
	const [confirmDeleteState, setConfirmDeleteState] = useState<{
		open: boolean;
		role: Role | null;
	}>({
		open: false,
		role: null
	});
	const [isActionLoading, setIsActionLoading] = useState(false);

	useEffect(() => {
		if (!sections.length) return;
		const next: Record<string, ReturnType<typeof emptyFlags>> = {};
		sections.forEach((section) => {
			next[section.key] = emptyFlags();
		});
		setMatrix(next);
	}, [sections]);

	const openCreate = () => {
		setEditing(null);
		setRoleName('');
		setDescription('');
		const next: Record<string, ReturnType<typeof emptyFlags>> = {};
		sections.forEach((section) => {
			next[section.key] = emptyFlags();
		});
		setMatrix(next);
		setDialogOpen(true);
	};

	const openEdit = (role: Role) => {
		setEditing(role);
		setRoleName(role.role_name);
		setDescription(role.description || '');
		const next: Record<string, ReturnType<typeof emptyFlags>> = {};
		sections.forEach((section) => {
			const found = role.permissions?.find((p) => p.section === section.key);
			next[section.key] = {
				canView: Boolean(found?.canView),
				canCreate: Boolean(found?.canCreate),
				canUpdate: Boolean(found?.canUpdate),
				canDelete: Boolean(found?.canDelete)
			};
		});
		setMatrix(next);
		setDialogOpen(true);
	};

	const toggleFlag = (sectionKey: string, flag: keyof ReturnType<typeof emptyFlags>) => {
		setMatrix((prev) => ({
			...prev,
			[sectionKey]: {
				...prev[sectionKey],
				[flag]: !prev[sectionKey]?.[flag]
			}
		}));
	};

	const buildPermissions = (): RolePermission[] =>
		Object.entries(matrix).map(([section, flags]) => ({
			section,
			...flags
		}));

	const handleSave = async () => {
		if (!roleName.trim()) {
			enqueueSnackbar('Role name is required.', { variant: 'error' });
			return;
		}
		try {
			if (editing) {
				const roleId = editing.id || editing._id;
				if (!roleId) throw new Error('Missing role id');
				await updateMutation.mutateAsync({
					roleId,
					payload: {
						role_name: roleName.trim(),
						description,
						permissions: buildPermissions()
					}
				});
				enqueueSnackbar('Role updated.', { variant: 'success' });
			} else {
				await createMutation.mutateAsync({
					role_name: roleName.trim(),
					description,
					scope,
					permissions: buildPermissions()
				});
				enqueueSnackbar('Role created.', { variant: 'success' });
			}
			setDialogOpen(false);
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : String(err);
			enqueueSnackbar(errMsg || 'Failed to save role.', {
				variant: 'error'
			});
		}
	};

	const handleOpenDeleteConfirm = (role: Role) => {
		setConfirmDeleteState({
			open: true,
			role
		});
	};

	const handleConfirmDelete = async () => {
		if (!confirmDeleteState.role) return;
		const roleId = confirmDeleteState.role.id || confirmDeleteState.role._id;
		if (!roleId) return;

		setIsActionLoading(true);
		try {
			await deleteMutation.mutateAsync(roleId);
			enqueueSnackbar(`Role "${confirmDeleteState.role.role_name}" has been deleted.`, {
				variant: 'success',
				autoHideDuration: 2000
			});
			setConfirmDeleteState({ open: false, role: null });
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : String(err);
			enqueueSnackbar(errMsg || 'Failed to delete role. Please try again.', {
				variant: 'error'
			});
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleRefresh = useCallback(() => {
		refetch();
	}, [refetch]);

	const columns = useMemo<MRT_ColumnDef<Role>[]>(
		() => [
			{
				accessorKey: 'role_name',
				header: 'ROLE',
				size: 160,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return (
						<Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
							{val || '—'}
						</Typography>
					);
				}
			},
			{
				accessorKey: 'description',
				header: 'DESCRIPTION',
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return (
						<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
							{val || '—'}
						</Typography>
					);
				}
			},
			{
				accessorKey: 'scope',
				header: 'SCOPE',
				size: 110,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return (
						<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 uppercase">
							{val || '—'}
						</span>
					);
				}
			}
		],
		[]
	);

	if (!canAccessRoles) {
		return <Navigate to="/" replace />;
	}

	if (sectionsLoading) {
		return (
			<Box className="flex h-64 items-center justify-center">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Root
			header={
				<RolesHeader
					canCreateRole={canCreate('roles')}
					onCreateClick={openCreate}
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
						data={roles}
						tableId="roles-management-table"
						enableRowActions
						positionActionsColumn="last"
						displayColumnDefOptions={{
							'mrt-row-actions': {
								size: 80,
								minSize: 70,
								maxSize: 90
							}
						}}
						enableRowSelection={false}
						state={{ isLoading }}
						manualPagination={false}
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
						renderRowActions={({ row }) => (
							<Box className="flex items-center gap-1">
								{canUpdate('roles') && (
									<Tooltip title="Edit role" arrow>
										<IconButton
											size="small"
											onClick={() => openEdit(row.original)}
											className="text-slate-600 hover:text-slate-900 p-1.5"
										>
											<FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
										</IconButton>
									</Tooltip>
								)}
								{canDelete('roles') && !row.original.isSystem && (
									<Tooltip title="Delete role" arrow>
										<IconButton
											size="small"
											className="text-red-500 hover:text-red-700 p-1.5"
											onClick={() => handleOpenDeleteConfirm(row.original)}
										>
											<FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
										</IconButton>
									</Tooltip>
								)}
							</Box>
						)}
					/>

					{/* Create / Edit Role Dialog */}
					<Dialog
						open={dialogOpen}
						onClose={() => setDialogOpen(false)}
						maxWidth="md"
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
							<div className="bg-primary-700 text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center w-7 h-7 rounded bg-white/20 shrink-0">
										<FuseSvgIcon size={18} className="text-white">
											heroicons-outline:shield-check
										</FuseSvgIcon>
									</div>
									<h1 className="text-base sm:text-lg font-bold text-white m-0 truncate">
										{editing ? 'Edit Role' : 'Create Role'}
									</h1>
								</div>

								<button
									type="button"
									onClick={() => setDialogOpen(false)}
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
								{/* Role Details Card */}
								<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
									<div>
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Role Name <span className="text-red-500">*</span>
										</Typography>
										<TextField
											fullWidth
											required
											placeholder="e.g., Production Lead, Support Specialist"
											value={roleName}
											onChange={(e) => setRoleName(e.target.value)}
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

									<div>
										<Typography className="text-xs font-semibold text-gray-700 mb-1.5">
											Description
										</Typography>
										<TextField
											fullWidth
											placeholder="Briefly describe responsibilities and scope for this role..."
											value={description}
											onChange={(e) => setDescription(e.target.value)}
											variant="outlined"
											size="small"
											multiline
											minRows={2}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
														<FuseSvgIcon size={16} className="text-gray-400">
															heroicons-outline:document-text
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>
								</div>

								{/* Section Permissions Table Card */}
								<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
									<div className="flex items-center gap-2">
										<FuseSvgIcon size={16} className="text-primary-700">
											heroicons-outline:key
										</FuseSvgIcon>
										<Typography className="text-xs font-bold text-gray-800 uppercase tracking-wider">
											Section Permissions
										</Typography>
									</div>

									<div className="border border-gray-200 rounded-lg overflow-x-auto">
										<Table size="small">
											<TableHead className="bg-gray-100">
												<TableRow>
													<TableCell sx={{ fontWeight: 700, fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase' }}>
														Section
													</TableCell>
													<TableCell align="center" sx={{ fontWeight: 700, fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase' }}>
														View
													</TableCell>
													<TableCell align="center" sx={{ fontWeight: 700, fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase' }}>
														Create
													</TableCell>
													<TableCell align="center" sx={{ fontWeight: 700, fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase' }}>
														Update
													</TableCell>
													<TableCell align="center" sx={{ fontWeight: 700, fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase' }}>
														Delete
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{sections.map((section) => (
													<TableRow key={section.key} className="hover:bg-slate-50 transition-colors">
														<TableCell sx={{ fontSize: 12.5, fontWeight: 500, color: 'text.primary' }}>
															{section.title}
														</TableCell>
														{(['canView', 'canCreate', 'canUpdate', 'canDelete'] as const).map(
															(flag) => (
																<TableCell key={flag} align="center" sx={{ py: 0.5 }}>
																	<Checkbox
																		checked={Boolean(matrix[section.key]?.[flag])}
																		onChange={() => toggleFlag(section.key, flag)}
																		size="small"
																		color="primary"
																	/>
																</TableCell>
															)
														)}
													</TableRow>
												))}
											</TableBody>
										</Table>
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
									onClick={() => setDialogOpen(false)}
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
									onClick={handleSave}
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
									{editing ? 'Save Changes' : 'Create Role'}
								</Button>
							</DialogActions>
						</div>
					</Dialog>

					{/* Custom Confirmation Dialog for Role Delete */}
					<Dialog
						open={confirmDeleteState.open}
						onClose={() => !isActionLoading && setConfirmDeleteState((prev) => ({ ...prev, open: false }))}
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
								<div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-500">
									<FuseSvgIcon size={24} className="text-red-500">
										heroicons-outline:trash
									</FuseSvgIcon>
								</div>
								<div className="flex flex-col">
									<h3 className="text-base font-bold text-slate-800 m-0">Delete Role</h3>
									<p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed m-0">
										Are you sure you want to delete role{' '}
										<strong className="text-slate-800 font-semibold">{confirmDeleteState.role?.role_name}</strong>?
										Users assigned to this role may lose their permissions.
									</p>
								</div>
							</div>
							<IconButton
								size="small"
								onClick={() => !isActionLoading && setConfirmDeleteState((prev) => ({ ...prev, open: false }))}
								className="text-slate-400 hover:text-slate-600 -mt-1 -mr-1"
							>
								<FuseSvgIcon size={18}>heroicons-outline:x-mark</FuseSvgIcon>
							</IconButton>
						</div>

						<div className="bg-slate-50/70 px-6 py-3.5 flex items-center justify-end gap-3 border-t border-slate-100">
							<button
								type="button"
								onClick={() => setConfirmDeleteState((prev) => ({ ...prev, open: false }))}
								disabled={isActionLoading}
								className="h-9 px-5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleConfirmDelete}
								disabled={isActionLoading}
								className="h-9 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs border-0 flex items-center gap-1.5"
							>
								{isActionLoading && <CircularProgress size={14} color="inherit" />}
								<span>Delete</span>
							</button>
						</div>
					</Dialog>
				</Paper>
			}
			scroll="content"
		/>
	);
}

export default RolesView;
