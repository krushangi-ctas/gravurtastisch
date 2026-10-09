'use client';
import { useState, useMemo, useCallback } from 'react';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Box,
	Typography,
	IconButton,
	Dialog,
	Tooltip,
	Select,
	MenuItem,
	FormControl,
	CircularProgress,
	Paper
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { type MRT_ColumnDef, type MRT_SortingState } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { useAutoScrollRef } from 'src/hooks/useAutoScrollRef';
import { Navigate } from 'react-router';
import usePermissions from '@/hooks/usePermissions';
import { useAllSupportRequests, useUpdateSupportStatus } from '../../api/hooks/useSupport';
import { SupportRequest } from '../../api/services/supportApiService';

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

function SupportHeader({
	statusFilter,
	onStatusChange,
	onRefresh
}: {
	statusFilter: string;
	onStatusChange: (val: string) => void;
	onRefresh: () => void;
}) {
	return (
		<div className="w-full bg-primary-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 flex sm:flex-row items-center justify-between gap-2.5 shadow-md">
			{/* Left Title & Icon */}
			<div className="flex items-center gap-2.5 w-full sm:w-auto">
				<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/15 text-white">
					<FuseSvgIcon size={18} className="text-white">
						heroicons-outline:chat-bubble-left-right
					</FuseSvgIcon>
				</div>
				<h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0">
					Support
				</h1>
			</div>

			{/* Right Controls: Status, Reload */}
			<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
									{selected === 'resolved' ? 'Resolved' : selected === 'pending' ? 'Pending' : 'All Status'}
								</span>
							);
						}}
					>
						<MenuItem value="">
							<span className="text-xs sm:text-sm">All Status</span>
						</MenuItem>
						<MenuItem value="pending">
							<span className="text-xs sm:text-sm">Pending</span>
						</MenuItem>
						<MenuItem value="resolved">
							<span className="text-xs sm:text-sm">Resolved</span>
						</MenuItem>
					</Select>
				</FormControl>

				{/* Refresh Button (White Card Style) */}
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
			</div>
		</div>
	);
}

