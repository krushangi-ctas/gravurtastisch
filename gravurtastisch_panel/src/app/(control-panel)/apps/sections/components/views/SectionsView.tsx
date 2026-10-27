'use client';

import { useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AccessDeniedView from '@/components/AccessDeniedView';
import ManagementTabs from '@/components/ManagementTabs';
import { styled } from '@mui/material/styles';
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	FormControlLabel,
	IconButton,
	InputAdornment,
	Paper,
	Switch,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { type MRT_ColumnDef, type MRT_SortingState } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { useAutoScrollRef } from 'src/hooks/useAutoScrollRef';
import usePermissions from '@/hooks/usePermissions';
import { getErrorMessage } from '@/utils/errorMessage';
import {
	useCreateSection,
	useDeleteSection,
	useSectionsList,
	useToggleSectionStatus,
	useUpdateSection
} from '../../api/hooks/useSections';
import { SectionItem } from '../../api/services/sectionsApiService';

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
		flexDirection: 'column'
	},
	'& .FusePageCarded-content': {
		flex: '1 1 auto',
		overflow: 'hidden!important',
		display: 'flex',
		flexDirection: 'column'
	}
}));

export type SectionsViewProps = {
	managementTab?: 'sections';
};

function SectionsView({ managementTab = 'sections' }: SectionsViewProps = {}) {
	const { canView, canCreate, canUpdate, canDelete, scope } = usePermissions();
	const { enqueueSnackbar } = useSnackbar();
	const autoScrollRef = useAutoScrollRef<HTMLDivElement>();

	const hasAccess = canView('sections');

	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
	const [globalFilter, setGlobalFilter] = useState('');
	const [sorting, setSorting] = useState<MRT_SortingState>([]);

	const sortKey = sorting[0]?.id || 'createdAt';
	const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
	const sortBy = sorting.length > 0 ? `${sortKey}:${sortOrder}` : undefined;

	const listParams = useMemo(
		() => ({
			scope,
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
			search: (typeof globalFilter === 'string' ? globalFilter.trim() : '') || undefined,
			sortBy
		}),
		[scope, pagination.pageIndex, pagination.pageSize, globalFilter, sortBy]
	);

	// Directly uses scope ('admin' or 'seller')
	const { data: sectionsRes, isLoading, refetch } = useSectionsList(
		listParams,
		hasAccess
	);

	const createMutation = useCreateSection();
	const updateMutation = useUpdateSection();
	const deleteMutation = useDeleteSection();
	const toggleStatusMutation = useToggleSectionStatus();

	// Modal state for Add/Edit
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
	const [name, setName] = useState('');
	const [title, setTitle] = useState('');
	const [status, setStatus] = useState<number>(1);
	const [errors, setErrors] = useState<{ name?: string; title?: string }>({});

	// Confirmation Dialog state for Status Change & Delete (matching Admin Users)
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		type: 'status' | 'delete';
		section: SectionItem | null;
		targetStatus?: number;
	}>({
		open: false,
		type: 'status',
		section: null
	});
	const [isActionLoading, setIsActionLoading] = useState(false);

	const handleTitleChange = (val: string) => {
		setTitle(val);
		if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
	};

	const handleNameChange = (val: string) => {
		setName(val);
		if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
	};

	const openCreate = () => {
		setEditingSection(null);
		setName('');
		setTitle('');
		setStatus(1);
		setErrors({});
		setDialogOpen(true);
	};

	const openEdit = (sec: SectionItem) => {
		setEditingSection(sec);
		setName(sec.name);
		setTitle(sec.title);
		setStatus(sec.status !== undefined ? sec.status : 1);
		setErrors({});
		setDialogOpen(true);
	};

	const validateForm = () => {
		const nextErrors: { name?: string; title?: string } = {};
		const trimmedTitle = title.trim();
		const trimmedName = name.trim().toLowerCase();

		if (!trimmedTitle) {
			nextErrors.title = 'Section name is required!';
		} else if (trimmedTitle.length < 2) {
			nextErrors.title = 'Section name must be at least 2 characters.';
		}

		if (!trimmedName) {
			nextErrors.name = 'Section path is required!';
		} else if (!/^[a-z0-9_/.-]+$/.test(trimmedName)) {
			nextErrors.name = 'Section path can only contain lowercase alphanumeric characters, slashes, dashes, or underscores.';
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm()) {
			return;
		}

		setIsActionLoading(true);
		const defaultPermissions = { add: true, update: true, delete: true, view: true };
		try {
			if (editingSection) {
				const sectionId = editingSection.id || editingSection._id;
				if (!sectionId) throw new Error('Missing section id');

				await updateMutation.mutateAsync({
					sectionId,
					payload: {
						name: name.trim().toLowerCase(),
						title: title.trim(),
						permissions: defaultPermissions,
						status
					}
				});
				enqueueSnackbar('Section updated successfully.', { variant: 'success' });
			} else {
				await createMutation.mutateAsync({
					name: name.trim().toLowerCase(),
					title: title.trim(),
					scope,
					permissions: defaultPermissions,
					status
				});
				enqueueSnackbar('Section created successfully.', { variant: 'success' });
			}
			setDialogOpen(false);
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, 'Failed to save section.');
			enqueueSnackbar(errMsg, { variant: 'error' });
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleOpenStatusConfirm = (sec: SectionItem, currentStatus: number) => {
		(document.activeElement as HTMLElement)?.blur();
		setConfirmState({
			open: true,
			type: 'status',
			section: sec,
			targetStatus: currentStatus === 1 ? 0 : 1
		});
	};

	const handleOpenDeleteConfirm = (sec: SectionItem) => {
		(document.activeElement as HTMLElement)?.blur();
		setConfirmState({
			open: true,
			type: 'delete',
			section: sec
		});
	};

	const handleConfirmAction = async () => {
		if (!confirmState.section) return;
		const sectionId = confirmState.section.id || confirmState.section._id;
		if (!sectionId) return;

		setIsActionLoading(true);
		try {
			if (confirmState.type === 'delete') {
				await deleteMutation.mutateAsync(sectionId);
				enqueueSnackbar(
					`"${confirmState.section.title || confirmState.section.name}" has been deleted successfully.`,
					{ variant: 'success', autoHideDuration: 2000 }
				);
			} else if (confirmState.type === 'status' && confirmState.targetStatus !== undefined) {
				await toggleStatusMutation.mutateAsync({ sectionId, status: confirmState.targetStatus });
				enqueueSnackbar(
					`Section status updated to ${confirmState.targetStatus === 1 ? 'Active' : 'Inactive'}.`,
					{ variant: 'success', autoHideDuration: 2000 }
				);
			}
			setConfirmState((prev) => ({ ...prev, open: false, section: null }));
		} catch (err: unknown) {
			const errMsg = getErrorMessage(
				err,
				`Failed to ${confirmState.type === 'delete' ? 'delete' : 'update'} section.`
			);
			enqueueSnackbar(errMsg, { variant: 'error' });
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleRefresh = useCallback(() => {
		refetch();
	}, [refetch]);

	const columns = useMemo<MRT_ColumnDef<SectionItem>[]>(
		() => [
			{
				accessorKey: 'createdAt',
				header: 'DATE',
				size: 160,
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
				accessorKey: 'title',
				header: 'SECTION NAME',
				size: 200,
				Cell: ({ row }) => {
					const val = row.original.title || row.original.name || '—';
					return (
						<Tooltip title={val} arrow>
							<Typography
								sx={{
									fontSize: 12.5,
									fontWeight: 600,
									color: 'text.primary',
									textTransform: 'capitalize'
								}}
							>
								{val}
							</Typography>
						</Tooltip>
					);
				}
			},
			/* {
				accessorKey: 'name',
				header: 'SECTION PATH',
				size: 200,
				Cell: ({ row }) => {
					const val = row.original.name || '—';
					return (
						<Tooltip title={val} arrow>
							<Typography
								sx={{
									fontSize: 12,
									fontWeight: 500,
									color: 'text.secondary',
									fontFamily: 'monospace'
								}}
							>
								{val}
							</Typography>
						</Tooltip>
					);
				}
			}, */
			{
				accessorKey: 'status',
				header: 'STATUS',
				size: 130,
				Cell: ({ row }) => {
					const isActive = row.original.status === 1;
					return (
						<Tooltip
							title={
								!canUpdate('sections')
									? 'No permission to update'
									: isActive
										? 'Click to deactivate section'
										: 'Click to activate section'
							}
							arrow
						>
							<Box
								onClick={() => {
									if (!canUpdate('sections')) return;
									handleOpenStatusConfirm(row.original, row.original.status);
								}}
								className={
									canUpdate('sections')
										? 'cursor-pointer inline-flex items-center gap-1.5'
										: 'cursor-not-allowed opacity-60 inline-flex items-center gap-1.5'
								}
							>
								<Switch
									checked={isActive}
									disabled={!canUpdate('sections')}
									size="small"
									color="primary"
									sx={{ pointerEvents: 'none' }}
								/>
								<Typography
									sx={{
										fontSize: 11.5,
										fontWeight: 600,
										color: isActive ? 'primary.main' : 'text.disabled'
									}}
								>
									{isActive ? 'Active' : 'Inactive'}
								</Typography>
							</Box>
						</Tooltip>
					);
				}
			}
		],
		[canUpdate]
	);

	const sectionsData = useMemo(() => {
		const raw = (sectionsRes as any)?.data;
		if (Array.isArray(raw)) return raw;
		if (Array.isArray((sectionsRes as any)?.results)) return (sectionsRes as any)?.results;
		return [];
	}, [sectionsRes]);

	const totalResults = useMemo(() => {
		return (
			(sectionsRes as any)?.pagination?.totalResults ??
			(sectionsRes as any)?.pagination?.length ??
			(sectionsRes as any)?.pagination?.total ??
			sectionsData.length
		);
	}, [sectionsRes, sectionsData.length]);

	const totalPages = useMemo(() => {
		return (
			(sectionsRes as any)?.pagination?.totalPages ||
			(sectionsRes as any)?.pagination?.lastPage ||
			Math.ceil(totalResults / pagination.pageSize) ||
			1
		);
	}, [sectionsRes, totalResults, pagination.pageSize]);

	const handleGlobalFilterChange = useCallback((updaterOrValue: any) => {
		setGlobalFilter((prev) => {
			const newVal = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
			return typeof newVal === 'string' ? newVal : (newVal ?? '');
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

	if (!hasAccess) {
		return <AccessDeniedView sectionTitle="Sections" />;
	}

	// const canCreateSection = canCreate('sections');
	// const actionButtons = canCreateSection ? (
	// 	<button
	// 		type="button"
	// 		onClick={openCreate}
	// 		style={{ height: '36px' }}
	// 		className="h-[36px] flex-1 sm:flex-initial px-3.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border-0"
	// 	>
	// 		<FuseSvgIcon size={16} className="text-white">
	// 			heroicons-outline:plus
	// 		</FuseSvgIcon>
	// 		<span>Add Section</span>
	// 	</button>
	// ) : null;
	const actionButtons = null;

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
						data={sectionsData}
						tableId="sections-management-table"
						title="Sections"
						icon="heroicons-outline:squares-2x2"
						tabs={<ManagementTabs activeTab={managementTab} />}
						actionButtons={actionButtons}
						onRefresh={handleRefresh}
						enableRowActions={false}
						/* enableRowActions
						positionActionsColumn="last"
						displayColumnDefOptions={{
							'mrt-row-actions': {
								size: 80,
								minSize: 70,
								maxSize: 90
							}
						}} */
						enableRowSelection={false}
						state={{
							isLoading: Boolean(isLoading),
							showSkeletons: Boolean(isLoading),
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
						muiTableBodyRowProps={{
							sx: {
								minHeight: '38px',
								height: '38px'
							}
						}}
						muiTableProps={{
							sx: {
								minWidth: { xs: '700px', lg: '100%' },
								'& .MuiTableCell-root': {
									padding: '6px 10px',
									borderBottom: '1px solid',
									borderColor: 'divider',
									overflow: 'hidden',
									textOverflow: 'ellipsis'
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
								backgroundColor: (theme: any) =>
									theme.palette?.mode === 'dark' ? '#0f172a' : '#ffffff',
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
					/* renderRowActions={({ row }) => (
						<Box className="flex items-center gap-1">
							{canUpdate('sections') && (
								<Tooltip title="Edit section" arrow>
									<IconButton
										size="small"
										onClick={() => openEdit(row.original)}
										className="text-slate-600 hover:text-slate-900 p-1.5"
									>
										<FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
									</IconButton>
								</Tooltip>
							)}
							{canDelete('sections') && (
								<Tooltip title="Delete section" arrow>
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
					)} */
					/>

					{/* Create / Edit Section Dialog */}
					<Dialog
						open={dialogOpen}
						onClose={() => !isActionLoading && setDialogOpen(false)}
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
											heroicons-outline:squares-2x2
										</FuseSvgIcon>
									</div>
									<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0 truncate">
										{editingSection ? 'Edit Section' : 'Add New Section'}
									</h2>
								</div>
								<IconButton
									size="small"
									onClick={() => setDialogOpen(false)}
									disabled={isActionLoading}
									className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
									aria-label="Close"
								>
									<FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
								</IconButton>
							</div>

							<DialogContent
								className="p-4 sm:p-6 flex flex-col gap-4 bg-gray-50/60 dark:bg-slate-950"
								sx={{
									flex: '1 1 auto',
									overflowY: 'auto',
									minHeight: 0
								}}
							>
								{/* Section Basic Details Card */}
								<div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
									<div>
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Section Name <span className="text-red-500">*</span>
										</label>
										<TextField
											fullWidth
											required
											placeholder="e.g., Dashboard, Invoices, Team Reports"
											value={title}
											onChange={(e) => handleTitleChange(e.target.value)}
											error={!!errors.title}
											helperText={errors.title || 'Display name for the section (e.g. Dashboard, Invoices)'}
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
										<label className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block">
											Section Path <span className="text-red-500">*</span>
										</label>
										<TextField
											fullWidth
											required
											placeholder="e.g., /apps/sections, /dashboard, /apps/invoices"
											value={name}
											onChange={(e) => handleNameChange(e.target.value)}
											error={!!errors.name}
											helperText={errors.name || 'Path or route of the section (e.g. /apps/sections, /dashboard)'}
											variant="outlined"
											size="small"
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<FuseSvgIcon size={16} className="text-gray-400">
															heroicons-outline:link
														</FuseSvgIcon>
													</InputAdornment>
												)
											}}
										/>
									</div>
								</div>

								{/* Status Switch Card with Primary Color */}
								<div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between">
									<div>
										<label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
											Status
										</label>
										<span className="text-xs text-slate-500 dark:text-slate-400">
											Active sections will be available in role permission matrices
										</span>
									</div>
									<FormControlLabel
										control={
											<Switch
												checked={status === 1}
												onChange={(e) => setStatus(e.target.checked ? 1 : 0)}
												color="primary"
												size="medium"
											/>
										}
										label={
											<span className={`text-xs font-semibold ${status === 1 ? 'text-primary' : 'text-slate-400'}`}>
												{status === 1 ? 'Active' : 'Inactive'}
											</span>
										}
										sx={{ m: 0 }}
									/>
								</div>
							</DialogContent>

							{/* Bottom Action Footer */}
							<DialogActions
								className="px-4 sm:px-6 py-3 bg-slate-50/90 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0"
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
									disabled={isActionLoading}
									className="capitalize text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-4 sm:px-5 py-2 border border-slate-300 dark:border-slate-700 font-semibold text-xs sm:text-sm"
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
									disabled={isActionLoading}
									startIcon={
										isActionLoading ? (
											<CircularProgress size={16} color="inherit" />
										) : (
											<FuseSvgIcon size={18}>heroicons-outline:check</FuseSvgIcon>
										)
									}
									className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl px-5 sm:px-7 py-2 shadow-xs transition-all capitalize text-xs sm:text-sm"
									sx={{
										bgcolor: 'primary.main',
										'&:hover': { bgcolor: 'primary.dark' },
										borderRadius: '12px',
										textTransform: 'capitalize',
										px: { xs: 2.5, sm: 3.5 },
										py: 1
									}}
								>
									{editingSection ? 'Save Changes' : 'Create Section'}
								</Button>
							</DialogActions>
						</div>
					</Dialog>

					{/* Custom Confirmation Dialog for Section Status Change & Delete (matching Admin Users) */}
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
						<div className="p-6 pb-5 bg-white dark:bg-slate-900 flex items-start justify-between gap-4">
							<div className="flex items-start gap-3.5">
								<div
									className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${confirmState.type === 'delete'
											? 'bg-red-100 text-red-500 dark:bg-red-950/40'
											: 'bg-amber-100 text-amber-500 dark:bg-amber-950/40'
										}`}
								>
									<FuseSvgIcon
										size={24}
										className={confirmState.type === 'delete' ? 'text-red-500' : 'text-amber-500'}
									>
										{confirmState.type === 'delete'
											? 'heroicons-outline:trash'
											: 'heroicons-outline:exclamation-triangle'}
									</FuseSvgIcon>
								</div>
								<div className="flex flex-col">
									<h3 className="text-base font-bold text-slate-800 dark:text-slate-100 m-0">
										{confirmState.type === 'delete' ? 'Delete Section' : 'Change Section Status'}
									</h3>
									<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed m-0">
										{confirmState.type === 'delete' ? (
											<>
												Are you sure you want to delete{' '}
												<strong className="text-slate-800 dark:text-slate-200 font-semibold">
													{confirmState.section?.title || confirmState.section?.name}
												</strong>
												? This action cannot be undone.
											</>
										) : (
											<>
												Are you sure you want to change status of{' '}
												<strong className="text-slate-800 dark:text-slate-200 font-semibold">
													{confirmState.section?.title || confirmState.section?.name}
												</strong>{' '}
												to{' '}
												<strong className="text-slate-800 dark:text-slate-200 font-semibold">
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

						<div className="bg-slate-50/70 dark:bg-slate-800/50 px-6 py-3.5 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
							<button
								type="button"
								onClick={() => setConfirmState((prev) => ({ ...prev, open: false }))}
								disabled={isActionLoading}
								className="h-9 px-5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleConfirmAction}
								disabled={isActionLoading}
								className={`h-9 px-5 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs border-0 flex items-center gap-1.5 text-white ${confirmState.type === 'delete'
										? 'bg-red-600 hover:bg-red-700'
										: 'bg-primary hover:bg-primary-dark'
									}`}
							>
								{isActionLoading && <CircularProgress size={14} color="inherit" />}
								<span>{confirmState.type === 'delete' ? 'Delete' : 'Change Status'}</span>
							</button>
						</div>
					</Dialog>
				</Paper>
			}
		/>
	);
}

export default SectionsView;
