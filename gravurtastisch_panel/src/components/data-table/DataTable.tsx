// Updated DataTable.tsx
import {
  MaterialReactTable,
  MaterialReactTableProps,
  MRT_Icons,
} from 'material-react-table';
import _ from 'lodash';
import { useMemo, useEffect, useState } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { Theme } from '@mui/material/styles';
import DataTableTopToolbar from './DataTableTopToolbar';

const tableIcons: Partial<MRT_Icons> = {
  ArrowDownwardIcon: (props) => (
    <FuseSvgIcon size={20} {...props}>
      heroicons-outline:arrow-down-circle
    </FuseSvgIcon>
  ),
  ClearAllIcon: () => (
    <FuseSvgIcon size={20}>
      heroicons-outline:adjustments-horizontal
    </FuseSvgIcon>
  ),
  DensityLargeIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:bars-3-bottom-left</FuseSvgIcon>
  ),
  DensityMediumIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:bars-3</FuseSvgIcon>
  ),
  DensitySmallIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:bars-2</FuseSvgIcon>
  ),
  DragHandleIcon: () => null,
  FilterListIcon: (props) => (
    <FuseSvgIcon size={16} {...props}>
      heroicons-outline:funnel
    </FuseSvgIcon>
  ),
  FilterListOffIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:funnel</FuseSvgIcon>
  ),
  FullscreenExitIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:arrows-pointing-in</FuseSvgIcon>
  ),
  FullscreenIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:arrows-pointing-out</FuseSvgIcon>
  ),
  SearchIcon: (props) => (
    <FuseSvgIcon color="action" size={20} {...props}>
      heroicons-outline:magnifying-glass
    </FuseSvgIcon>
  ),
  SearchOffIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:magnifying-glass</FuseSvgIcon>
  ),
  ViewColumnIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:view-columns</FuseSvgIcon>
  ),
  MoreVertIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
  ),
  MoreHorizIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:ellipsis-horizontal</FuseSvgIcon>
  ),
  SortIcon: (props) => (
    <FuseSvgIcon size={20} {...props}>
      heroicons-outline:arrows-up-down
    </FuseSvgIcon>
  ),
  PushPinIcon: (props) => (
    <FuseSvgIcon size={20} {...props}>
      heroicons-outline:bookmark
    </FuseSvgIcon>
  ),
  VisibilityOffIcon: () => (
    <FuseSvgIcon size={20}>heroicons-outline:eye-slash</FuseSvgIcon>
  ),
};

