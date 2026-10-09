'use client';
import { useState, useMemo, useCallback } from 'react';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Box,
	Typography,
	IconButton,
	Tooltip,
	Dialog,
	CircularProgress,
	Select,
	MenuItem,
	FormControl,
	Paper
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { type MRT_ColumnDef, type MRT_SortingState, type MRT_Row } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { useAutoScrollRef } from 'src/hooks/useAutoScrollRef';
import moment from 'moment';
import { useAllPlans, useUpdatePlanStatus } from '../../api/hooks/usePlans';
import { Plan } from '../../api/services/plansApiService';
import { Navigate } from 'react-router';
import usePermissions from '@/hooks/usePermissions';
import PlanFormDialog from '../forms/PlanFormDialog';
import CustomStatusSwitch from '@/components/CustomSwitch';

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

function PlansHeader({
	statusFilter,
	onStatusChange,
	onRefresh,
	onAddNew,
	canCreate
}: {
	statusFilter: string;
	onStatusChange: (val: string) => void;
	onRefresh: () => void;
	onAddNew: () => void;
	canCreate: boolean;
}) {
	return (
		<div className="w-full bg-primary-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-md">
			{/* Left Title & Icon */}
			<div className="flex items-center gap-2.5 w-full sm:w-auto">
				<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 text-white">
					<FuseSvgIcon size={18} className="text-white">
						heroicons-outline:cube
					</FuseSvgIcon>
				</div>
				<h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0">
					Plans
				</h1>
			</div>

			{/* Right Controls: Status Filter, Refresh, Add New Plan */}
			<div className="flex items-center gap-2 w-full sm:w-auto">
				{/* Status Filter */}
				<FormControl size="small" className="min-w-[115px] bg-white rounded-lg shadow-xs" sx={{ height: '32px' }}>
					<Select
						value={statusFilter}
						onChange={(e) => onStatusChange(e.target.value)}
						displayEmpty
						className="text-xs sm:text-sm bg-white font-medium text-slate-700"
						sx={{
							height: '32px',
							borderRadius: '8px',
							'& .MuiOutlinedInput-notchedOutline': {
								border: 'none'
							},
							'& .MuiSelect-select': {
								py: 0,
								height: '32px',
								display: 'flex',
								alignItems: 'center'
							}
						}}
						renderValue={(selected) => {
							if (!selected) {
								return (
									<span className="flex items-center gap-1.5 text-slate-600 text-xs sm:text-sm font-medium">
										<FuseSvgIcon size={15} className="text-slate-500">
											heroicons-outline:funnel
										</FuseSvgIcon>
										Status
									</span>
								);
							}
							return (
								<span className="flex items-center gap-1.5 text-slate-800 text-xs sm:text-sm font-semibold">
									<FuseSvgIcon size={15} className="text-slate-600">
										heroicons-outline:funnel
									</FuseSvgIcon>
									{selected === 'active' ? 'Active' : selected === 'inactive' ? 'Inactive' : 'All Status'}
								</span>
							);
						}}
					>
						<MenuItem value="">
							<span className="text-xs sm:text-sm">All Status</span>
						</MenuItem>
						<MenuItem value="active">
							<span className="text-xs sm:text-sm">Active</span>
						</MenuItem>
						<MenuItem value="inactive">
							<span className="text-xs sm:text-sm">Inactive</span>
						</MenuItem>
					</Select>
				</FormControl>

				{/* Refresh Button */}
				<Tooltip title="Refresh plans list" arrow>
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

				{canCreate && (
					<button
						type="button"
						onClick={onAddNew}
						style={{ height: '32px' }}
						className="h-8 px-3 bg-primary-800 hover:bg-primary-900 text-white text-xs sm:text-sm font-semibold rounded-lg border border-white/80 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
					>
						<FuseSvgIcon size={15} className="text-white">
							heroicons-outline:plus
						</FuseSvgIcon>
						<span>Add Plan</span>
					</button>
				)}
			</div>
		</div>
	);
}

