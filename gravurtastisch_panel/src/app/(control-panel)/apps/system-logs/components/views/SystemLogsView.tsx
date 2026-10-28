'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Box,
	Button,
	FormControl,
	IconButton,
	InputAdornment,
	MenuItem,
	Paper,
	Popover,
	Select,
	TextField,
	Tooltip,
	Typography
} from '@mui/material';
import {
	format,
	isAfter,
	addDays,
	subDays,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameDay,
	isWithinInterval,
	addMonths,
	subMonths
} from 'date-fns';
import { type MRT_ColumnDef, type MRT_Row, type MRT_SortingState } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import usePermissions from '@/hooks/usePermissions';
import useUser from '@auth/useUser';
import { useAdminStaffUsers, useTeamUsers } from '../../../users/api/hooks/useUsers';
import { useSystemLogs } from '../../api/hooks/useSystemLogs';
import { SystemLog } from '../../api/types';
import SystemLogDetailsDialog, { formatActionKey } from '../dialogs/SystemLogDetailsDialog';

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

function TableCopyButton({ text, tooltip = 'Copy' }: { text: string; tooltip?: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!text) return;
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<Tooltip title={copied ? 'Copied!' : tooltip} arrow>
			<button
				type="button"
				onClick={handleCopy}
				className="inline-flex items-center justify-center p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
			>
				<FuseSvgIcon size={13} sx={{ color: 'inherit' }}>
					{copied ? 'heroicons-outline:check' : 'heroicons-outline:clipboard-document'}
				</FuseSvgIcon>
			</button>
		</Tooltip>
	);
}

interface DateRangePickerProps {
	value: Record<string, Date | null>;
	onChange: (range: Record<string, Date | null>) => void;
	onClose: () => void;
}

function CustomDateRangePicker({ value, onChange, onClose }: DateRangePickerProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
	const [tempRange, setTempRange] = useState<Record<string, Date | null>>(value);

	useEffect(() => {
		setTempRange(value);
		if (value.from) {
			setCurrentMonth(value.from);
		}
	}, [value]);

	const handleDateClick = (date: Date) => {
		if (!tempRange.from || (tempRange.from && tempRange.to)) {
			setTempRange({ from: date, to: null });
		} else {
			if (isSameDay(date, tempRange.from)) {
				setTempRange({ from: tempRange.from, to: tempRange.from });
			} else if (isAfter(date, tempRange.from)) {
				setTempRange({ ...tempRange, to: date });
			} else {
				setTempRange({ from: date, to: tempRange.from });
			}
		}
	};

	const handleApply = () => {
		if (tempRange.from && tempRange.to) {
			onChange(tempRange);
			onClose();
		} else if (tempRange.from && !tempRange.to) {
			onChange({ from: tempRange.from, to: tempRange.from });
			onClose();
		}
	};

	const handleCancel = () => {
		setTempRange(value);
		onClose();
	};

	const getDaysInMonth = () => {
		const start = startOfMonth(currentMonth);
		const end = endOfMonth(currentMonth);
		const days = eachDayOfInterval({ start, end });

		const startPadding = start.getDay();
		const endPadding = 6 - end.getDay();

		const startPaddingDays = Array.from({ length: startPadding }, (_, i) =>
			subDays(start, startPadding - i)
		);
		const endPaddingDays = Array.from({ length: endPadding }, (_, i) =>
			addDays(end, i + 1)
		);

		return [...startPaddingDays, ...days, ...endPaddingDays];
	};

	const isInRange = (date: Date) => {
		if (!tempRange.from) return false;
		if (!tempRange.to) return isSameDay(date, tempRange.from);
		return isWithinInterval(date, { start: tempRange.from, end: tempRange.to });
	};

	const isRangeStart = (date: Date) => (tempRange.from ? isSameDay(date, tempRange.from) : false);
	const isRangeEnd = (date: Date) => (tempRange.to ? isSameDay(date, tempRange.to) : false);
	const isInHoverRange = (date: Date) => {
		if (!tempRange.from || tempRange.to) return false;
		return hoveredDate ? isWithinInterval(date, { start: tempRange.from, end: hoveredDate }) : false;
	};

	const days = getDaysInMonth();

	return (
		<Paper sx={{ p: { xs: 1.5, sm: 2 }, minWidth: { xs: 280, sm: 320 }, maxWidth: '100%', boxSizing: 'border-box' }}>
			{/* Header */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
					<FuseSvgIcon>lucide:chevron-left</FuseSvgIcon>
				</IconButton>
				<Typography variant="subtitle1" fontWeight={600}>
					{format(currentMonth, 'MMMM yyyy')}
				</Typography>
				<IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} size="small">
					<FuseSvgIcon>lucide:chevron-right</FuseSvgIcon>
				</IconButton>
			</Box>

			{/* Day Headers */}
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
				{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
					<Box
						key={day}
						sx={{
							textAlign: 'center',
							py: 1,
							fontSize: '0.75rem',
							fontWeight: 'bold',
							color: 'text.secondary'
						}}
					>
						{day}
					</Box>
				))}
			</Box>

			{/* Calendar Grid */}
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
				{days.map((date, index) => {
					const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
					const isSelected = isInRange(date);
					const isStart = isRangeStart(date);
					const isEnd = isRangeEnd(date);
					const isHovered = isInHoverRange(date);

					return (
						<Box
							key={index}
							onClick={() => handleDateClick(date)}
							onMouseEnter={() => setHoveredDate(date)}
							onMouseLeave={() => setHoveredDate(null)}
							sx={{
								textAlign: 'center',
								py: 1,
								fontSize: '0.875rem',
								cursor: 'pointer',
								bgcolor: isStart || isEnd
									? 'primary.main'
									: isSelected || isHovered
										? 'primary.light'
										: 'transparent',
								color: isStart || isEnd
									? 'primary.contrastText'
									: isCurrentMonth
										? 'text.primary'
										: 'text.disabled',
								borderRadius: isStart && isEnd
									? '6px'
									: isStart
										? '6px 0 0 6px'
										: isEnd
											? '0 6px 6px 0'
											: '0',
								'&:hover': {
									bgcolor: isStart || isEnd ? 'primary.main' : 'action.hover'
								}
							}}
						>
							{date.getDate()}
						</Box>
					);
				})}
			</Box>

			{/* Footer Actions */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
				<Button
					size="small"
					color="inherit"
					onClick={() => {
						onChange({ from: null, to: null });
						onClose();
					}}
					sx={{ textTransform: 'none', fontSize: '12px', color: 'text.secondary' }}
				>
					All Dates
				</Button>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Button size="small" onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						size="small"
						variant="contained"
						onClick={handleApply}
						disabled={!tempRange.from}
					>
						Apply
					</Button>
				</Box>
			</Box>
		</Paper>
	);
}

