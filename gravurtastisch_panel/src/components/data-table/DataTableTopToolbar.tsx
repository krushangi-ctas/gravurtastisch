import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
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

export interface DataTableTopToolbarProps<TData extends MRT_RowData> {
	table: MRT_TableInstance<TData>;
	title?: React.ReactNode | string;
	icon?: string | React.ReactNode;
	actionButtons?: React.ReactNode;
	onRefresh?: () => void;
}

function DataTableTopToolbar<TData extends MRT_RowData>({
	table,
	title,
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

	return (
		<div className="flex w-full flex-col border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 bg-white dark:bg-slate-900">
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

				<div className="flex w-full flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 min-h-[40px]">
					{/* Left: Icon & Title + optional custom actions */}
					<div className="flex items-center gap-2.5 min-w-0 flex-1">
						{(icon || title) && (
							<div className="flex items-center gap-2.5 shrink-0 py-0.5">
								{icon && (
									<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
										{typeof icon === 'string' ? (
											<FuseSvgIcon size={18} className="text-primary">
												{icon}
											</FuseSvgIcon>
										) : (
											icon
										)}
									</div>
								)}
								{title && (
									<h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0 whitespace-nowrap">
										{title}
									</h1>
								)}
							</div>
						)}

						{enableGlobalFilter && positionGlobalFilter === 'left' && (
							<MRT_GlobalFilterTextField {...globalFilterProps} />
						)}

						{renderTopToolbarCustomActions?.({ table }) ?? null}
					</div>

					{/* Right: Search + Refresh + Action Buttons + MRT internal buttons */}
					<Box className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end ml-auto">
						{enableGlobalFilter && positionGlobalFilter === 'right' && (
							<MRT_GlobalFilterTextField
								{...globalFilterProps}
								sx={{
									'& .MuiOutlinedInput-root': {
										height: 32,
										minHeight: 32,
										paddingX: 1
									}
								}}
							/>
						)}

						{onRefresh && (
							<Tooltip title="Refresh list" arrow>
								<button
									type="button"
									onClick={onRefresh}
									style={{ height: '32px', width: '32px' }}
									className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer shrink-0"
								>
									<FuseSvgIcon size={16} className="text-slate-700 dark:text-slate-200">
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
