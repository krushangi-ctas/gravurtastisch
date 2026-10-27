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
  tabs,
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
    return storedDensity &&
      ['compact', 'comfortable', 'spacious'].includes(storedDensity)
      ? storedDensity
      : 'comfortable';
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
          density: 'comfortable',
          showColumnFilters: false,
          showGlobalFilter: true,
          columnPinning: {
            left: ['mrt-row-expand', 'mrt-row-select'],
            right: ['mrt-row-actions'],
          },
          pagination: {
            pageSize: 100,
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
            'flex flex-row items-center justify-end min-h-[46px] h-[46px] py-0 px-2 sm:px-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-x-auto',
          sx: {
            backgroundColor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
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
              fontWeight: 600,
              color: 'text.primary',
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
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
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
            backgroundColor: 'background.paper',
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
            '& .MuiInputBase-root': {
              backgroundColor: 'background.paper',
            },
            '& input': {
              fontStyle: 'italic',
              fontSize: '13px',
            },
            '& input::placeholder': {
              fontStyle: 'italic',
              color: 'text.disabled',
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
              color: 'text.disabled',
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
              backgroundColor: 'action.hover',
              transition: 'background-color 0.15s ease',
            },
            '& .MuiTableRow-root:hover td': {
              backgroundColor: 'action.hover',
            },
            '& .MuiTableRow-root:hover td:before': {
              backgroundColor: 'action.hover',
            },
            '& .MuiTableRow-root:hover td:after': {
              backgroundColor: 'transparent !important',
            },
          },
        },
        displayColumnDefOptions: {
          'mrt-row-actions': {
            muiTableHeadCellProps: {
              className:
                'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700',
            },
          },
          'mrt-row-select': {
            muiTableHeadCellProps: {
              className:
                'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700',
            },
          },
        },
        muiTableBodyRowProps: ({ row, table }) => {
          return {
            sx: {
              backgroundColor: 'background.paper',
              opacity: 1,
              boxShadow: 'none',
              minHeight: '48px',
              borderBottom: '1px solid',
              borderColor: 'divider',
              transition: 'background-color 0.15s ease',
              '& td, & td:before': {
                backgroundColor: 'background.paper',
              },
              '&:hover, &:hover td, &:hover td:before': {
                backgroundColor: 'action.hover',
              },
              '&:hover td:after': {
                backgroundColor: 'transparent !important',
              },
            },
          };
        },
        muiTableHeadProps: {
          className:
            'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700',
        },
        muiTableHeadRowProps: {
          className:
            'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700',
        },
        muiTableHeadCellProps: ({ column }) => ({
          className:
            'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700',
          sx: {
            py: 1,
            px: 1.5,
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
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
          },
        }),
        mrtTheme: (theme) => ({
          baseBackgroundColor: theme.palette.background.paper,
          menuBackgroundColor: theme.palette.background.paper,
          pinnedRowBackgroundColor: theme.palette.background.default,
          pinnedColumnBackgroundColor: theme.palette.background.paper,
        }),
        muiTableBodyCellProps: {
          sx: {
            px: 1.5,
            py: '10px !important',
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
            tabs={tabs}
          />
        ),
        icons: tableIcons,
      } as Partial<MaterialReactTableProps<TData>>),
    [rest, columnOrder, density, title, subtitle, icon, actionButtons, onRefresh, tabs]
  );

  const tableOptions = useMemo(
    () => ({
      columns,
      data,
      ...defaults,
      ...rest,
      muiTableProps: {
        ...(defaults.muiTableProps || {}),
        ...(rest.muiTableProps || {}),
        sx: {
          backgroundColor: 'background.paper',
          ...((defaults.muiTableProps as any)?.sx || {}),
          ...((rest.muiTableProps as any)?.sx || {}),
          '& .MuiTableHead-root, & .MuiTableHead-root .MuiTableCell-root': {
            fontWeight: 700,
            fontSize: 11.5,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          },
        },
      },
      muiTablePaperProps: {
        ...(defaults.muiTablePaperProps || {}),
        ...(rest.muiTablePaperProps || {}),
        elevation: 0,
        square: true,
        className: 'flex flex-col flex-auto h-full rounded-none',
        sx: {
          borderRadius: '0px !important',
          boxShadow: 'none !important',
          backgroundColor: 'background.paper',
          ...((defaults.muiTablePaperProps as any)?.sx || {}),
          ...((rest.muiTablePaperProps as any)?.sx || {}),
        },
      },
      muiTableContainerProps: {
        ...(defaults.muiTableContainerProps || {}),
        ...(rest.muiTableContainerProps || {}),
        className: 'flex-auto custom-table-scrollbar',
        sx: {
          backgroundColor: 'background.paper',
          ...((defaults.muiTableContainerProps as any)?.sx || {}),
          ...((rest.muiTableContainerProps as any)?.sx || {}),
        },
      },
      muiTableBodyRowProps: (props: any) => {
        const defaultRowProps =
          typeof defaults.muiTableBodyRowProps === 'function'
            ? defaults.muiTableBodyRowProps(props)
            : defaults.muiTableBodyRowProps || {};
        const restRowProps =
          typeof rest.muiTableBodyRowProps === 'function'
            ? rest.muiTableBodyRowProps(props)
            : rest.muiTableBodyRowProps || {};
        return {
          ...defaultRowProps,
          ...restRowProps,
          sx: {
            opacity: 1,
            boxShadow: 'none',
            minHeight: '48px',
            borderBottom: '1px solid',
            borderColor: 'divider',
            transition: 'background-color 0.15s ease',
            backgroundColor: 'background.paper',
            '& td, & td:before': {
              backgroundColor: 'background.paper',
            },
            '&:hover, &:hover td, &:hover td:before': {
              backgroundColor: 'action.hover',
            },
            '&:hover td:after': {
              backgroundColor: 'transparent !important',
            },
            ...(defaultRowProps?.sx || {}),
            ...(restRowProps?.sx || {}),
          },
        };
      },
      muiTableBodyCellProps: (props: any) => {
        const defaultCellProps =
          typeof defaults.muiTableBodyCellProps === 'function'
            ? defaults.muiTableBodyCellProps(props)
            : defaults.muiTableBodyCellProps || {};
        const restCellProps =
          typeof rest.muiTableBodyCellProps === 'function'
            ? rest.muiTableBodyCellProps(props)
            : rest.muiTableBodyCellProps || {};
        return {
          ...defaultCellProps,
          ...restCellProps,
          sx: {
            px: 1.5,
            py: '10px !important',
            boxSizing: 'border-box',
            borderBottom: '1px solid',
            borderColor: 'divider',
            ...(defaultCellProps?.sx || {}),
            ...(restCellProps?.sx || {}),
          },
        };
      },
      muiBottomToolbarProps: {
        ...(defaults.muiBottomToolbarProps || {}),
        ...(rest.muiBottomToolbarProps || {}),
        className:
          'flex flex-row items-center justify-end min-h-[46px] h-[46px] py-0 px-2 sm:px-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-x-auto',
        sx: {
          ...((defaults.muiBottomToolbarProps as any)?.sx || {}),
          ...((rest.muiBottomToolbarProps as any)?.sx || {}),
          backgroundColor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          marginTop: 'auto',
          position: 'sticky',
          bottom: 0,
        },
      },
      displayColumnDefOptions: {
        ...(defaults.displayColumnDefOptions || {}),
        ...(rest.displayColumnDefOptions || {}),
        'mrt-row-actions': {
          ...(defaults.displayColumnDefOptions?.['mrt-row-actions'] || {}),
          ...(rest.displayColumnDefOptions?.['mrt-row-actions'] || {}),
          muiTableHeadCellProps: {
            className:
              'bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700',
            ...((rest.displayColumnDefOptions?.['mrt-row-actions'] as any)?.muiTableHeadCellProps || {}),
            sx: {
              ...((rest.displayColumnDefOptions?.['mrt-row-actions'] as any)?.muiTableHeadCellProps?.sx || {}),
              opacity: '1 !important',
              boxShadow: 'none !important',
              '&:before, &:after, &[data-pinned="true"]:before, &[data-pinned="true"]:after': {
                boxShadow: 'none !important',
                opacity: '1 !important',
              },
            },
          },
          muiTableBodyCellProps: {
            ...((rest.displayColumnDefOptions?.['mrt-row-actions'] as any)?.muiTableBodyCellProps || {}),
            sx: {
              ...((rest.displayColumnDefOptions?.['mrt-row-actions'] as any)?.muiTableBodyCellProps?.sx || {}),
              boxShadow: 'none !important',
            },
          },
        },
      },
      state: {
        showLoadingOverlay: false,
        showProgressBars: false,
        ...(Boolean(rest.enableColumnOrdering) && columnOrder && columnOrder.length > 0 ? { columnOrder } : {}),
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