function PlansContent({
	plans,
	isLoading,
	error,
	pagination,
	setPagination,
	globalFilter,
	setGlobalFilter,
	sorting,
	setSorting,
	totalPages,
	totalResults,
	onEditPlan,
	canUpdate,
	canDelete
}: {
	plans: Plan[];
	isLoading: boolean;
	error: unknown;
	pagination: { pageIndex: number; pageSize: number };
	setPagination: React.Dispatch<React.SetStateAction<{ pageIndex: number; pageSize: number }>>;
	globalFilter: string;
	setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
	sorting: MRT_SortingState;
	setSorting: React.Dispatch<React.SetStateAction<MRT_SortingState>>;
	totalPages: number;
	totalResults: number;
	onEditPlan: (plan: Plan) => void;
	canUpdate: boolean;
	canDelete: boolean;
}) {
	const autoScrollRef = useAutoScrollRef<HTMLDivElement>();
	const updateStatusMutation = useUpdatePlanStatus();
	const { enqueueSnackbar } = useSnackbar();

	// Confirmation Dialog state
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		type: 'status' | 'delete';
		plan: Plan | null;
		targetStatus?: number;
	}>({
		open: false,
		type: 'delete',
		plan: null
	});
	const [isActionLoading, setIsActionLoading] = useState(false);

	const handleOpenStatusConfirm = useCallback((plan: Plan, currentStatus: number) => {
		setConfirmState({
			open: true,
			type: 'status',
			plan,
			targetStatus: currentStatus === 1 ? 0 : 1
		});
	}, []);

	const handleOpenDeleteConfirm = useCallback((plan: Plan) => {
		setConfirmState({
			open: true,
			type: 'delete',
			plan
		});
	}, []);

	const handleConfirmAction = useCallback(async () => {
		if (!confirmState.plan) return;
		const planId = (confirmState.plan._id || confirmState.plan.id) as string;
		if (!planId) {
			enqueueSnackbar('Plan ID is missing. Please refresh and try again.', { variant: 'error' });
			return;
		}

		setIsActionLoading(true);
		try {
			if (confirmState.type === 'delete') {
				await updateStatusMutation.mutateAsync({
					planId,
					status: 2 // Soft delete
				});
				enqueueSnackbar(`Plan "${confirmState.plan.name}" has been deleted.`, {
					variant: 'success',
					autoHideDuration: 2000
				});
			} else if (confirmState.type === 'status' && confirmState.targetStatus !== undefined) {
				await updateStatusMutation.mutateAsync({
					planId,
					status: confirmState.targetStatus
				});
				enqueueSnackbar(
					`Plan status updated to ${confirmState.targetStatus === 1 ? 'Active' : 'Inactive'}.`,
					{
						variant: 'success',
						autoHideDuration: 2000
					}
				);
			}
			setConfirmState({ open: false, type: 'delete', plan: null });
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : String(err);
			enqueueSnackbar(errMsg || 'Action failed. Please try again.', { variant: 'error' });
		} finally {
			setIsActionLoading(false);
		}
	}, [confirmState, updateStatusMutation, enqueueSnackbar]);

	const columns = useMemo<MRT_ColumnDef<Plan>[]>(
		() => [
			{
				accessorKey: 'name',
				header: 'PLAN NAME',
				minSize: 180,
				Cell: ({ cell }) => {
					const name = cell.getValue<string>() || '';
					return (
						<Tooltip title={name} arrow>
							<Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
								{name}
							</Typography>
						</Tooltip>
					);
				}
			},
			{
				accessorKey: 'price',
				header: 'PRICE ($)',
				size: 140,
				Cell: ({ cell }) => {
					const val = cell.getValue<number>();
					const formattedPrice = val !== undefined && val !== null ? `$${Number(val).toLocaleString()}` : '$0';
					return (
						<div className="flex items-baseline gap-1">
							<span className="font-bold text-[13px] text-[#059669]">
								{formattedPrice}
							</span>
							<span className="text-[11px] text-slate-500 font-normal">
								/ mo
							</span>
						</div>
					);
				}
			},
			{
				accessorKey: 'marketplace',
				header: 'MARKETPLACES',
				size: 150,
				Cell: ({ cell }) => {
					const val = cell.getValue<number>() ?? 0;
					return (
						<div className="flex items-center gap-1.5">
							<FuseSvgIcon size={16} className="text-sky-600 shrink-0">
								heroicons-outline:building-storefront
							</FuseSvgIcon>
							<span className="font-bold text-[13px] text-slate-800">
								{val}
							</span>
							<span className="text-[11.5px] text-slate-500 font-normal">
								{val === 1 ? 'Marketplace' : 'Marketplaces'}
							</span>
						</div>
					);
				}
			},
			{
				accessorKey: 'request_quota',
				header: 'MONTHLY QUOTA',
				size: 170,
				Cell: ({ cell }) => {
					const val = cell.getValue<number>() ?? 0;
					return (
						<div className="flex items-center gap-1.5">
							<FuseSvgIcon size={16} className="text-primary-600 shrink-0">
								heroicons-outline:envelope
							</FuseSvgIcon>
							<span className="font-bold text-[13px] text-slate-800">
								{Number(val).toLocaleString()}
							</span>
							<span className="text-[11.5px] text-slate-500 font-normal">
								req / mo
							</span>
						</div>
					);
				}
			},
			{
				accessorKey: 'expireAt',
				header: 'EXPIRES AT',
				size: 165,
				Cell: ({ cell, row }: { cell: any; row: MRT_Row<Plan> }) => {
					const val = (cell.getValue?.() as string) || row.original?.expireAt;
					const isValid = Boolean(val && moment(val).isValid());

					if (!isValid) {
						return (
							<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
								<FuseSvgIcon size={14} className="text-slate-400">
									heroicons-outline:minus-circle
								</FuseSvgIcon>
								<span>No Expiry</span>
							</span>
						);
					}

					const mDate = moment(val);
					const isPast = mDate.isBefore(moment(), 'day');
					const daysLeft = mDate.diff(moment(), 'days');
					const isExpiringSoon = !isPast && daysLeft <= 45;

					let badgeClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/90';
					let iconColor = 'text-indigo-600';
					let icon = 'heroicons-outline:calendar-days';
					let tooltipSuffix = `${daysLeft} days remaining`;

					if (isPast) {
						badgeClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
						iconColor = 'text-rose-600';
						icon = 'heroicons-outline:exclamation-circle';
						tooltipSuffix = 'Expired';
					} else if (isExpiringSoon) {
						badgeClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
						iconColor = 'text-amber-600';
						icon = 'heroicons-outline:clock';
						tooltipSuffix = `Expiring soon (${daysLeft} days left)`;
					}

					const formatted = mDate.format('DD MMM YYYY');

					return (
						<Tooltip title={`${formatted} • ${tooltipSuffix}`} arrow>
							<div
								className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-2xs ${badgeClasses}`}
							>
								<FuseSvgIcon size={14} className={`${iconColor} shrink-0`}>
									{icon}
								</FuseSvgIcon>
								<span className="tracking-tight">{formatted}</span>
							</div>
						</Tooltip>
					);
				}
			},
			{
				accessorKey: 'createdAt',
				header: 'CREATED AT',
				size: 150,
				Cell: ({ cell, row }: { cell: any; row: MRT_Row<Plan> }) => {
					const val = (cell.getValue?.() as string) || row.original?.createdAt;
					const formatted = val && moment(val).isValid() ? moment(val).format('DD MMM YYYY, hh:mm A') : 'N/A';
					return (
						<Tooltip title={formatted} arrow>
							<Typography sx={{ fontSize: 12, color: val ? 'text.secondary' : 'text.disabled' }}>
								{formatted}
							</Typography>
						</Tooltip>
					);
				}
			}
		],
		[]
	);

	if (error) {
		return (
			<Box className="p-6">
				<Typography color="error">Failed to load plans list. Please try again later.</Typography>
			</Box>
		);
	}

	return (
		<>
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
					data={plans}
					tableId="plans-management-table"
					enableRowActions
					positionActionsColumn="last"
					enableRowSelection={false}
					state={{
						isLoading,
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
					renderRowActions={({ row }: { row: MRT_Row<Plan> }) => (
						<Box className="flex items-center gap-1.5">
							{canUpdate && (
								<Tooltip title={row.original.status === 1 ? 'Click to deactivate plan' : 'Click to activate plan'} arrow>
									<Box
										onClick={() => handleOpenStatusConfirm(row.original, row.original.status)}
										className="cursor-pointer inline-flex items-center p-1"
									>
										<CustomStatusSwitch
											size="small"
											checked={row.original.status === 1}
											sx={{ pointerEvents: 'none' }}
										/>
									</Box>
								</Tooltip>
							)}

							{canUpdate && (
								<Tooltip title="Edit plan details" arrow>
									<IconButton
										size="small"
										onClick={() => onEditPlan(row.original)}
										className="text-gray-500 hover:text-primary-700 p-1.5"
									>
										<FuseSvgIcon size={18}>heroicons-outline:pencil</FuseSvgIcon>
									</IconButton>
								</Tooltip>
							)}

							{canDelete && (
								<Tooltip title="Delete plan" arrow>
									<IconButton
										size="small"
										onClick={() => handleOpenDeleteConfirm(row.original)}
										className="text-red-500 hover:text-red-700 p-1.5"
									>
										<FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
									</IconButton>
								</Tooltip>
							)}
						</Box>
					)}
				/>
			</Paper>

			{/* Custom Confirmation Dialog for Delete & Status Change */}
			<Dialog
				open={confirmState.open}
				onClose={() => !isActionLoading && setConfirmState((prev) => ({ ...prev, open: false }))}
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
							className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${confirmState.type === 'delete' ? 'bg-red-100 text-red-500' : 'bg-primary-100 text-primary-700'
								}`}
						>
							<FuseSvgIcon size={24} className={confirmState.type === 'delete' ? 'text-red-500' : 'text-primary-700'}>
								{confirmState.type === 'delete'
									? 'heroicons-outline:trash'
									: 'heroicons-outline:arrow-path-rounded-square'}
							</FuseSvgIcon>
						</div>
						<div className="flex flex-col">
							<h3 className="text-base font-bold text-slate-800 m-0">
								{confirmState.type === 'delete' ? 'Delete Plan' : 'Change Plan Status'}
							</h3>
							<p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed m-0">
								{confirmState.type === 'delete'
									? `Are you sure you want to delete "${confirmState.plan?.name}"?`
									: `Are you sure you want to change status of "${confirmState.plan?.name}" to ${confirmState.targetStatus === 1 ? 'Active' : 'Inactive'
									}?`}
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
						className={`h-9 px-5 rounded-lg text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs border-0 flex items-center gap-1.5 ${confirmState.type === 'delete'
							? 'bg-red-600 hover:bg-red-700'
							: 'bg-primary-800 hover:bg-primary-900'
							}`}
					>
						{isActionLoading && <CircularProgress size={14} color="inherit" />}
						<span>{confirmState.type === 'delete' ? 'Delete' : 'Change Status'}</span>
					</button>
				</div>
			</Dialog>
		</>
	);
}

export default function PlansView() {
	const { canView, canCreate, canUpdate, canDelete } = usePermissions();
	const hasAccess = canView('plans');
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
	const [globalFilter, setGlobalFilter] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [sorting, setSorting] = useState<MRT_SortingState>([]);

	// Form Dialog state
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

	const sortByParam = useMemo(() => {
		if (!sorting || sorting.length === 0) return 'createdAt:desc';
		const sortField = sorting[0].id;
		const sortDesc = sorting[0].desc ? 'desc' : 'asc';
		return `${sortField}:${sortDesc}`;
	}, [sorting]);

	const {
		data: plansData,
		isLoading,
		error,
		refetch
	} = useAllPlans(
		{
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
			search: globalFilter,
			status: statusFilter === 'active' ? 1 : statusFilter === 'inactive' ? 0 : undefined,
			sortBy: sortByParam
		},
		hasAccess
	);

	const rawPlans = useMemo(() => {
		if (!plansData) return [];
		if (Array.isArray(plansData.data)) return plansData.data;
		if (Array.isArray((plansData as any).results)) return (plansData as any).results;
		return [];
	}, [plansData]);

	const plans = useMemo(() => {
		if (!statusFilter) return rawPlans;
		if (statusFilter === 'active') return rawPlans.filter((p) => p.status === 1);
		if (statusFilter === 'inactive') return rawPlans.filter((p) => p.status !== 1);
		return rawPlans;
	}, [rawPlans, statusFilter]);

	const totalResults = useMemo(() => {
		return plansData?.pagination?.totalResults ?? (plansData as any)?.pagination?.total ?? rawPlans.length ?? 0;
	}, [plansData, rawPlans.length]);

	const totalPages = useMemo(() => {
		return plansData?.pagination?.totalPages || Math.ceil(totalResults / pagination.pageSize) || 1;
	}, [plansData, totalResults, pagination.pageSize]);

	const handleOpenCreate = () => {
		setSelectedPlan(null);
		setFormDialogOpen(true);
	};

	const handleOpenEdit = (plan: Plan) => {
		setSelectedPlan(plan);
		setFormDialogOpen(true);
	};

	const handleCloseForm = () => {
		setFormDialogOpen(false);
		setSelectedPlan(null);
	};

	const handleStatusChange = useCallback((val: string) => {
		setStatusFilter(val);
		setPagination((prev) => ({
			...prev,
			pageIndex: 0
		}));
	}, []);

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

	const handleRefresh = useCallback(() => {
		setStatusFilter('');
		setGlobalFilter('');
		setPagination((prev) => ({
			...prev,
			pageIndex: 0
		}));
		refetch();
	}, [refetch]);

	if (!hasAccess) {
		return <Navigate to="/" replace />;
	}

	return (
		<>
			<Root
				header={
					<PlansHeader
						statusFilter={statusFilter}
						onStatusChange={handleStatusChange}
						onRefresh={handleRefresh}
						onAddNew={handleOpenCreate}
						canCreate={canCreate('plans')}
					/>
				}
				content={
					<PlansContent
						plans={plans}
						isLoading={isLoading}
						error={error}
						pagination={pagination}
						setPagination={setPagination}
						globalFilter={globalFilter}
						setGlobalFilter={handleGlobalFilterChange}
						sorting={sorting}
						setSorting={setSorting}
						totalPages={totalPages}
						totalResults={totalResults}
						onEditPlan={handleOpenEdit}
						canUpdate={canUpdate('plans')}
						canDelete={canDelete('plans')}
					/>
				}
				scroll="content"
			/>

			<PlanFormDialog
				open={formDialogOpen}
				onClose={handleCloseForm}
				plan={selectedPlan}
			/>
		</>
	);
}