function DataTable<TData>({
  columns,
  data,
  tableId,
  initialState = {},
  title,
  subtitle,
  icon,
  actionButtons,
  onRefresh,
  ...rest
}: any) {
  const getColumnOrderFromLocalStorage = (id: string) => {
    const storedOrder = localStorage.getItem(`columnOrder_${id}`);
    return storedOrder && storedOrder !== 'undefined'
      ? JSON.parse(storedOrder)
      : [];
  };

  const setColumnOrderToLocalStorage = (id: string, order: string[]) => {
    if (order !== undefined) {
      localStorage.setItem(`columnOrder_${id}`, JSON.stringify(order));
    }
  };

  const getDensityFromLocalStorage = (id: string) => {
    const storedDensity = localStorage.getItem(`density_${id}`);
    if (storedDensity === 'comfortable' || storedDensity === 'spacious') {
      localStorage.setItem(`density_${id}`, 'compact');
      return 'compact';
    }
    return storedDensity &&
      ['compact', 'comfortable', 'spacious'].includes(storedDensity)
      ? storedDensity
      : 'compact';
  };

  const setDensityToLocalStorage = (id: string, density: string) => {
    localStorage.setItem(`density_${id}`, density);
  };

  const [columnOrder, setColumnOrder] = useState<string[]>(
    initialState?.columnOrder ?? getColumnOrderFromLocalStorage(tableId)
  );

  const [density, setDensity] = useState<string>(
    initialState?.density || getDensityFromLocalStorage(tableId)
  );

  useEffect(() => {
    const targetDensity = initialState?.density || getDensityFromLocalStorage(tableId);
    setDensity(targetDensity);
  }, [tableId, initialState?.density]);

  useEffect(() => {
    if (!Array.isArray(columnOrder)) {
      setColumnOrder([]);
    }
  }, [columnOrder]);

  const defaults = useMemo(
    () =>
      _.defaults(rest, {
        initialState: {
          density: 'compact',
          showColumnFilters: false,
          showGlobalFilter: true,
          columnPinning: {
            left: ['mrt-row-expand', 'mrt-row-select'],
            right: ['mrt-row-actions'],
          },
          pagination: {
            pageSize: 20,
            pageIndex: 0,
          },
          enableFullScreenToggle: false,
          columnOrder,
        },

        enableFullScreenToggle: false,
        enableColumnFilterModes: true,
        // enableColumnOrdering: true,
        enableColumnOrdering: false,
        enableColumnDragging: false,
        // enableColumnActions: true,
        enableColumnActions: false,
        // enableGrouping: true,
        enableGrouping: false,
        enableColumnPinning: true,
        enableFacetedValues: true,
        enableRowActions: true,
        enableRowSelection: true,
        // Pagination defaults
        enablePagination: true,
        enableSorting: true,
        manualPagination: false, // Will be overridden if API pagination is needed
        manualSorting: false, // Will be overridden if API sorting is needed
        muiBottomToolbarProps: {
          className:
            'flex flex-row items-center justify-end min-h-[46px] h-[46px] py-0 px-2 sm:px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto',
          sx: {
            borderTop: '1px solid',
            borderColor: (theme: Theme) =>
              theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0',
            flexShrink: 0,
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
              alignItems: 'center',
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
              my: 'auto',
            },
            '& .MuiTablePagination-selectLabel': {
              fontSize: { xs: '11px', sm: '13px' },
              fontWeight: 500,
              color: (theme: Theme) =>
                theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
              margin: '0 !important',
              lineHeight: '1.2 !important',
              display: 'inline-flex',
              alignItems: 'center',
            },
            '& .MuiTablePagination-displayedRows': {
              fontSize: { xs: '11px', sm: '13px' },
              margin: '0 !important',
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
                alignItems: 'center',
              },
            },
            '& .MuiTablePagination-actions': {
              marginLeft: { xs: 0.5, sm: 1 },
              display: 'inline-flex',
              alignItems: 'center',
              '& .MuiIconButton-root': {
                padding: '4px',
                borderRadius: '6px',
              },
            },
            '& .MuiPagination-root': {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            },
            '& .MuiPaginationItem-root': {
              minWidth: { xs: 26, sm: 30 },
              height: { xs: 26, sm: 30 },
              fontSize: { xs: 12, sm: 13 },
              borderRadius: '6px',
              padding: { xs: '0 3px', sm: '0 6px' },
              margin: '0 1px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&.Mui-selected': {
                backgroundColor: '#0032ab !important',
                color: '#ffffff !important',
                fontWeight: 600,
              },
            },
          },
        },
        muiTablePaperProps: {
          elevation: 0,
          square: true,
          className: 'flex flex-col flex-auto h-full rounded-none',
          sx: {
            borderRadius: '0px !important',
            boxShadow: 'none !important',
          },
        },
        muiTableContainerProps: {
          className: 'flex-auto custom-table-scrollbar',
          sx: {
            maxWidth: '100%',
            width: '100%',
            flex: '1 1 auto',
            minHeight: 0,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          },
        },
        enableStickyHeader: true,
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'top',
        localization: {
          rowsPerPage: 'Items per page',
        },
        muiPaginationProps: {
          color: 'secondary',
          rowsPerPageOptions: [10, 20, 30, 50, 100],
          shape: 'rounded',
          variant: 'outlined',
          showRowsPerPage: true,
          showFirstButton: true,
          showLastButton: true,
        },
        muiTablePaginationProps: {
          labelRowsPerPage: 'Items per page',
        },
        muiSearchTextFieldProps: {
          placeholder: 'Search...',
          sx: {
            minWidth: { xs: '160px', sm: '220px', md: '280px' },
            minHeight: '32px !important',
            '& input': {
              fontStyle: 'italic',
              fontSize: '13px',
            },
            '& input::placeholder': {
              fontStyle: 'italic',
              color: '#94a3b8',
              opacity: 1,
            },
          },
          variant: 'outlined',
          size: 'small',
        },
        muiFilterTextFieldProps: {
          variant: 'outlined',
          size: 'small',
          sx: {
            '& .MuiInputBase-root': {
              padding: '0px 8px',
              height: '32px!important',
              minHeight: '32px!important',
              fontStyle: 'italic',
            },
            '& input': {
              fontStyle: 'italic',
              fontSize: '12px',
            },
            '& input::placeholder': {
              fontStyle: 'italic',
              color: '#94a3b8',
              opacity: 1,
            },
          },
        },
        muiSelectAllCheckboxProps: {
          className: 'w-14',
        },
        muiSelectCheckboxProps: {
          className: 'w-14',
        },
        muiTableProps: {
          sx: {
            tableLayout: 'auto',
            minWidth: { xs: '800px', lg: '100%' },
            '& .MuiTableCell-root': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiTableRow-root:hover': {
              backgroundColor: (theme: Theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(30, 41, 59, 0.4) !important'
                  : 'rgba(248, 250, 252, 0.8) !important',
              transition: 'background-color 0.15s ease',
            },
          },
        },
        muiTableBodyRowProps: ({ row, table }) => {
          return {
            sx: {
              backgroundColor: 'initial',
              opacity: 1,
              boxShadow: 'none',
              minHeight: '40px',
              borderBottom: '1px solid',
              borderColor: 'divider',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                backgroundColor: (theme: Theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(30, 41, 59, 0.4) !important'
                    : 'rgba(248, 250, 252, 0.8) !important',
              },
            },
          };
        },
        muiTableHeadProps: {
          className: 'border-b',
          sx: {
            backgroundColor: (theme: Theme) =>
              theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
        },
        muiTableHeadRowProps: {
          sx: {
            backgroundColor: (theme: Theme) =>
              theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
          },
        },
        muiTableHeadCellProps: ({ column }) => ({
          sx: {
            backgroundColor: (theme: Theme) =>
              theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 1,
            px: 1.5,
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: (theme: Theme) =>
              theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
            '& .Mui-TableHeadCell-Content-Labels': {
              flex: 1,
              justifyContent: 'space-between',
            },
            '& .Mui-TableHeadCell-Content-Actions': {
              '& > button': {
                marginX: '2px',
              },
            },
            '& .MRT_TableHeadCellDragHandleButton': {
              display: 'none !important',
            },
            '& .Mui-TableHeadCell-DragHandle-Button': {
              display: 'none !important',
            },
            '& [aria-label*="drag" i]': {
              display: 'none !important',
            },
            '& .MuiFormHelperText-root': {
              textAlign: 'center',
              marginX: 0,
              color: (theme: Theme) => theme.palette.text.disabled,
              fontSize: 11,
            },
            ...(column.getIsPinned() && {
              backgroundColor: (theme: Theme) =>
                theme.palette.mode === 'dark'
                  ? '#0f172a'
                  : '#f8fafc',
            }),
          },
        }),
        mrtTheme: (theme) => ({
          baseBackgroundColor: theme.palette.background.paper,
          menuBackgroundColor: theme.palette.background.paper,
          pinnedRowBackgroundColor: theme.palette.background.paper,
          pinnedColumnBackgroundColor: theme.palette.background.paper,
        }),
        muiTableBodyCellProps: {
          sx: {
            px: 1.5,
            py: '6px',
            boxSizing: 'border-box',
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
        },
        muiSkeletonProps: {
          animation: 'wave',
          height: 28,
          sx: { borderRadius: '6px' },
        },
        muiCircularProgressProps: {
          sx: { display: 'none' },
        },
        renderTopToolbar: (_props) => (
          <DataTableTopToolbar
            {..._props}
            title={title}
            subtitle={subtitle}
            icon={icon}
            actionButtons={actionButtons}
            onRefresh={onRefresh}
          />
        ),
        icons: tableIcons,
      } as Partial<MaterialReactTableProps<TData>>),
    [rest, columnOrder, density, title, subtitle, icon, actionButtons, onRefresh]
  );

  const tableOptions = useMemo(
    () => ({
      columns,
      data,
      ...defaults,
      ...rest,
      state: {
        showLoadingOverlay: false,
        showProgressBars: false,
        columnOrder,
        density,
        ...rest.state,
        showSkeletons:
          rest.state?.showSkeletons !== undefined
            ? rest.state.showSkeletons
            : Boolean(rest.state?.isLoading),
      },

      onColumnOrderChange: (newOrder) => {
        if (newOrder) {
          setColumnOrderToLocalStorage(tableId, newOrder);
          setColumnOrder(newOrder);
        }
      },
      onDensityChange: (newDensity) => {
        if (newDensity) {
          setDensityToLocalStorage(tableId, newDensity);
          setDensity(newDensity);
        }
      },
      ...(rest.onGlobalFilterChange && {
        onGlobalFilterChange: rest.onGlobalFilterChange,
      }),
    }),
    [columns, data, defaults, rest, columnOrder, tableId, density]
  );


  return (
    <MaterialReactTable
      {...tableOptions}
    // render total items in the bottom right toolbar
    />
  );
}

export default DataTable;
