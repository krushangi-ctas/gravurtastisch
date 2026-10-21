import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import NavbarToggleButton from '@/components/theme-layouts/components/navbar/NavbarToggleButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
	MRT_GlobalFilterTextField,
	MRT_LinearProgressBar,
	MRT_RowData,
	MRT_TableInstance,
	MRT_TablePagination,
	MRT_ToolbarAlertBanner,
	MRT_ToolbarDropZone,
	MRT_ToolbarInternalButtons
} from 'material-react-table';
import parseFromValuesOrFunc from 'src/components/data-table/utils/parseFromValuesOrFunc';

const defaultTableSubtitles: Record<string, string> = {
	Orders: 'Manage customer orders, track fulfillment status, and monitor marketplace channels.',
	Sellers: 'View registered sellers, manage store profiles, subscriptions, and quota limits.',
	'Admin Users': 'Manage administrative users, access privileges, and staff accounts.',
	Team: 'Manage internal team members, departmental roles, and access controls.',
	Roles: 'Configure role definitions, operational permissions, and security policies.',
	Blogs: 'Create, publish, and manage website articles, categories, and SEO blog posts.',
	Plans: 'Manage subscription tiers, feature allocations, pricing, and monthly limits.',
	Support: 'Manage customer inquiries, support requests, and seller communications.',
	'Support Tickets': 'Manage customer inquiries, support requests, and seller communications.'
};

export interface DataTableTopToolbarProps<TData extends MRT_RowData> {
	table: MRT_TableInstance<TData>;
	title?: React.ReactNode | string;
	subtitle?: React.ReactNode | string;
	icon?: string | React.ReactNode;
	actionButtons?: React.ReactNode;
	onRefresh?: () => void;
}