export default function SystemLogsView() {
	const { scope } = usePermissions();
	const activeScope = scope === 'seller' ? 'seller' : 'admin';

	// Filters State
	const [globalFilter, setGlobalFilter] = useState('');
	const [selectedUser, setSelectedUser] = useState('ALL');
	const [selectedOperation, setSelectedOperation] = useState('ALL');
	// Default to Today's date
	const [searchDate, setSearchDate] = useState<Record<string, Date | null>>(() => {
		const today = new Date();
		return { from: today, to: today };
	});
	const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);

	// Sorting & Pagination State
	const [sorting, setSorting] = useState<MRT_SortingState>([
		{ id: 'createdAt', desc: true }
	]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 100
	});

	// Details Modal State
	const [detailsModalOpen, setDetailsModalOpen] = useState(false);
	const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

	// Fetch Users for User Filter
	const { data: currentUser } = useUser();
	const { data: adminUsersData } = useAdminStaffUsers(
		{ limit: 100, includeSuperAdmin: 'true' },
		activeScope === 'admin'
	);
	const { data: teamUsersData } = useTeamUsers(
		{ limit: 100, includeOwner: 'true' },
		activeScope === 'seller'
	);

	const usersList = useMemo(() => {
		const raw = activeScope === 'admin' ? adminUsersData?.data || [] : teamUsersData?.data || [];
		const list: { id: string; name: string; email: string }[] = [];
		const seen = new Set<string>();

		if (Array.isArray(raw)) {
			raw.forEach((u: any) => {
				const uid = String(u._id || u.id || '');
				if (uid && !seen.has(uid)) {
					seen.add(uid);
					const uName =
						u.name ||
						[u.first_name, u.last_name].filter(Boolean).join(' ') ||
						u.email ||
						'User';
					list.push({ id: uid, name: uName, email: u.email || '' });
				}
			});
		}

		// Ensure active logged-in user is present if not already added
		if (currentUser) {
			const myId = String((currentUser as any)._id || currentUser.id || '');
			if (myId && !seen.has(myId)) {
				seen.add(myId);
				const myName =
					currentUser.name ||
					[(currentUser as any).first_name, (currentUser as any).last_name]
						.filter(Boolean)
						.join(' ') ||
					currentUser.email ||
					'Current User';
				list.unshift({ id: myId, name: myName, email: currentUser.email || '' });
			}
		}

		return list;
	}, [activeScope, adminUsersData, teamUsersData, currentUser]);

	// Build Query Parameters
	const queryParams = useMemo(() => {
		const sortField = sorting[0]?.id || 'createdAt';
		const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

		return {
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
			search: globalFilter || undefined,
			sortBy: `${sortField}:${sortOrder}`,
			scope: activeScope,
			operation_by: selectedUser !== 'ALL' ? selectedUser : undefined,
			operation: selectedOperation !== 'ALL' ? selectedOperation : undefined,
			startDate: searchDate.from ? format(searchDate.from, 'yyyy-MM-dd') : undefined,
			endDate: searchDate.to ? format(searchDate.to, 'yyyy-MM-dd') : undefined
		};
	}, [
		pagination.pageIndex,
		pagination.pageSize,
		globalFilter,
		sorting,
		activeScope,
		selectedUser,
		selectedOperation,
		searchDate
	]);

	const {
		data: logsResponse,
		isLoading,
		isFetching,
		refetch
	} = useSystemLogs(queryParams);

	const logs = useMemo(() => logsResponse?.data || [], [logsResponse?.data]);
	const totalResults = useMemo(() => {
		return (
			logsResponse?.pagination?.totalResults ??
			logsResponse?.pagination?.length ??
			logsResponse?.pagination?.total ??
			logs.length
		);
	}, [logsResponse?.pagination, logs.length]);

	const totalPages = useMemo(() => {
		return (
			logsResponse?.pagination?.totalPages ||
			logsResponse?.pagination?.lastPage ||
			Math.ceil(totalResults / pagination.pageSize) ||
			1
		);
	}, [logsResponse?.pagination, totalResults, pagination.pageSize]);

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

	const handleResetFilters = useCallback(() => {
		setGlobalFilter('');
		setSelectedUser('ALL');
		setSelectedOperation('ALL');
		const today = new Date();
		setSearchDate({ from: today, to: today });
		setDateAnchorEl(null);
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}, []);

	const handleRefresh = useCallback(() => {
		handleResetFilters();
		refetch();
	}, [handleResetFilters, refetch]);


	const handleViewDetails = (log: SystemLog) => {
		setSelectedLog(log);
		setDetailsModalOpen(true);
	};

	// Columns Definition
	const columns = useMemo<MRT_ColumnDef<SystemLog>[]>(
		() => [
			{
				id: 'name',
				accessorFn: (row) => row.name || [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || '',
				header: 'Name',
				size: 180,
				Cell: ({ row }) => {
					const item = row.original;
					const fullName = item.name || [item.first_name, item.last_name].filter(Boolean).join(' ') || item.email || '';
					const initial = fullName
						? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
						: item.email ? item.email[0].toUpperCase() : 'U';

					return (
						<div className="flex items-center gap-2.5 min-w-0">
							<div className="w-7 h-7 rounded-full bg-primary text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
								{initial}
							</div>
							<Tooltip title={fullName || item.email || ''} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 500,
										color: (t) => (t.palette.mode === 'dark' ? '#E2E8F0' : '#1E293B'),
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis'
									}}
								>
									{fullName || item.email || '—'}
								</Typography>
							</Tooltip>
						</div>
					);
				}
			},
			{
				accessorKey: 'email',
				header: 'Email',
				size: 210,
				Cell: ({ cell }) => {
					const email = cell.getValue<string>();
					if (!email) {
						return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					}
					return (
						<Tooltip title={email} arrow>
							<Typography
								sx={{
									fontSize: 12,
									fontWeight: 400,
									color: (t) => (t.palette.mode === 'dark' ? '#94A3B8' : '#475569'),
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis'
								}}
							>
								{email}
							</Typography>
						</Tooltip>
					);
				}
			},
			{
				accessorKey: 'role_name',
				header: 'Role',
				size: 130,
				Cell: ({ cell }) => {
					const roleName = cell.getValue<string>() || 'Super Admin';
					const isSuper = roleName.toLowerCase().includes('super');

					return (
						<span
							className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
								isSuper
									? 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
									: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
							}`}
						>
							{roleName}
						</span>
					);
				}
			},
			{
				accessorKey: 'operation',
				header: 'Operation',
				size: 110,
				Cell: ({ cell }) => {
					const op = (cell.getValue<string>() || '').toUpperCase();
					return (
						<Typography
							sx={{
								fontSize: 12,
								fontWeight: 500,
								color: (t) => (t.palette.mode === 'dark' ? '#E2E8F0' : '#334155'),
								whiteSpace: 'nowrap'
							}}
						>
							{op || '—'}
						</Typography>
					);
				}
			},
			{
				accessorKey: 'key',
				header: 'Action / Key',
				size: 210,
				Cell: ({ cell }) => {
					const key = cell.getValue<string>() || '';
					const displayTitle = formatActionKey(key);
					return (
						<div className="flex items-center gap-1.5 min-w-0">
							<Tooltip title={key ? `Raw key: ${key}` : ''} arrow>
								<Typography
									sx={{
										fontSize: 12,
										fontWeight: 500,
										color: (t) => (t.palette.mode === 'dark' ? '#E2E8F0' : '#1E293B'),
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis'
									}}
								>
									{displayTitle}
								</Typography>
							</Tooltip>
							{key && <TableCopyButton text={key} tooltip={`Copy raw key: ${key}`} />}
						</div>
					);
				}
			},
			{
				accessorKey: 'ip_address',
				header: 'IP Address',
				size: 140,
				Cell: ({ cell }) => {
					const ip = cell.getValue<string>() || '—';
					return (
						<div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
							<span>{ip}</span>
							{ip !== '—' && <TableCopyButton text={ip} tooltip="Copy IP" />}
						</div>
					);
				}
			},
			{
				accessorKey: 'createdAt',
				header: 'Created At',
				size: 170,
				Cell: ({ cell }) => {
					const dateVal = cell.getValue<string>();
					if (!dateVal || !moment(dateVal).isValid()) {
						return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
					}
					const m = moment(dateVal);
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
		[]
	);

	// Action buttons in Top Toolbar
	const actionButtons = useMemo(
		() => (
			<div className="flex items-center flex-wrap gap-2">
				{/* User Filter */}
				<FormControl
					size="small"
					className="min-w-[160px] max-w-[240px] bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs shrink-0"
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
							fontSize: '13px !important'
						},
						'& .MuiOutlinedInput-notchedOutline': {
							border: 'none !important'
						},
						'& .MuiSelect-select': {
							py: '0 !important',
							height: '38px !important',
							minHeight: '38px !important',
							maxHeight: '38px !important',
							lineHeight: '38px !important',
							display: 'flex !important',
							alignItems: 'center !important',
							fontSize: '13px !important',
							fontWeight: 500,
							boxSizing: 'border-box !important'
						}
					}}
				>
					<Select
						value={selectedUser}
						onChange={(e) => {
							setSelectedUser(e.target.value);
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
						displayEmpty
						className="bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 border-0"
						sx={{
							height: '38px !important',
							borderRadius: '8px !important',
							fontSize: '13px !important',
							'& .MuiOutlinedInput-notchedOutline': {
								border: 'none !important'
							},
							'& .MuiSelect-select': {
								py: '0 !important',
								height: '38px !important',
								display: 'flex !important',
								alignItems: 'center !important',
								fontSize: '13px !important'
							}
						}}
						MenuProps={{
							PaperProps: {
								sx: {
									maxHeight: 380,
									minWidth: '200px',
									borderRadius: '12px',
									p: 0.5,
									boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
									'& .MuiMenuItem-root': {
										fontSize: '13.5px !important',
										fontWeight: 500,
										py: 1,
										px: 1.5,
										borderRadius: '8px',
										my: 0.25,
										'&.Mui-selected': {
											fontWeight: 600
										}
									}
								}
							}
						}}
					>
						<MenuItem value="ALL">
							All Users
						</MenuItem>
						{usersList.map((u) => (
							<MenuItem key={u.id} value={u.id}>
								{u.name}
							</MenuItem>
						))}
					</Select>
				</FormControl>

				{/* Operation Filter */}
				<FormControl
					size="small"
					className="min-w-[150px] bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs shrink-0"
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
							fontSize: '13px !important'
						},
						'& .MuiOutlinedInput-notchedOutline': {
							border: 'none !important'
						},
						'& .MuiSelect-select': {
							py: '0 !important',
							height: '38px !important',
							minHeight: '38px !important',
							maxHeight: '38px !important',
							lineHeight: '38px !important',
							display: 'flex !important',
							alignItems: 'center !important',
							fontSize: '13px !important',
							fontWeight: 500,
							boxSizing: 'border-box !important'
						}
					}}
				>
					<Select
						value={selectedOperation}
						onChange={(e) => {
							setSelectedOperation(e.target.value);
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
						displayEmpty
						className="bg-white dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 border-0"
						sx={{
							height: '38px !important',
							borderRadius: '8px !important',
							fontSize: '13px !important',
							'& .MuiOutlinedInput-notchedOutline': {
								border: 'none !important'
							},
							'& .MuiSelect-select': {
								py: '0 !important',
								height: '38px !important',
								display: 'flex !important',
								alignItems: 'center !important',
								fontSize: '13px !important'
							}
						}}
						MenuProps={{
							PaperProps: {
								sx: {
									maxHeight: 380,
									minWidth: '160px',
									borderRadius: '12px',
									p: 0.5,
									boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
									'& .MuiMenuItem-root': {
										fontSize: '13.5px !important',
										fontWeight: 500,
										py: 1,
										px: 1.5,
										borderRadius: '8px',
										my: 0.25,
										'&.Mui-selected': {
											fontWeight: 600
										}
									}
								}
							}
						}}
					>
						<MenuItem value="ALL">
							All Operations
						</MenuItem>
						<MenuItem value="CREATE">
							CREATE
						</MenuItem>
						<MenuItem value="UPDATE">
							UPDATE
						</MenuItem>
						<MenuItem value="DELETE">
							DELETE
						</MenuItem>
					</Select>
				</FormControl>

				{/* Date Range Filter Button */}
				<Button
					size="small"
					variant="outlined"
					onClick={(e) => setDateAnchorEl(e.currentTarget)}
					className={`h-[38px] text-xs font-medium px-3 rounded-lg border bg-white dark:bg-slate-800 ${
						searchDate.from && searchDate.to
							? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
							: 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
					}`}
					startIcon={
						<FuseSvgIcon size={15} className="text-slate-500 dark:text-slate-400">
							heroicons-outline:calendar
						</FuseSvgIcon>
					}
				>
					{searchDate.from && searchDate.to
						? isSameDay(searchDate.from, searchDate.to)
							? format(searchDate.from, 'dd MMM yyyy')
							: `${format(searchDate.from, 'dd MMM')} - ${format(searchDate.to, 'dd MMM')}`
						: 'Date Range'}
				</Button>

				{/* Date Range Popover */}
				<Popover
					open={Boolean(dateAnchorEl)}
					anchorEl={dateAnchorEl}
					onClose={() => setDateAnchorEl(null)}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
					transformOrigin={{ vertical: 'top', horizontal: 'right' }}
					slotProps={{
						paper: {
							sx: {
								mt: 1,
								boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
								borderRadius: '12px',
								overflow: 'hidden'
							}
						}
					}}
				>
					<CustomDateRangePicker
						value={searchDate}
						onChange={(range) => {
							setSearchDate(range);
							setDateAnchorEl(null);
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
						onClose={() => setDateAnchorEl(null)}
					/>
				</Popover>

			</div>
		),
		[
			selectedUser,
			selectedOperation,
			searchDate,
			dateAnchorEl,
			usersList
		]
	);

	return (
		<Root
			content={
				<Paper
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
							data={logs}
							tableId={`system-logs-grid-${activeScope}`}
							title="System Logs"
							subtitle="Audit user activities, data modifications, and system events with detailed operational history."
							icon="lucide:scroll-text"
							actionButtons={actionButtons}
							onRefresh={handleRefresh}
							enableRowActions
							positionActionsColumn="last"
							initialState={{
								columnOrder: [
									'name',
									'email',
									'role_name',
									'operation',
									'key',
									'ip_address',
									'createdAt',
									'mrt-row-actions'
								]
							}}
							displayColumnDefOptions={{
								'mrt-row-actions': {
									size: 70,
									minSize: 60,
									maxSize: 80,
									header: 'Actions',
									muiTableHeadCellProps: {
										className: 'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 text-center',
										sx: { width: '70px !important', minWidth: '60px !important' }
									},
									muiTableBodyCellProps: {
										sx: { width: '70px !important', minWidth: '60px !important', px: '8px !important', textAlign: 'center' }
									}
								}
							}}
							enableRowSelection={false}
							state={{
								isLoading: isLoading || isFetching,
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
							renderRowActions={({ row }: { row: MRT_Row<SystemLog> }) => (
								<div className="flex items-center justify-center">
									<Tooltip title="View Log Details" arrow>
										<IconButton
											size="small"
											onClick={() => handleViewDetails(row.original)}
											className="w-8 h-8 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-300 dark:hover:text-amber-400 dark:hover:bg-amber-950/30 transition-colors"
										>
											<FuseSvgIcon size={18}>heroicons-outline:eye</FuseSvgIcon>
										</IconButton>
									</Tooltip>
								</div>
							)}
							muiTableProps={{
								sx: {
									tableLayout: 'auto',
									minWidth: '100%',
									'& .MuiTableCell-root': {
										borderBottom: '1px solid',
										borderColor: 'divider',
										padding: '8px 12px',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}
								}
							}}
							muiTableHeadCellProps={{
								className: 'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700'
							}}
							muiBottomToolbarProps={{
								className:
									'flex flex-row items-center justify-end min-h-[46px] h-[46px] py-0 px-2 sm:px-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-x-auto',
								sx: {
									backgroundColor: (theme: any) =>
										theme.palette?.mode === 'dark' ? '#1f2937' : '#f3f4f6',
									borderTop: '1px solid',
									borderColor: (theme: any) =>
										theme.palette?.mode === 'dark' ? '#374151' : '#e5e7eb',
									flexShrink: 0,
									marginTop: 'auto',
									position: 'sticky',
									bottom: 0,
									zIndex: 2,
									minHeight: '46px !important',
									height: '46px !important',
									display: 'flex',
									alignItems: 'center',
									justifyContent: { xs: 'center', sm: 'flex-end' },
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
										justifyContent: { xs: 'center', sm: 'flex-end' },
										gap: { xs: 0.5, sm: 1 },
										minHeight: '46px !important',
										height: '46px !important',
										paddingLeft: { xs: 1, sm: 2 },
										paddingRight: { xs: 1, sm: 2 },
										py: '0 !important',
										my: 'auto'
									},
									'& .MuiTablePagination-selectLabel': {
										fontSize: { xs: '11px', sm: '13px' },
										margin: '0 !important',
										lineHeight: '1.2 !important',
										display: 'inline-flex',
										alignItems: 'center'
									},
									'& .MuiTablePagination-displayedRows': {
										fontSize: { xs: '11px', sm: '13px' },
										margin: '0 !important'
									},
									'& .MuiTablePagination-input': {
										marginRight: { xs: 0.5, sm: 1 },
										marginLeft: 0.5,
										display: 'inline-flex',
										alignItems: 'center',
										'& .MuiSelect-select': {
											paddingTop: '3px !important',
											paddingBottom: '3px !important',
											fontSize: { xs: '11px', sm: '13px' },
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
									scrollbarWidth: 'thin',
									scrollbarColor: '#94a3b8 #f1f5f9',
									'&::-webkit-scrollbar': { height: 6, width: 6 },
									'&::-webkit-scrollbar-track': {
										backgroundColor: (theme: any) =>
											theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
										borderRadius: 9999
									},
									'&::-webkit-scrollbar-thumb': {
										backgroundColor: '#94a3b8',
										borderRadius: 9999,
										border: (theme: any) =>
											theme.palette.mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
										'&:hover': {
											backgroundColor: '#64748b'
										}
									}
								}
							}}
						/>
					{/* Log Details Modal */}
					<SystemLogDetailsDialog
						open={detailsModalOpen}
						onClose={() => {
							setDetailsModalOpen(false);
							setSelectedLog(null);
						}}
						log={selectedLog}
					/>
				</Paper>
			}
			scroll="content"
		/>
	);
}