function SupportContent({
	supportRequests,
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
	onRefresh,
	canUpdate,
}: {
	supportRequests: SupportRequest[];
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
	onRefresh: () => void;
	canUpdate: boolean;
}) {
	const autoScrollRef = useAutoScrollRef<HTMLDivElement>();
	const updateMutation = useUpdateSupportStatus();
	const { enqueueSnackbar } = useSnackbar();

	// Confirmation Dialog State
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		request: SupportRequest | null;
		targetStatus?: 'pending' | 'resolved';
	}>({
		open: false,
		request: null
	});
	const [isActionLoading, setIsActionLoading] = useState(false);

	const handleCopyText = useCallback(
		(text: string, label: string) => {
			if (!text) return;
			navigator.clipboard.writeText(text);
			enqueueSnackbar(`${label} copied to clipboard`, {
				variant: 'success',
				autoHideDuration: 1500
			});
		},
		[enqueueSnackbar]
	);

	const handleConfirmAction = async () => {
		if (!confirmState.request) return;
		const requestId = confirmState.request?.id ?? confirmState.request?._id;
		if (!requestId) return;

		const newStatus = confirmState.targetStatus ?? 'pending';
		setIsActionLoading(true);
		try {
			await updateMutation.mutateAsync({
				requestId,
				status: newStatus
			});
			enqueueSnackbar(`Request status updated to ${newStatus === 'resolved' ? 'Resolved' : 'Pending'}.`, {
				variant: 'success',
				autoHideDuration: 2000
			});
			setConfirmState({ open: false, request: null });
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : String(err);
			enqueueSnackbar(errMsg || 'Failed to update request status.', {
				variant: 'error'
			});
		} finally {
			setIsActionLoading(false);
		}
	};

	const columns = useMemo<MRT_ColumnDef<SupportRequest>[]>(
		() => [
			{
				accessorKey: 'name',
				header: 'NAME',
				size: 130,
				minSize: 100,
				maxSize: 160,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return (
						<Tooltip title={val || 'N/A'} arrow>
							<Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
								{val || 'N/A'}
							</Typography>
						</Tooltip>
					);
				}
			},
			{
				accessorKey: 'email',
				header: 'EMAIL',
				size: 200,
				minSize: 160,
				maxSize: 240,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					if (!val) return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>N/A</Typography>;
					return (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
							<Tooltip title={val} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 500,
										color: (t) => (t.palette.mode === 'dark' ? '#855FBF' : '#613EA3')
									}}
								>
									{val}
								</Typography>
							</Tooltip>
							<Tooltip title="Copy Email" arrow>
								<FuseSvgIcon
									size={13}
									sx={{ color: 'text.disabled', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
									onClick={() => handleCopyText(val, 'Email')}
								>
									heroicons-outline:document-duplicate
								</FuseSvgIcon>
							</Tooltip>
						</Box>
					);
				}
			},
			{
				accessorKey: 'message',
				header: 'MESSAGE',
				size: 500,
				minSize: 350,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					return val ? (
						<Tooltip title={val} arrow>
							<Typography
								sx={{
									fontSize: 12,
									fontStyle: 'italic',
									color: 'text.secondary',
									lineHeight: 1.25,
									whiteSpace: 'normal',
									wordBreak: 'break-word',
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden'
								}}
							>
								{val}
							</Typography>
						</Tooltip>
					) : (
						<Typography sx={{ fontSize: 12, color: 'text.disabled', fontStyle: 'italic' }}>N/A</Typography>
					);
				}
			},
			{
				accessorKey: 'status',
				header: 'STATUS',
				size: 110,
				minSize: 95,
				maxSize: 130,
				Cell: ({ row }) => {
					const isResolved = row.original.status === 'resolved';
					return (
						<Tooltip title={isResolved ? 'Status: Resolved' : 'Status: Pending'} arrow>
							<Box
								sx={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: 0.5,
									px: 1.25,
									py: 0.3,
									borderRadius: '6px',
									fontSize: 11.5,
									fontWeight: 600,
									height: 24,
									boxSizing: 'border-box',
									lineHeight: 1,
									bgcolor: isResolved
										? (t) => (t.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
										: (t) => (t.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)'),
									color: isResolved
										? (t) => (t.palette.mode === 'dark' ? '#4ADE80' : '#16A34A')
										: (t) => (t.palette.mode === 'dark' ? '#FBBF24' : '#D97706'),
									border: '1px solid',
									borderColor: isResolved
										? (t) => (t.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.25)')
										: (t) => (t.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)')
								}}
							>
								<FuseSvgIcon size={13}>
									{isResolved ? 'heroicons-outline:check-circle' : 'lucide:clock'}
								</FuseSvgIcon>
								{isResolved ? 'Resolved' : 'Pending'}
							</Box>
						</Tooltip>
					);
				}
			},
			{
				accessorKey: 'createdAt',
				header: 'SUBMITTED AT',
				size: 160,
				minSize: 140,
				maxSize: 180,
				Cell: ({ cell }) => {
					const dateVal = cell.getValue<string>();
					return dateVal ? (
						<Tooltip title={new Date(dateVal).toLocaleString()} arrow>
							<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
								{new Date(dateVal).toLocaleString()}
							</Typography>
						</Tooltip>
					) : (
						<Typography sx={{ fontSize: 12, color: 'text.disabled' }}>N/A</Typography>
					);
				}
			}
		],
		[handleCopyText]
	);

	if (error) {
		return (
			<Box className="p-6">
				<Typography color="error">Failed to load support requests list. Please try again later.</Typography>
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
					data={supportRequests}
					tableId="support-management-table"
					enableRowActions
					positionActionsColumn="last"
					displayColumnDefOptions={{
						'mrt-row-actions': {
							size: 70,
							minSize: 60,
							maxSize: 80
						}
					}}
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
					renderRowActions={({ row }) => {
						if (!canUpdate) {
							return null;
						}
						const request = row.original;
						const isResolved = request.status === 'resolved';
						return (
							<Tooltip title={isResolved ? 'Mark as pending' : 'Mark as resolved'} arrow>
								<IconButton
									size="small"
									onClick={() =>
										setConfirmState({
											open: true,
											request,
											targetStatus: isResolved ? 'pending' : 'resolved'
										})
									}
									className={isResolved ? 'text-emerald-600 hover:text-emerald-800 p-1.5' : 'text-amber-600 hover:text-amber-800 p-1.5'}
								>
									<FuseSvgIcon size={18}>
										{isResolved ? 'heroicons-outline:check-circle' : 'heroicons-outline:clock'}
									</FuseSvgIcon>
								</IconButton>
							</Tooltip>
						);
					}}
				/>
			</Paper>

			{/* Custom Confirmation Dialog for Support Status Change */}
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
						<div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-500">
							<FuseSvgIcon size={24} className="text-red-500">
								heroicons-outline:exclamation-triangle
							</FuseSvgIcon>
						</div>
						<div className="flex flex-col">
							<h3 className="text-base font-bold text-slate-800 m-0">Change Request Status</h3>
							<p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed m-0">
								Are you sure you want to change status of this support request to{' '}
								<strong className="text-slate-800 font-semibold">
									{confirmState.targetStatus === 'resolved' ? 'Resolved' : 'Pending'}
								</strong>
								?
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
						className="h-9 px-5 rounded-lg bg-primary-800 hover:bg-primary-900 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs border-0 flex items-center gap-1.5"
					>
						{isActionLoading && <CircularProgress size={14} color="inherit" />}
						<span>Change Status</span>
					</button>
				</div>
			</Dialog>
		</>
	);
}

