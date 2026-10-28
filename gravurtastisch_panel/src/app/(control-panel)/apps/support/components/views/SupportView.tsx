'use client';
import { useState, useMemo, useCallback } from 'react';
import moment from 'moment';
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
import AccessDeniedView from '@/components/AccessDeniedView';
import usePermissions from '@/hooks/usePermissions';
import { useAllSupportRequests, useUpdateSupportStatus } from '../../api/hooks/useSupport';
import { SupportRequest } from '../../api/services/supportApiService';
import { getErrorMessage } from '@/utils/errorMessage';

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
	statusFilter,
	onStatusChange,
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
	statusFilter: string;
	onStatusChange: (val: string) => void;
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
			enqueueSnackbar(`${label} copied to clipboard.`, {
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
			const errMsg = getErrorMessage(err, 'Failed to update request status.');
			enqueueSnackbar(errMsg, {
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
				size: 150,
				minSize: 120,
				maxSize: 180,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>() || 'N/A';
					const initials = val !== 'N/A' ? val.slice(0, 2).toUpperCase() : 'U';
					return (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary-300 dark:border-primary/40">
								{initials}
							</span>
							<Tooltip title={val} arrow>
								<Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
									{val}
								</Typography>
							</Tooltip>
						</Box>
					);
				}
			},
			{
				accessorKey: 'email',
				header: 'EMAIL',
				size: 220,
				minSize: 180,
				maxSize: 260,
				Cell: ({ cell }) => {
					const val = cell.getValue<string>();
					if (!val) return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>N/A</Typography>;
					return (
						<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md max-w-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
							<Tooltip title={val} arrow>
								<Typography
									component="span"
									sx={{
										fontSize: 12,
										fontWeight: 400,
										lineHeight: 1.25,
										color: 'inherit',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										maxWidth: 190
									}}
								>
									{val}
								</Typography>
							</Tooltip>
							<Tooltip title="Copy Email" arrow>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handleCopyText(val, 'Email');
									}}
									className="inline-flex items-center justify-center p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors text-inherit border-0 bg-transparent cursor-pointer shrink-0"
								>
									<FuseSvgIcon size={13} sx={{ color: 'inherit' }}>
										heroicons-outline:document-duplicate
									</FuseSvgIcon>
								</button>
							</Tooltip>
						</div>
					);
				}
			},
			{
				accessorKey: 'message',
				header: 'MESSAGE',
				size: 450,
				minSize: 300,
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
				size: 115,
				minSize: 100,
				maxSize: 130,
				Cell: ({ row }) => {
					const isResolved = row.original.status === 'resolved';
					return (
						<Tooltip title={isResolved ? 'Status: Resolved' : 'Status: Pending'} arrow>
							<div
								className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
									isResolved
										? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
										: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
								}`}
							>
								<FuseSvgIcon size={13}>
									{isResolved ? 'heroicons-outline:check-circle' : 'lucide:clock'}
								</FuseSvgIcon>
								<span>{isResolved ? 'Resolved' : 'Pending'}</span>
							</div>
						</Tooltip>
					);
				}
			},
			{
				accessorKey: 'createdAt',
				header: 'SUBMITTED AT',
				size: 165,
				minSize: 155,
				maxSize: 185,
				Cell: ({ cell }) => {
					const dateVal = cell.getValue<string>();
					if (!dateVal) return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					const m = moment(dateVal);
					if (!m.isValid()) return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
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

	const actionButtons = (
		<div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
			{/* Status Filter */}
			<FormControl
				size="small"
				className="min-w-[120px] flex-1 sm:flex-initial bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 table-toolbar-control shrink-0"
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
						fontSize: '13px !important',
					},
					'& .MuiOutlinedInput-notchedOutline': { border: 'none !important' },
					'& .MuiSelect-select': {
						py: '0 !important',
						height: '38px !important',
						minHeight: '38px !important',
						maxHeight: '38px !important',
						lineHeight: '38px !important',
						display: 'flex !important',
						alignItems: 'center !important',
						fontSize: '13px !important',
						boxSizing: 'border-box !important',
					},
				}}
			>
				<Select
					value={statusFilter}
					onChange={(e) => onStatusChange(e.target.value)}
					displayEmpty
					className="text-xs font-medium text-slate-700 dark:text-slate-200"
					sx={{
						height: '32px !important',
						borderRadius: '8px !important',
						'& .MuiOutlinedInput-notchedOutline': { border: 'none !important' },
						'& .MuiSelect-select': {
							py: '0 !important',
							height: '32px !important',
							display: 'flex !important',
							alignItems: 'center !important',
							fontSize: '12px !important',
						},
					}}
					renderValue={(selected) => {
						if (!selected) {
							return (
								<span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
									<FuseSvgIcon size={15} className="text-slate-500">heroicons-outline:funnel</FuseSvgIcon>
									Status
								</span>
							);
						}
						return (
							<span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-semibold">
								<FuseSvgIcon size={15} className="text-slate-600">heroicons-outline:funnel</FuseSvgIcon>
								{selected === 'resolved' ? 'Resolved' : selected === 'pending' ? 'Pending' : 'All Status'}
							</span>
						);
					}}
				>
					<MenuItem value=""><span className="text-xs sm:text-sm">All Status</span></MenuItem>
					<MenuItem value="pending"><span className="text-xs sm:text-sm">Pending</span></MenuItem>
					<MenuItem value="resolved"><span className="text-xs sm:text-sm">Resolved</span></MenuItem>
				</Select>
			</FormControl>
		</div>
	);

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
					tableId="support-management-table-v2"
					title="Support"
					icon="heroicons-outline:chat-bubble-left-right"
					actionButtons={actionButtons}
					onRefresh={onRefresh}
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
					muiTableBodyRowProps={{
						sx: {
							minHeight: '38px',
							height: '38px'
						}
					}}
					muiTableProps={{
						sx: {
							minWidth: { xs: '800px', lg: '100%' },
							'& .MuiTableCell-root': {
								padding: '6px 10px',
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

	const handleRefresh = useCallback(() => {
		setStatusFilter('');
		setGlobalFilter('');
		setSorting([]);
		setPagination((prev) => ({
			...prev,
			pageIndex: 0
		}));
		refetch();
	}, [refetch]);

	if (!hasAccess) {
		return <AccessDeniedView sectionTitle="Customer Support" />;
	}

	return (
		<Root
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
					setSorting={handleSortingChange}
					totalPages={totalPages}
					totalResults={totalResults}
					onRefresh={handleRefresh}
					canUpdate={canUpdate('support')}
					statusFilter={statusFilter}
					onStatusChange={handleStatusChange}
				/>
			}
			scroll="content"
		/>
	);
}

export default SupportView;

