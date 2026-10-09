'use client';

import { useEffect, useMemo, useState } from 'react';
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
	'& .container': {
		maxWidth: '100%!important'
	}
}));

const emptyFlags = () => ({
	canView: false,
	canCreate: false,
	canUpdate: false,
	canDelete: false
});

function RolesView() {
	const { canView, canCreate, canUpdate, canDelete, scope } = usePermissions();
	const { enqueueSnackbar } = useSnackbar();
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

	const sections = sectionsRes?.data || [];
	const roles = rolesRes?.data || [];

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Role | null>(null);
	const [roleName, setRoleName] = useState('');
	const [description, setDescription] = useState('');
	const [matrix, setMatrix] = useState<Record<string, ReturnType<typeof emptyFlags>>>({});

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
			enqueueSnackbar(err instanceof Error ? err.message : 'Failed to save role.', {
				variant: 'error'
			});
		}
	};

	const handleDelete = async (role: Role) => {
		const roleId = role.id || role._id;
		if (!roleId) return;
		try {
			await deleteMutation.mutateAsync(roleId);
			enqueueSnackbar('Role deleted.', { variant: 'success' });
		} catch (err: unknown) {
			enqueueSnackbar(err instanceof Error ? err.message : 'Failed to delete role.', {
				variant: 'error'
			});
		}
	};

	const columns = useMemo<MRT_ColumnDef<Role>[]>(
		() => [
			{ accessorKey: 'role_name', header: 'Role' },
			{
				accessorKey: 'description',
				header: 'Description',
				Cell: ({ cell }) => cell.getValue<string>() || <span className="text-gray-300">—</span>
			},
			{
				accessorKey: 'scope',
				header: 'Scope',
				size: 100
			}
		],
		[]
	);

	if (!canView('roles')) {
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
				<div className="flex w-full flex-col justify-between gap-2 px-6 pt-4 pb-4 md:flex-row md:items-center">
					<div>
						<Typography className="text-3xl font-extrabold tracking-tight text-gray-900">
							Roles
						</Typography>
						<Typography
							color="text.secondary"
							className="mt-1 text-sm"
						>
							Define section permissions (view, create, update, delete) and assign them to users.
						</Typography>
					</div>
					{canCreate('roles') && (
						<Button
							variant="contained"
							startIcon={<FuseSvgIcon size={18}>heroicons-outline:plus</FuseSvgIcon>}
							onClick={openCreate}
						>
							Create Role
						</Button>
					)}
				</div>
			}
			content={
				<Box className="p-1">
					<DataTable
						columns={columns}
						data={roles}
						tableId="roles-management-table"
						enableRowActions
						positionActionsColumn="last"
						enableRowSelection={false}
						state={{ isLoading }}
						manualPagination={false}
						renderTopToolbarCustomActions={() => (
							<div className="ml-auto mr-2">
								<Tooltip title="Refresh">
									<IconButton onClick={() => refetch()}>
										<FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>
									</IconButton>
								</Tooltip>
							</div>
						)}
						renderRowActions={({ row }) => (
							<Box className="flex items-center">
								{canUpdate('roles') && (
									<IconButton onClick={() => openEdit(row.original)}>
										<FuseSvgIcon size={20}>heroicons-outline:pencil-square</FuseSvgIcon>
									</IconButton>
								)}
								{canDelete('roles') && !row.original.isSystem && (
									<IconButton
										className="text-red-500"
										onClick={() => handleDelete(row.original)}
									>
										<FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
									</IconButton>
								)}
							</Box>
						)}
					/>

					<Dialog
						open={dialogOpen}
						onClose={() => setDialogOpen(false)}
						maxWidth="md"
						fullWidth
					>
						<DialogTitle>{editing ? 'Edit Role' : 'Create Role'}</DialogTitle>
						<DialogContent className="flex flex-col gap-4 pt-2">
							<TextField
								label="Role name"
								value={roleName}
								onChange={(e) => setRoleName(e.target.value)}
								fullWidth
							/>
							<TextField
								label="Description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								fullWidth
								multiline
								minRows={2}
							/>
							<Typography className="font-semibold">Section permissions</Typography>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Section</TableCell>
										<TableCell align="center">View</TableCell>
										<TableCell align="center">Create</TableCell>
										<TableCell align="center">Update</TableCell>
										<TableCell align="center">Delete</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{sections.map((section) => (
										<TableRow key={section.key}>
											<TableCell>{section.title}</TableCell>
											{(['canView', 'canCreate', 'canUpdate', 'canDelete'] as const).map(
												(flag) => (
													<TableCell
														key={flag}
														align="center"
													>
														<FormControlLabel
															control={
																<Checkbox
																	checked={Boolean(matrix[section.key]?.[flag])}
																	onChange={() => toggleFlag(section.key, flag)}
																/>
															}
															label=""
														/>
													</TableCell>
												)
											)}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setDialogOpen(false)}>Cancel</Button>
							<Button
								variant="contained"
								onClick={handleSave}
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

export default RolesView;