function SupportView() {
	const { canView, canUpdate } = usePermissions();
	const hasAccess = canView('support');
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 100
	});
	const [globalFilter, setGlobalFilter] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [sorting, setSorting] = useState<MRT_SortingState>([]);

	const sortByParam = useMemo(() => {
		if (!sorting || sorting.length === 0) return 'createdAt:desc';
		const sortField = sorting[0].id;
		const sortDesc = sorting[0].desc ? 'desc' : 'asc';
		return `${sortField}:${sortDesc}`;
	}, [sorting]);

	const {
		data: supportResponse,
		isLoading,
		error,
		refetch
	} = useAllSupportRequests(
		{
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
			search: globalFilter,
			status: statusFilter || undefined,
			sortBy: sortByParam
		},
		hasAccess
	);

	const rawRequests = useMemo(() => {
		if (!supportResponse) return [];
		if (Array.isArray(supportResponse.data)) return supportResponse.data;
		if (Array.isArray((supportResponse as any).results)) return (supportResponse as any).results;
		return [];
	}, [supportResponse]);

	const supportRequests = useMemo(() => {
		if (!statusFilter) return rawRequests;
		return rawRequests.filter((r) => r.status === statusFilter);
	}, [rawRequests, statusFilter]);

	const totalResults = useMemo(() => {
		return (
			supportResponse?.pagination?.totalResults ??
			supportResponse?.pagination?.length ??
			supportResponse?.pagination?.total ??
			0
		);
	}, [supportResponse]);

	const totalPages = useMemo(() => {
		return (
			supportResponse?.pagination?.totalPages ||
			supportResponse?.pagination?.lastPage ||
			Math.ceil(totalResults / pagination.pageSize) ||
			1
		);
	}, [supportResponse, totalResults, pagination.pageSize]);

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
		<Root
			header={
				<SupportHeader
					statusFilter={statusFilter}
					onStatusChange={handleStatusChange}
					onRefresh={handleRefresh}
				/>
			}
			content={
				<SupportContent
					supportRequests={supportRequests}
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
					onRefresh={handleRefresh}
					canUpdate={canUpdate('support')}
				/>
			}
			scroll="content"
		/>
	);
}

export default SupportView;

