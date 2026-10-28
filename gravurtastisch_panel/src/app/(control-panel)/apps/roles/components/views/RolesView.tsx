'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AccessDeniedView from '@/components/AccessDeniedView';
import ManagementTabs from '@/components/ManagementTabs';
import { styled } from '@mui/material/styles';
import {
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
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
import { getErrorMessage } from '@/utils/errorMessage';
import { Role, RolePermission, RoleSectionItem } from '../../api/services/rolesApiService';

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


export type RolesViewProps = {
	managementTab?: 'roles';
};

function RolesView({ managementTab = 'roles' }: RolesViewProps = {}) {
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

	const isSavingRole = createMutation.isPending || updateMutation.isPending;

	const sections = useMemo(() => sectionsRes?.data || [], [sectionsRes?.data]);
	const roles = useMemo(() => rolesRes?.data || [], [rolesRes?.data]);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Role | null>(null);
	const [roleName, setRoleName] = useState('');
	const [description, setDescription] = useState('');
	const [matrix, setMatrix] = useState<Record<string, ReturnType<typeof emptyFlags>>>({});
	const [roleErrors, setRoleErrors] = useState<{
		roleName?: string;
		description?: string;
		permissions?: string;
	}>({});

	// Delete confirmation state
	const [confirmDeleteState, setConfirmDeleteState] = useState<{
		open: boolean;
		role: Role | null;
	}>({
		open: false,
		role: null
	});
	const [isActionLoading, setIsActionLoading] = useState(false);

	const validateRole = (
		nameVal: string,
		descVal: string,
		matrixVal: Record<string, ReturnType<typeof emptyFlags>>
	) => {
		const errs: { roleName?: string; description?: string; permissions?: string } = {};

		const trimmedName = nameVal.trim();
		if (!trimmedName) {
			errs.roleName = 'Role name is required!';
		} else if (trimmedName.length < 2) {
			errs.roleName = 'Role name must be at least 2 characters.';
		} else if (trimmedName.length > 60) {
			errs.roleName = 'Role name cannot exceed 60 characters.';
		}

		if (descVal.length > 255) {
			errs.description = 'Description cannot exceed 255 characters.';
		}

		const hasAnyPermission = Object.values(matrixVal).some(
			(flags) => flags.canView || flags.canCreate || flags.canUpdate || flags.canDelete
		);
		if (!hasAnyPermission) {
			errs.permissions = 'Please select at least one permission for this role.';
		}

		return errs;
	};

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
		setRoleErrors({});
		const next: Record<string, ReturnType<typeof emptyFlags>> = {};
		sections.forEach((section) => {
			next[section.key] = emptyFlags();
		});
		setMatrix(next);
		setDialogOpen(true);
	};

	const openEdit = (role: Role) => {
		setEditing(role);
		setRoleName(role.name || role.role_name);
		setDescription(role.description || '');
		setRoleErrors({});
		const next: Record<string, ReturnType<typeof emptyFlags>> = {};
		sections.forEach((section) => {
			const secKey = section.key || '';
			const cleanKey = secKey.replace(/^\//, '');

			// First look in section_list
			const foundInList = role.section_list?.find((s) => {
				if (s.name === secKey || (section.id && s.id === section.id)) return true;
				const cleanS = (s.name || '').replace(/^\//, '');
				return cleanS === cleanKey;
			});

			if (foundInList && foundInList.permissions) {
				next[section.key] = {
					canView: Boolean(foundInList.permissions.view),
					canCreate: Boolean(foundInList.permissions.add),
					canUpdate: Boolean(foundInList.permissions.update),
					canDelete: Boolean(foundInList.permissions.delete)
				};
				return;
			}

			// Fallback to legacy permissions
			const found = role.permissions?.find((p) => {
				if (p.section === secKey) return true;
				const cleanP = (p.section || '').replace(/^\//, '');
				if (cleanP === cleanKey) return true;
				if (
					(cleanP === 'user' || cleanP === 'users') &&
					(cleanKey === 'users' || cleanKey === 'admin-users')
				) {
					return true;
				}
				return false;
			});
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

	const toggleAll = (sectionKey: string) => {
		setMatrix((prev) => {
			const current = prev[sectionKey];
			const isAllSelected = Boolean(
				current?.canView &&
				current?.canCreate &&
				current?.canUpdate &&
				current?.canDelete
			);
			const target = !isAllSelected;
			return {
				...prev,
				[sectionKey]: {
					canView: target,
					canCreate: target,
					canUpdate: target,
					canDelete: target
				}
			};
		});
	};

	const buildPermissions = (): RolePermission[] =>
		Object.entries(matrix).map(([section, flags]) => ({
			section,
			...flags
		}));

	const buildSectionList = (): RoleSectionItem[] =>
		sections.map((sec) => {
			const flags = matrix[sec.key] || emptyFlags();
			const isAccessable = Boolean(flags.canView || flags.canCreate || flags.canUpdate || flags.canDelete);
			return {
				id: sec.id,
				name: sec.name || sec.key,
				title: sec.title,
				status: sec.status !== undefined ? sec.status : 1,
				permissions: {
					add: Boolean(flags.canCreate),
					delete: Boolean(flags.canDelete),
					update: Boolean(flags.canUpdate),
					view: Boolean(flags.canView)
				},
				isAccessable
			};
		});

	const handleSave = async () => {
		if (isSavingRole) return;
		const errs = validateRole(roleName, description, matrix);
		setRoleErrors(errs);
		if (Object.keys(errs).length > 0) {
			const firstErr = Object.values(errs)[0];
			enqueueSnackbar(firstErr, { variant: 'error' });
			return;
		}

		try {
			if (editing) {
				const roleId = editing.id || editing._id;
				if (!roleId) throw new Error('Missing role id');
				await updateMutation.mutateAsync({
					roleId,
					payload: {
						name: roleName.trim(),
						role_name: roleName.trim(),
						description: description.trim(),
						permissions: buildPermissions(),
						section_list: buildSectionList()
					}
				});
				enqueueSnackbar('Role updated successfully.', { variant: 'success' });
			} else {
				await createMutation.mutateAsync({
					name: roleName.trim(),
					role_name: roleName.trim(),
					description: description.trim(),
					scope,
					permissions: buildPermissions(),
					section_list: buildSectionList()
				});
				enqueueSnackbar('Role created successfully.', { variant: 'success' });
			}
			setDialogOpen(false);
			setRoleErrors({});
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, 'Failed to save role.');
			enqueueSnackbar(errMsg, {
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
			enqueueSnackbar(`Role "${confirmDeleteState.role.role_name}" has been deleted successfully.`, {
				variant: 'success',
				autoHideDuration: 2000
			});
			setConfirmDeleteState({ open: false, role: null });
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, 'Failed to delete role. Please try again.');
			enqueueSnackbar(errMsg, {
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
				accessorKey: 'createdAt',
				header: 'DATE',
				size: 160,
				minSize: 140,
				maxSize: 170,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					if (!val) {
						return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					}
					const m = moment(val);
					if (!m.isValid()) {
						return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					}
					return (
						<Tooltip title={m.format('DD MMM YYYY, hh:mm:ss A')} arrow>
							<Typography
								sx={{
									fontSize: 12,
									fontWeight: 400,
									color: 'text.secondary',
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
				accessorKey: 'role_name',
				header: 'ROLE',
				size: 150,
				minSize: 130,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>() || '—';
					return (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<FuseSvgIcon size={16} className="text-primary shrink-0">
								heroicons-outline:shield-check
							</FuseSvgIcon>
							<Tooltip title={val} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 600,
										color: 'text.primary',
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis'
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
				accessorKey: 'description',
				header: 'DESCRIPTION',
				size: 200,
				minSize: 150,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return (
						<Tooltip title={val || 'No description'} arrow>
							<Typography
								sx={{
									fontSize: 12,
									fontWeight: 400,
									color: val ? 'text.primary' : 'text.disabled',
									fontStyle: val ? 'normal' : 'italic',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									maxWidth: 220
								}}
							>
								{val || 'No description'}
							</Typography>
						</Tooltip>
					);
				}
			},
			{
				id: 'section_list',
				header: 'SECTIONS',
				size: 680,
				minSize: 450,
				accessorFn: (row) => {
					const list = row.section_list
						?.filter((s) => s.isAccessable || (s.permissions && (s.permissions.view || s.permissions.add || s.permissions.update || s.permissions.delete)))
						.map((s) => s.title || s.name) || [];
					return list.join(', ');
				},
				Cell: ({ row }) => {
					const role = row.original;
					const accessibleSections: string[] = [];
					const seen = new Set<string>();

					if (Array.isArray(role.section_list)) {
						role.section_list.forEach((item) => {
							const hasPerm =
								Boolean(item.isAccessable) ||
								Boolean(
									item.permissions?.view ||
									item.permissions?.add ||
									item.permissions?.update ||
									item.permissions?.delete
								);
							if (hasPerm) {
								const title = item.title || item.name;
								if (title && !seen.has(title)) {
									seen.add(title);
									accessibleSections.push(title);
								}
							}
						});
					}

					if (accessibleSections.length === 0 && Array.isArray(role.permissions)) {
						role.permissions.forEach((perm) => {
							const hasPerm = Boolean(perm.canView || perm.canCreate || perm.canUpdate || perm.canDelete);
							if (hasPerm && perm.section) {
								const matchedSec = sections.find(
									(s) => s.key === perm.section || s.name === perm.section || (s.id && s.id === perm.section)
								);
								const title = matchedSec?.title || perm.section.replace(/^\//, '').replace(/-/g, ' ');
								const formatted = title.charAt(0).toUpperCase() + title.slice(1);
								if (!seen.has(formatted)) {
									seen.add(formatted);
									accessibleSections.push(formatted);
								}
							}
						});
					}

					if (accessibleSections.length === 0) {
						return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					}

					return (
						<div className="flex items-center gap-1.5 py-0 w-full overflow-x-auto no-scrollbar">
							{accessibleSections.map((secTitle) => (
								<span
									key={secTitle}
									className="inline-flex items-center px-1.5 py-[2px] rounded text-[12px] font-medium leading-none whitespace-nowrap shrink-0 border bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50"
								>
									{secTitle}
								</span>
							))}
						</div>
					);
				}
			}
		],
		[sections]
	);

	if (!canAccessRoles) {
		return <AccessDeniedView sectionTitle="Roles" />;
	}

	const canCreateRole = canCreate('roles');
	const actionButtons = canCreateRole ? (
		<button
			type="button"
			onClick={openCreate}
			style={{ height: '36px' }}
			className="h-[36px] flex-1 sm:flex-initial px-3.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border-0"
		>
			<FuseSvgIcon size={16} className="text-white">
				heroicons-outline:plus
			</FuseSvgIcon>
			<span>Add Role</span>
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
						data={roles}
						tableId="roles-management-table-v3"
						title="Roles"
						icon="heroicons-outline:shield-check"
						tabs={<ManagementTabs activeTab={managementTab} />}
						actionButtons={actionButtons}
						onRefresh={handleRefresh}
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
						state={{
							isLoading: Boolean(isLoading || sectionsLoading),
							showSkeletons: Boolean(isLoading || sectionsLoading)
						}}
						manualPagination={false}
						muiTableBodyRowProps={{
							sx: {
								minHeight: '34px',
								height: '34px'
							}
						}}
						muiTableProps={{
							sx: {
								minWidth: { xs: '700px', lg: '100%' },
								'& .MuiTableCell-root': {
									padding: '4px 10px',
									borderBottom: '1px solid',
									borderColor: 'divider',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
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
								backgroundColor: 'background.paper',
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
						onClose={() => !isSavingRole && setDialogOpen(false)}
						disableRestoreFocus
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
							<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
								<div className="flex items-center gap-2.5">
									<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
										<FuseSvgIcon size={18} className="text-primary">
											heroicons-outline:shield-check
										</FuseSvgIcon>
									</div>
									<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0 truncate">
										{editing ? 'Edit Role' : 'Create Role'}
									</h2>
								</div>

								<IconButton
									size="small"
									onClick={() => setDialogOpen(false)}
									disabled={isSavingRole}
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
								{/* Role Details Card */}
								<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
									<div>
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Role Name <span className="text-red-500">*</span>
										</label>
										<TextField
											fullWidth
											required
											placeholder="e.g., Production Lead, Support Specialist"
											value={roleName}
											onChange={(e) => {
												setRoleName(e.target.value);
												if (roleErrors.roleName) setRoleErrors((prev) => ({ ...prev, roleName: undefined }));
											}}
											error={!!roleErrors.roleName}
											helperText={roleErrors.roleName}
											variant="outlined"
											size="small"
											inputProps={{ maxLength: 60 }}
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
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Description
										</label>
										<TextField
											fullWidth
											placeholder="Briefly describe responsibilities and scope for this role..."
											value={description}
											onChange={(e) => {
												setDescription(e.target.value);
												if (roleErrors.description) setRoleErrors((prev) => ({ ...prev, description: undefined }));
											}}
											error={!!roleErrors.description}
											helperText={roleErrors.description}
											variant="outlined"
											size="small"
											multiline
											minRows={2}
											inputProps={{ maxLength: 255 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: '3px' }}>
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
											<TableHead className="bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
												<TableRow>
													<TableCell sx={{ fontWeight: 700, fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase' }}>
														Section
													</TableCell>
													<TableCell align="center" sx={{ fontWeight: 700, fontSize: 11.5, color: 'text.secondary', textTransform: 'uppercase' }}>
														All
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
												{sections.map((section) => {
													const flags = matrix[section.key];
													const isAllSelected = Boolean(
														flags?.canView &&
														flags?.canCreate &&
														flags?.canUpdate &&
														flags?.canDelete
													);

													return (
														<TableRow key={section.key} className="hover:bg-slate-50 transition-colors">
															<TableCell sx={{ fontSize: 12.5, fontWeight: 500, color: 'text.primary' }}>
																<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																	<span>{section.title}</span>
																	{section.isCustom && (
																		<Chip
																			label="Custom"
																			size="small"
																			sx={{
																				height: 18,
																				fontSize: 10,
																				fontWeight: 600,
																				bgcolor: 'rgba(59, 130, 246, 0.1)',
																				color: 'primary.main',
																				border: '1px solid rgba(59, 130, 246, 0.2)'
																			}}
																		/>
																	)}
																</Box>
															</TableCell>
															<TableCell align="center" sx={{ py: 0.5 }}>
																<Checkbox
																	checked={isAllSelected}
																	onChange={() => toggleAll(section.key)}
																	size="small"
																	color="primary"
																	sx={{
																		p: 0.5,
																		'& .MuiSvgIcon-root': { fontSize: 18 }
																	}}
																/>
															</TableCell>
															{(['canView', 'canCreate', 'canUpdate', 'canDelete'] as const).map(
																(flag) => (
																	<TableCell key={flag} align="center" sx={{ py: 0.5 }}>
																		<Checkbox
																			checked={Boolean(matrix[section.key]?.[flag])}
																			onChange={() => toggleFlag(section.key, flag)}
																			size="small"
																			color="primary"
																			sx={{
																				p: 0.5,
																				'& .MuiSvgIcon-root': { fontSize: 18 }
																			}}
																		/>
																	</TableCell>
																)
															)}
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</div>
									{roleErrors.permissions && (
										<Typography variant="caption" color="error" className="font-semibold px-2 block">
											{roleErrors.permissions}
										</Typography>
									)}
								</div>
							</DialogContent>

							{/* Bottom Action Footer */}
							<DialogActions
								className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0"
								sx={{
									flexShrink: 0,
									borderTop: '1px solid',
									borderColor: 'divider',
									bgcolor: 'background.default',
									px: { xs: 2, sm: 3 },
									py: 1.5
								}}
							>
								<Button
									onClick={() => setDialogOpen(false)}
									disabled={isSavingRole}
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
									disabled={isSavingRole}
									className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl px-5 sm:px-7 py-2 shadow-xs transition-all capitalize text-xs sm:text-sm disabled:opacity-50"
									startIcon={
										<FuseSvgIcon size={18} className={isSavingRole ? 'animate-spin' : ''}>
											{isSavingRole ? 'heroicons-outline:arrow-path' : 'lucide:save'}
										</FuseSvgIcon>
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
									{isSavingRole ? 'Saving...' : editing ? 'Save Changes' : 'Create Role'}
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
