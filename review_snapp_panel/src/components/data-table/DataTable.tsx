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
  DragHandleIcon: () => (
    <FuseSvgIcon className="rotate-45" size={14}>
      heroicons-outline:arrows-pointing-out
    </FuseSvgIcon>
  ),
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
    initialState.columnOrder ?? getColumnOrderFromLocalStorage(tableId)
  );

  const [density, setDensity] = useState<string>(
    getDensityFromLocalStorage(tableId)
  );

  useEffect(() => {
    if (!Array.isArray(columnOrder)) {
      setColumnOrder([]);
    }
  }, [columnOrder]);

  const defaults = useMemo(
    () =>
      _.defaults(rest, {
        initialState: {
          density: density ? density : 'spacious',
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
        enableColumnOrdering: true,
        enableGrouping: true,
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
            'flex flex-row items-center justify-end min-h-[46px] h-[46px] py-0 px-2 sm:px-4 bg-gray-100',
          sx: {
            borderTop: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
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
              alignItems: 'center',
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
              my: 'auto',
            },
            '& .MuiTablePagination-selectLabel': {
              fontSize: { xs: '12px', sm: '13px' },
              margin: '0 !important',
              lineHeight: '1.2 !important',
              display: 'inline-flex',
              alignItems: 'center',
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
                alignItems: 'center',
              },
            },
            '& .MuiTablePagination-actions': {
              marginLeft: { xs: 0.5, sm: 1 },
              display: 'inline-flex',
              alignItems: 'center',
              '& .MuiIconButton-root': {
                padding: '4px',
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
              padding: { xs: '0 3px', sm: '0 6px' },
              margin: '0 1px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
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
          className: 'flex-auto',
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
          placeholder: 'Search',
          sx: { minWidth: '380px', minHeight: '38px !important' },
          variant: 'outlined',
          size: 'medium',
        },
        muiFilterTextFieldProps: {
          variant: 'outlined',
          size: 'medium',
          sx: {
            '& .MuiInputBase-root': {
              padding: '0px 8px',
              height: '32px!important',
              minHeight: '32px!important',
            },
          },
        },
        muiSelectAllCheckboxProps: {
          className: 'w-14',
        },
        muiSelectCheckboxProps: {
          className: 'w-14',
        },
        muiTableBodyRowProps: ({ row, table }) => {
          const { density } = table.getState();

          if (density === 'compact') {
            return {
              sx: {
                backgroundColor: 'initial',
                opacity: 1,
                boxShadow: 'none',
                height: row.getIsPinned() ? `${37}px` : undefined,
              },
            };
          }

          return {
            sx: {
              backgroundColor: 'initial',
              opacity: 1,
              boxShadow: 'none',
              height: row.getIsPinned()
                ? `${density === 'comfortable' ? 53 : 69}px`
                : undefined,
            },
          };
        },
        muiTableHeadProps: {
          className: 'bg-gray-100 border-t border-b border-gray-200',
        },
        muiTableHeadRowProps: {
          className: 'bg-gray-100 border-t border-b border-gray-200',
        },
        muiTableHeadCellProps: ({ column }) => ({
          className: 'bg-gray-100 border-t border-b border-gray-200',
          sx: {
            '& .Mui-TableHeadCell-Content-Labels': {
              flex: 1,
              justifyContent: 'space-between',
            },
            '& .Mui-TableHeadCell-Content-Actions': {
              '& > button': {
                marginX: '2px',
              },
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
                  ? theme.palette.background.paper
                  : undefined,
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
            px: 1,
            py: 0.5,
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
        renderTopToolbar: (_props) => <DataTableTopToolbar {..._props} />,
        icons: tableIcons,
      } as Partial<MaterialReactTableProps<TData>>),
    [rest, columnOrder, density]
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