function DataTableTopToolbar<TData extends MRT_RowData>({
	table,
	title,
	subtitle,
	icon,
	actionButtons,
	onRefresh
}: DataTableTopToolbarProps<TData>) {
	const {
		getState,
		options: {
			enableGlobalFilter,
			enablePagination,
			enableToolbarInternalActions,
			muiTopToolbarProps,
			positionGlobalFilter,
			positionPagination,
			positionToolbarDropZone,
			renderTopToolbarCustomActions
		},
		refs: { topToolbarRef }
	} = table;

	const { isFullScreen, showGlobalFilter } = getState();

	const isMobile = useMediaQuery('(max-width:720px)');
	const isTablet = useMediaQuery('(max-width:1024px)');
	const isNavMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const toolbarProps = parseFromValuesOrFunc(muiTopToolbarProps, { table });

	const stackAlertBanner = isMobile || !!renderTopToolbarCustomActions || (showGlobalFilter && isTablet);

	const globalFilterProps = {
		sx: !isTablet
			? {
					zIndex: 2
				}
			: undefined,
		table
	};

	const handleRefreshClick = () => {
		try {
			table.setGlobalFilter('');
			table.resetGlobalFilter();
			table.resetColumnFilters();
		} catch (_) {
			// ignore if table doesn't support filter resets
		}
		if (onRefresh) {
			onRefresh();
		}
	};

	return (
		<div className="flex w-full flex-col border-b border-slate-200 dark:border-slate-800 px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-900">
			<Box
				className="flex w-full flex-col items-center"
				{...toolbarProps}
				ref={(ref: HTMLDivElement) => {
					topToolbarRef.current = ref;

					if (toolbarProps?.ref) {
						// eslint-disable-next-line
						// @ts-ignore
						toolbarProps.ref.current = ref;
					}
				}}
				sx={[
					(theme) => ({
						backgroundColor: table.options.mrtTheme.baseBackgroundColor,
						transition: 'all 150ms ease-in-out',
						zIndex: 1,
						...(parseFromValuesOrFunc(toolbarProps?.sx, theme) as unknown as object)
					}),
					isFullScreen
						? {
								position: 'sticky'
							}
						: {
								position: 'relative'
							},
					isFullScreen
						? {
								top: '0'
							}
						: {
								top: null
							}
				]}
			>
				{['both', 'top'].includes(positionToolbarDropZone ?? '') && <MRT_ToolbarDropZone table={table} />}

				<div className="flex w-full flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 min-h-[40px]">
					{/* Left: Icon & Title + optional custom actions */}
					<div className="flex items-center gap-2.5 min-w-0 w-full lg:w-auto flex-1">
						{isNavMobile && (
							<NavbarToggleButton
								className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 shrink-0 -ml-1 border-0"
								aria-label="open navigation menu"
							>
								<FuseSvgIcon size={20}>heroicons-outline:bars-3</FuseSvgIcon>
							</NavbarToggleButton>
						)}
						{(icon || title) && (
							<div className="flex items-center gap-2.5 sm:gap-3 shrink-0 py-0.5">
								{icon && (
									<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0 shadow-2xs">
										{typeof icon === 'string' ? (
											<FuseSvgIcon size={20} className="text-primary">
												{icon}
											</FuseSvgIcon>
										) : (
											icon
										)}
									</div>
								)}
								{title && (
									<div className="flex flex-col min-w-0">
										<h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0 truncate leading-tight">
											{title}
										</h1>
										{(subtitle || (typeof title === 'string' && defaultTableSubtitles[title])) && (
											<p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 m-0 font-medium whitespace-normal sm:truncate lg:whitespace-nowrap leading-tight mt-0.5 sm:mt-1">
												{subtitle || (typeof title === 'string' && defaultTableSubtitles[title])}
											</p>
										)}
									</div>
								)}
							</div>
						)}

						{enableGlobalFilter && positionGlobalFilter === 'left' && (
							<MRT_GlobalFilterTextField
								{...globalFilterProps}
								sx={{
									width: { xs: '100%', sm: 'auto' },
									flex: { xs: '1 1 100%', sm: '1 1 auto', lg: '0 0 auto' },
									minWidth: { xs: '100%', sm: '160px', lg: '200px' },
									maxWidth: { xs: '100%', lg: '280px' },
									'& .MuiInputBase-root': {
										width: '100%',
										height: '38px !important',
										minHeight: '38px !important',
										maxHeight: '38px !important',
										borderRadius: '8px !important',
										backgroundColor: (theme) =>
											theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
										fontSize: '13px',
										boxSizing: 'border-box'
									},
									'& .MuiOutlinedInput-notchedOutline': {
										borderColor: (theme) =>
											theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
										borderWidth: '1px'
									},
									'&:hover .MuiOutlinedInput-notchedOutline': {
										borderColor: '#0032ab'
									},
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
										borderColor: '#0032ab',
										borderWidth: '1.5px'
									},
									'& input': {
										height: '38px !important',
										padding: '0 10px !important',
										fontSize: '13px',
										fontStyle: 'italic',
										color: (theme) =>
											theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569',
										boxSizing: 'border-box'
									},
									'& input::placeholder': {
										fontStyle: 'italic',
										color: '#94a3b8',
										opacity: 1
									},
									'& .MuiInputAdornment-root': {
										height: '38px !important',
										maxHeight: '38px !important'
									},
									'& .MuiIconButton-root': {
										width: '20px !important',
										height: '20px !important',
										minWidth: '20px !important',
										padding: '2px !important',
										borderRadius: '4px !important',
										border: 'none !important',
										backgroundColor: 'transparent !important',
										color: '#94a3b8 !important',
										boxShadow: 'none !important',
										'&:hover': {
											backgroundColor: (theme) =>
												theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
											color: (theme) =>
												theme.palette.mode === 'dark' ? '#ffffff' : '#0f172a'
										}
									}
								}}
							/>
						)}

						{(renderTopToolbarCustomActions?.({ table }) as React.ReactNode) ?? null}
					</div>

					{/* Right: Search + Refresh + Action Buttons + MRT internal buttons */}
					<Box
						className="flex items-center gap-2 w-full lg:w-auto flex-wrap lg:flex-nowrap justify-start sm:justify-end ml-0 lg:ml-auto"
						sx={{
							'& > .MuiIconButton-root, & .MRT_ToolbarInternalButtons .MuiIconButton-root': {
								width: 38,
								height: 38,
								minHeight: 38,
								maxHeight: 38,
								borderRadius: '8px',
								border: '1px solid',
								borderColor: (theme) =>
									theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
								backgroundColor: (theme) =>
									theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
								color: (theme) =>
									theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569',
								padding: '7px',
								transition: 'all 0.15s ease-in-out',
								'&:hover': {
									backgroundColor: (theme) =>
										theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9',
									color: (theme) =>
										theme.palette.mode === 'dark' ? '#ffffff' : '#0f172a'
								}
							}
						}}
					>
						{enableGlobalFilter && positionGlobalFilter === 'right' && (
							<MRT_GlobalFilterTextField
								{...globalFilterProps}
								sx={{
									width: { xs: '100%', sm: 'auto' },
									flex: { xs: '1 1 100%', sm: '1 1 auto', lg: '0 0 auto' },
									minWidth: { xs: '100%', sm: '160px', lg: '200px' },
									maxWidth: { xs: '100%', lg: '280px' },
									'& .MuiInputBase-root': {
										width: '100%',
										height: '38px !important',
										minHeight: '38px !important',
										maxHeight: '38px !important',
										borderRadius: '8px !important',
										backgroundColor: (theme) =>
											theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
										fontSize: '13px',
										boxSizing: 'border-box'
									},
									'& .MuiOutlinedInput-notchedOutline': {
										borderColor: (theme) =>
											theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
										borderWidth: '1px'
									},
									'&:hover .MuiOutlinedInput-notchedOutline': {
										borderColor: '#0032ab'
									},
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
										borderColor: '#0032ab',
										borderWidth: '1.5px'
									},
									'& input': {
										height: '38px !important',
										padding: '0 10px !important',
										fontSize: '13px',
										fontStyle: 'italic',
										color: (theme) =>
											theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569',
										boxSizing: 'border-box'
									},
									'& input::placeholder': {
										fontStyle: 'italic',
										color: '#94a3b8',
										opacity: 1
									},
									'& .MuiInputAdornment-root': {
										height: '38px !important',
										maxHeight: '38px !important'
									},
									'& .MuiIconButton-root': {
										width: '22px !important',
										height: '22px !important',
										minWidth: '22px !important',
										padding: '2px !important',
										borderRadius: '4px !important',
										border: 'none !important',
										backgroundColor: 'transparent !important',
										color: '#94a3b8 !important',
										boxShadow: 'none !important',
										'&:hover': {
											backgroundColor: (theme) =>
												theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
											color: (theme) =>
												theme.palette.mode === 'dark' ? '#ffffff' : '#0f172a'
										}
									}
								}}
							/>
						)}

						{onRefresh && (
							<Tooltip title="Refresh & Reset filters" arrow>
								<button
									type="button"
									onClick={handleRefreshClick}
									style={{ height: '38px', width: '38px', minHeight: '38px', maxHeight: '38px' }}
									className="h-[38px] w-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer shrink-0"
								>
									<FuseSvgIcon size={17} className="text-slate-700 dark:text-slate-200">
										heroicons-outline:arrow-path
									</FuseSvgIcon>
								</button>
							</Tooltip>
						)}

						{actionButtons}

						{enableToolbarInternalActions && (
							<MRT_ToolbarInternalButtons table={table} />
						)}
					</Box>
				</div>
				{enablePagination && ['both', 'top'].includes(positionPagination ?? '') && (
					<MRT_TablePagination
						position="top"
						table={table}
					/>
				)}
				<MRT_LinearProgressBar
					isTopToolbar
					table={table}
				/>
			</Box>
			<MRT_ToolbarAlertBanner
				className="mt-1 flex justify-center rounded-md"
				stackAlertBanner={stackAlertBanner}
				table={table}
				sx={{
					'& .MuiStack-root': {
						display: 'flex',
						justifyContent: 'center',
						width: '100%',
						fontSize: 13
					}
				}}
			/>
		</div>
	);
}

export default DataTableTopToolbar;
