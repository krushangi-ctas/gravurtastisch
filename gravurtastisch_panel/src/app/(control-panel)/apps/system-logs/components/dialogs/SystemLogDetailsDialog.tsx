import React from 'react';
import {
	Dialog,
	DialogContent,
	DialogActions,
	IconButton,
	Button,
	Typography,
	Paper
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import moment from 'moment';
import { SystemLog } from '../../api/types';

interface SystemLogDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	log: SystemLog | null;
}

/**
 * Format system log action keys into clean, human-readable display names
 */
export function formatActionKey(key: string): string {
	if (!key) return '—';
	const map: Record<string, string> = {
		'update-amazon-credentials': 'Update Amazon Authorisation',
		'update-amazon-authorisation': 'Update Amazon Authorisation',
		'update-general-settings': 'Update General Settings',
		'login-user': 'User Login',
		'logout-user': 'User Logout',
		'update-user': 'Update User',
		'create-user': 'Create User',
		'delete-user': 'Delete User',
		'update-role': 'Update Role',
		'create-role': 'Create Role',
		'delete-role': 'Delete Role',
		'update-section': 'Update Section',
		'create-section': 'Create Section',
		'delete-section': 'Delete Section',
		'update-plan': 'Update Plan',
		'create-plan': 'Create Plan',
		'delete-plan': 'Delete Plan',
		'update-blog': 'Update Blog',
		'create-blog': 'Create Blog',
		'delete-blog': 'Delete Blog',
		'update-feedback': 'Update Feedback',
		'create-feedback': 'Create Feedback',
		'payment-paid': 'Payment Received',
		'create-payment': 'Create Payment',
		'cancel-payment': 'Cancel Payment',
		'assign-plan': 'Assign Plan'
	};
	if (map[key]) return map[key];
	return key
		.replace(/[-_]/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Check if a key is an internal ID or sensitive field that should not be displayed
 */
function isIdField(key: string): boolean {
	if (!key || typeof key !== 'string') return false;
	const lower = key.toLowerCase();
	if (
		lower === 'id' ||
		lower === '_id' ||
		lower === '__v' ||
		lower === 'password' ||
		lower === 'token' ||
		lower === 'refreshtoken'
	) {
		return true;
	}
	return /(_id|Id|ID)$/.test(key);
}

/**
 * Format field keys into clean, human-readable labels
 */
function formatFieldLabel(key: string): string {
	if (!key) return '';
	const map: Record<string, string> = {
		activeMarketplaces: 'Active Marketplaces',
		activeMarketplacesLastUpdated: 'Marketplaces Last Updated',
		marketplace_id: 'Marketplace ID',
		marketplace_ids: 'Marketplaces',
		order_status: 'Order Status',
		order_matching_rules: 'Order Matching Rules',
		autoSendRequest: 'Auto Send Request',
		fba: 'FBA (Fulfilled by Amazon)',
		fbm: 'FBM (Fulfilled by Merchant)',
		campaign_name: 'Campaign Name',
		contact_no: 'Contact Number',
		businessName: 'Business Name',
		client_id: 'Client ID',
		client_secret: 'Client Secret',
		seller_id: 'Seller ID',
		refresh_token: 'Refresh Token',
		auth_url: 'Auth URL',
		sp_api_base_url: 'SP API Base URL',
		first_name: 'First Name',
		last_name: 'Last Name',
		isSuperAdmin: 'Super Admin',
		isSellerAdmin: 'Seller Admin',
		userType: 'User Type',
		status: 'Status',
		hour: 'Schedule Hour',
		minute: 'Schedule Minute',
		second: 'Schedule Second',
		day: 'Schedule Day'
	};
	if (map[key]) return map[key];
	return key
		.replace(/([A-Z])/g, ' $1')
		.replace(/[_-]/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.trim();
}

/**
 * Format primitive and complex values into clean, elegant UI representations
 */
function renderFormattedValue(value: any): React.ReactNode {
	if (value === null || value === undefined || value === '') {
		return <span className="text-slate-400 dark:text-slate-500 italic text-[12px]">—</span>;
	}

	if (typeof value === 'boolean') {
		return (
			<span
				className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
					value
						? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
						: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
				}`}
			>
				{value ? 'True' : 'False'}
			</span>
		);
	}

	if (typeof value === 'number') {
		return (
			<span className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200">
				{value}
			</span>
		);
	}

	if (typeof value === 'string') {
		// Detect ISO date format (e.g. 2026-10-28T10:35:12.026Z)
		const isIsoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
		if (isIsoDate && moment(value).isValid()) {
			return (
				<span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
					{moment(value).format('DD MMM YYYY, hh:mm:ss A')}
				</span>
			);
		}
		return (
			<span className="text-[12px] text-slate-800 dark:text-slate-200 break-words font-medium">
				{value}
			</span>
		);
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return <span className="text-slate-400 dark:text-slate-500 italic text-[12px]">None</span>;
		}

		// Array of strings or numbers: render as individual badge pills
		if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
			return (
				<div className="flex flex-wrap gap-1.5 py-0.5">
					{value.map((item, idx) => (
						<span
							key={idx}
							className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
						>
							{String(item)}
						</span>
					))}
				</div>
			);
		}

		// Array of objects
		return (
			<div className="space-y-1.5 my-1">
				{value.map((item, idx) => (
					<div
						key={idx}
						className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[12px]"
					>
						{renderFormattedValue(item)}
					</div>
				))}
			</div>
		);
	}

	if (typeof value === 'object') {
		const keys = Object.keys(value).filter((k) => !isIdField(k));
		if (keys.length === 0) {
			return <span className="text-slate-400 italic text-[12px]">—</span>;
		}
		return (
			<div className="space-y-1 py-1">
				{keys.map((k) => (
					<div key={k} className="flex items-start gap-2 text-[12px]">
						<span className="font-semibold text-slate-600 dark:text-slate-400 shrink-0">
							{formatFieldLabel(k)}:
						</span>
						<div className="flex-1 min-w-0">{renderFormattedValue(value[k])}</div>
					</div>
				))}
			</div>
		);
	}

	return <span className="text-[12px] text-slate-800 dark:text-slate-200">{String(value)}</span>;
}

/**
 * Filter out all ID fields and sensitive/internal fields
 */
function sanitizePayload(obj: any): any {
	if (!obj || typeof obj !== 'object') return obj;
	if (Array.isArray(obj)) {
		return obj.map((item) => (typeof item === 'object' ? sanitizePayload(item) : item));
	}
	const cleaned: Record<string, any> = {};
	Object.entries(obj).forEach(([key, val]) => {
		if (isIdField(key)) return;
		cleaned[key] = typeof val === 'object' && val !== null ? sanitizePayload(val) : val;
	});
	return cleaned;
}

/**
 * Extract update comparison data (oldData vs updatedData)
 */
function extractUpdateComparison(log: SystemLog): {
	isUpdate: boolean;
	oldData: Record<string, any> | null;
	updatedData: Record<string, any> | null;
} {
	// 1. Array containing { oldData, updatedData }
	if (Array.isArray(log.operation_data) && log.operation_data.length > 0) {
		const first = log.operation_data[0];
		if (first && typeof first === 'object') {
			if (first.oldData !== undefined || first.updatedData !== undefined) {
				return {
					isUpdate: true,
					oldData: sanitizePayload(first.oldData),
					updatedData: sanitizePayload(first.updatedData)
				};
			}
		}
	}

	// 2. Object with { oldData, updatedData }
	if (log.operation_data && typeof log.operation_data === 'object' && !Array.isArray(log.operation_data)) {
		const obj = log.operation_data as any;
		if (obj.oldData !== undefined || obj.updatedData !== undefined) {
			return {
				isUpdate: true,
				oldData: sanitizePayload(obj.oldData),
				updatedData: sanitizePayload(obj.updatedData)
			};
		}
	}

	// 3. existing_data + operation_data
	if (
		log.existing_data &&
		typeof log.existing_data === 'object' &&
		Object.keys(log.existing_data).length > 0
	) {
		const curr = Array.isArray(log.operation_data)
			? log.operation_data[0]
			: log.operation_data;
		return {
			isUpdate: true,
			oldData: sanitizePayload(log.existing_data),
			updatedData: sanitizePayload(curr)
		};
	}

	return { isUpdate: false, oldData: null, updatedData: null };
}

/**
 * Extract single record key-value pairs (for CREATE, LOGIN, etc.)
 */
function extractSingleRecord(log: SystemLog): Record<string, any> {
	if (Array.isArray(log.operation_data) && log.operation_data.length > 0) {
		const first = log.operation_data[0];
		if (first && typeof first === 'object') {
			return sanitizePayload(first);
		}
		return { data: log.operation_data };
	}
	if (log.operation_data && typeof log.operation_data === 'object') {
		return sanitizePayload(log.operation_data);
	}
	return {};
}

export default function SystemLogDetailsDialog({
	open,
	onClose,
	log
}: SystemLogDetailsDialogProps) {
	if (!log) return null;

	const fullName = log.name || [log.first_name, log.last_name].filter(Boolean).join(' ') || log.email || 'System';
	const logDate = log.createdAt ? moment(log.createdAt).format('DD MMM YYYY, hh:mm A') : '';
	const userInitial = fullName
		? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
		: log.email ? log.email[0].toUpperCase() : 'U';

	const { isUpdate, oldData, updatedData } = extractUpdateComparison(log);
	const singleData = !isUpdate ? extractSingleRecord(log) : {};

	// Collect unique keys for comparison (filter out any remaining ID fields)
	const comparisonKeys = isUpdate
		? Array.from(
				new Set([
					...Object.keys(oldData || {}),
					...Object.keys(updatedData || {})
				])
			).filter((k) => !isIdField(k))
		: [];

	// Single record keys (filter out any remaining ID fields)
	const singleKeys = !isUpdate ? Object.keys(singleData).filter((k) => !isIdField(k)) : [];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth={false}
			fullWidth
			PaperProps={{
				sx: {
					maxWidth: isUpdate ? '760px' : '580px',
					width: '100%',
					borderRadius: 3,
					overflow: 'hidden',
					p: 0,
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
					m: { xs: 1.5, sm: 2 }
				}
			}}
		>
			{/* Dialog Header - Consistent with Gravurtastisch Branding */}
			<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
						<FuseSvgIcon size={18} className="text-primary">
							heroicons-outline:clipboard-document-list
						</FuseSvgIcon>
					</div>
					<div>
						<h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white m-0">
							System Log Details
						</h2>
						<p className="text-xs text-slate-500 dark:text-slate-400 m-0">
							{fullName} {logDate ? `• ${logDate}` : ''}
						</p>
					</div>
				</div>

				<IconButton
					size="small"
					onClick={onClose}
					className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-1"
				>
					<FuseSvgIcon size={18}>heroicons-outline:x-mark</FuseSvgIcon>
				</IconButton>
			</div>

			{/* Dialog Body */}
			<DialogContent
				dividers
				sx={{ p: { xs: 2, sm: 2.5 } }}
				className="space-y-4 bg-gray-50/60 dark:bg-slate-900/40 custom-table-scrollbar"
			>
				{/* Top Summary Card */}
				<Paper
					variant="outlined"
					sx={{
						p: 2,
						backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC'),
						borderRadius: 2,
						borderColor: (theme) => (theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0')
					}}
				>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
								{userInitial}
							</div>
							<div>
								<Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
									{fullName}
								</Typography>
								<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
									{log.email || '—'} {log.role_name ? `• ${log.role_name}` : ''}
								</Typography>
							</div>
						</div>

						<div className="flex items-center gap-2 flex-wrap">
							<span
								className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
									log.operation === 'CREATE'
										? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
										: log.operation === 'UPDATE'
											? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
											: log.operation === 'DELETE'
												? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
												: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
								}`}
							>
								{log.operation}
							</span>
							{log.key && (
								<span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
									{formatActionKey(log.key)}
								</span>
							)}
						</div>
					</div>
				</Paper>

				{/* Key-Value Details Container */}
				<Paper
					variant="outlined"
					sx={{
						backgroundColor: 'background.paper',
						borderRadius: 2,
						borderColor: (theme) => (theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'),
						overflow: 'hidden'
					}}
				>
					{isUpdate ? (
						/* UPDATE: Clean 3-Column Diff Table (Field | Previous Value | Updated Value) */
						<div>
							{comparisonKeys.length === 0 ? (
								<div className="p-8 text-center text-xs text-slate-400">
									No changes recorded for this update operation.
								</div>
							) : (
								<div>
									{/* Column Header for Update */}
									<div className="grid grid-cols-12 bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 font-semibold text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider">
										<div className="col-span-12 sm:col-span-4 p-3 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700">
											Field
										</div>
										<div className="col-span-12 sm:col-span-4 p-3 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700">
											Previous Value
										</div>
										<div className="col-span-12 sm:col-span-4 p-3">
											Updated Value
										</div>
									</div>

									<div className="divide-y divide-slate-100 dark:divide-slate-800">
										{comparisonKeys.map((key) => {
											const oldVal = oldData?.[key];
											const newVal = updatedData?.[key];
											const isDifferent =
												JSON.stringify(oldVal) !== JSON.stringify(newVal);

											return (
												<div
													key={key}
													className={`grid grid-cols-12 text-xs transition-colors items-center ${
														isDifferent
															? 'bg-amber-50/40 dark:bg-amber-950/20'
															: 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
													}`}
												>
													{/* Col 1: Field Name */}
													<div className="col-span-12 sm:col-span-4 p-3 border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-slate-800 min-w-0 font-semibold text-slate-700 dark:text-slate-300">
														{formatFieldLabel(key)}
													</div>

													{/* Col 2: Previous Value */}
													<div className="col-span-12 sm:col-span-4 p-3 border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-slate-800 min-w-0">
														{renderFormattedValue(oldVal)}
													</div>

													{/* Col 3: Updated Value */}
													<div className="col-span-12 sm:col-span-4 p-3 min-w-0">
														{renderFormattedValue(newVal)}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>
					) : (
						/* SINGLE RECORD: Clean Key-Value Table matching table font */
						<div>
							{singleKeys.length === 0 ? (
								<div className="p-8 text-center text-xs text-slate-400">
									No additional details recorded for this operation.
								</div>
							) : (
								<div>
									{/* Column Header for Single Record */}
									<div className="grid grid-cols-12 bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 font-semibold text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider">
										<div className="col-span-12 sm:col-span-4 p-3 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700">
											Field
										</div>
										<div className="col-span-12 sm:col-span-8 p-3">
											Value
										</div>
									</div>

									<div className="divide-y divide-slate-100 dark:divide-slate-800">
										{singleKeys.map((key) => (
											<div
												key={key}
												className="grid grid-cols-12 py-2.5 px-3 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors items-center"
											>
												<div className="col-span-12 sm:col-span-4 font-semibold text-slate-700 dark:text-slate-300 border-b sm:border-b-0 pb-1 sm:pb-0">
													{formatFieldLabel(key)}
												</div>
												<div className="col-span-12 sm:col-span-8 text-slate-900 dark:text-slate-100 font-normal">
													{renderFormattedValue(singleData[key])}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</Paper>
			</DialogContent>

			{/* Dialog Footer - Gravurtastisch Primary Action Button */}
			<DialogActions
				className="px-4 sm:px-6 py-3 bg-slate-50/90 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0"
				sx={{
					flexShrink: 0,
					borderTop: '1px solid',
					borderColor: 'divider',
					bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0F172A' : '#F8FAFC'),
					px: { xs: 2, sm: 3 },
					py: 1.5
				}}
			>
				<Button
					variant="contained"
					onClick={onClose}
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
					Close
				</Button>
			</DialogActions>
		</Dialog>
	);
}
