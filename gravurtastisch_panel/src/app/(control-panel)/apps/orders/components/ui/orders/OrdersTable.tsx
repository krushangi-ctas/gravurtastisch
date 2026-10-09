import { useMemo, useRef, useState } from 'react';
import {
  type MRT_ColumnDef,
  type MRT_SortingState,
} from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { useAutoScrollRef } from 'src/hooks/useAutoScrollRef';
import {
  ListItemIcon,
  MenuItem,
  Paper,
  Typography,
  Button,
  Box,
  Tooltip,
  Chip,
  useTheme,
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { Order } from '../../../api/types';
import { useUpdateOrder } from '../../../api/hooks/orders/useUpdateOrder';
import { useOrders } from '../../../api/hooks/orders/useOrders';
import React from 'react';

// Extended type for flattened orders
type FlattenedOrder = Order & {
  orderItem?: any;
  isMainOrder: boolean;
  isFirstRow: boolean;
  shippingAddress?: {
    postalCode: string;
    city: string;
    countryCode: string;
    addressLine1: string;
    addressLine2: string;
  };
  daysDifference?: number;
  deliveryDays?: number;
  daysToDelivery?: number;
  orderTotal?: {
    currencyCode: string;
    amount: number;
  };
  comment?: string;
};

function OrdersTable({
  searchDate,
  searchText,
  selectedMarketplace,
  canUpdateOrders = true,
}: {
  searchDate: Record<string, Date | null>;
  searchText: string;
  selectedMarketplace: string[];
  canUpdateOrders?: boolean;
}) {
  const theme = useTheme();
  const autoScrollRef = useAutoScrollRef<HTMLDivElement>();
  // ---------------------------------------------------------------------
  // Shared, theme-driven style tokens.
  // Keeping every cell's look-and-feel in one place means the whole table
  // reads as one coherent design system instead of per-cell one-offs.
  // ---------------------------------------------------------------------
  const chipBase = {
    height: 20,
    fontSize: 11,
    fontWeight: 600,
    borderRadius: '4px',
    '& .MuiChip-label': { px: 0.75 },
  } as const;

  const monoText = {
    fontFamily: "'Roboto Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
  } as const;

  const copyIconSx = {
    color: theme.palette.text.disabled,
    cursor: 'pointer',
    '&:hover': { color: theme.palette.primary.main },
  } as const;

  const urgencyToken = (days: number) => {
    if (days <= 3)
      return { color: theme.palette.error.main, bg: theme.palette.error.light + '22' };
    if (days <= 7)
      return { color: theme.palette.warning.main, bg: theme.palette.warning.light + '22' };
    if (days <= 14)
      return { color: theme.palette.info.main, bg: theme.palette.info.light + '22' };
    return { color: theme.palette.success.main, bg: theme.palette.success.light + '22' };
  };

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100, // Start with a reasonable default
  });


  const debounceRef = useRef<boolean>(false);

  // State for sorting
  const [sorting, setSorting] = useState<MRT_SortingState>([
    { id: 'purchaseDate', desc: true },
  ]);

  // Derive sortKey and sortOrder from sorting state
  const sortKey = sorting[0]?.id || 'purchaseDate';
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  // Call your API with the search value, pagination, and sorting
  const { data: ordersResponse, isLoading } = useOrders({
    search: searchText,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    from: searchDate?.from ? searchDate.from.toISOString() : '',
    to: searchDate?.to ? searchDate.to.toISOString() : '',
    marketplaceId: selectedMarketplace,
    sortBy: sortKey, // Pass sortKey to API
    sortOrder: sortKey ? sortOrder : undefined, // Only pass sortOrder if sortKey exists
  });

  // Update pagination state when API response changes
  React.useEffect(() => {
    if (ordersResponse?.pagination) {
      const newPageSize = ordersResponse.pagination.size || 20;

      // Only update pageSize if it changed, don't override pageIndex
      if (pagination.pageSize !== newPageSize) {
        setPagination((prev: any) => ({
          ...prev,
          pageSize: newPageSize,
        }));
      }
    }
  }, [ordersResponse?.pagination, pagination.pageSize]);

  // Reset to first page when search criteria or sorting change
  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0, // Reset to first page when search criteria or sorting change
    }));
  }, [searchDate?.from, searchDate?.to, searchText, sortKey, sortOrder]);

  const { mutate: sendFeedback } = useUpdateOrder();

  // Extract orders data from the response and flatten orderItems
  const orders = ordersResponse?.data || [];
  const paginationInfo = ordersResponse?.pagination;

  // Flatten orders to show each orderItem as a separate row
  const flattenedOrders = orders.flatMap((order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      // If no orderItems, create a single row with order data
      return [
        {
          ...order,
          orderItem: null,
          isMainOrder: true,
          isFirstRow: true,
        },
      ];
    }

    // Create a row for each orderItem with order data
    return order.orderItems.map((orderItem, index) => ({
      ...order,
      orderItem,
      isMainOrder: false,
      isFirstRow: index === 0, // Only first row of each order group
    }));
  });

  // Map your pagination response to Material React Table format
  const mappedPaginationInfo = {
    totalItems: paginationInfo?.length || 0,
    totalPages: paginationInfo?.lastPage || 1,
    currentPage: paginationInfo?.page || 0,
    pageSize: paginationInfo?.size || 20,
  };

  const columns = useMemo<MRT_ColumnDef<FlattenedOrder>[]>(
    () => [
      {
        id: 'purchaseDate',
        header: 'Order Date',
        size: 90,
        Cell: ({ row }) => {
          if (!row.original.isFirstRow) {
            return <Box sx={{ height: 16 }} />; // Empty space for non-first rows
          }

          const purchaseDate = row.original.purchaseDate;
          const date = new Date(purchaseDate);
          const dateString = date.toLocaleDateString('en-GB');
          const timeString = date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <Tooltip title={`${dateString} ${timeString}`} arrow>
              <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
                  {dateString}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>
                  {timeString}
                </Typography>
              </Box>
            </Tooltip>
          );
        },
      },
      {
        id: 'orderInfo',
        header: 'Order',
        size: 160,
        accessorKey: 'amazonOrderId',
        Cell: ({ row }) => {
          if (!row.original.isFirstRow) {
            return <Box sx={{ height: 16 }} />; // Empty space for non-first rows
          }

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title={`Order ID: ${row.original.amazonOrderId}`} arrow>
                  <Typography sx={{ ...monoText, fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
                    {row.original.amazonOrderId}
                  </Typography>
                </Tooltip>
                <FuseSvgIcon
                  size={13}
                  sx={copyIconSx}
                  onClick={() =>
                    navigator.clipboard.writeText(row.original.amazonOrderId)
                  }
                >
                  heroicons-outline:clipboard-document
                </FuseSvgIcon>
              </Box>
              <Tooltip title={row.original.buyerEmail || ''} arrow>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: 'text.disabled',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 155,
                    display: 'block',
                  }}
                >
                  {row.original.buyerEmail}
                </Typography>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        id: 'actions',
        header: 'Status',
        size: 90,
        enableHiding: false,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const indexOfOrder = row.original.orderItems.findIndex(
            (orderItem) =>
              orderItem?.orderItemId === row.original.orderItem?.orderItemId
          );

          const { isNeedToSend, isSent, comment } = row.original;

          if (indexOfOrder !== 0) {
            return null;
          }

          if (isSent) {
            return (
              <Tooltip title="Solicitation request sent successfully" arrow>
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
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                    color: (t) => t.palette.mode === 'dark' ? '#4ADE80' : '#16A34A',
                    border: '1px solid',
                    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.25)',
                    lineHeight: 1,
                  }}
                >
                  <FuseSvgIcon size={13}>heroicons-outline:check-circle</FuseSvgIcon>
                  Sent
                </Box>
              </Tooltip>
            );
          }

          if (isNeedToSend && !isSent) {
            return (
              <Tooltip title={comment ? comment : 'Waiting while order is processed'} arrow>
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
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                    color: (t) => t.palette.mode === 'dark' ? '#FBBF24' : '#D97706',
                    border: '1px solid',
                    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)',
                    lineHeight: 1,
                  }}
                >
                  <FuseSvgIcon size={13}>lucide:clock</FuseSvgIcon>
                  Pending
                </Box>
              </Tooltip>
            );
          }

          if (!canUpdateOrders) {
            return (
              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>
            );
          }

          return (
            <Tooltip title="Send Solicitation Request" arrow>
              <Button
                key="feedback"
                size="small"
                onClick={() => sendFeedback([row.original._id])}
                startIcon={<FuseSvgIcon size={13}>lucide:send</FuseSvgIcon>}
                sx={{
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: 11.5,
                  textTransform: 'none',
                  px: 1.25,
                  py: 0.3,
                  minHeight: 24,
                  height: 24,
                  boxSizing: 'border-box',
                  lineHeight: 1,
                  bgcolor: (t) =>
                    t.palette.mode === 'dark'
                      ? 'rgba(21, 101, 192, 0.2)'
                      : 'rgba(21, 101, 192, 0.1)',
                  color: (t) =>
                    t.palette.mode === 'dark' ? '#90CAF9' : '#1565C0',
                  border: '1px solid',
                  borderColor: (t) =>
                    t.palette.mode === 'dark'
                      ? 'rgba(21, 101, 192, 0.35)'
                      : 'rgba(21, 101, 192, 0.25)',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: (t) =>
                      t.palette.mode === 'dark'
                        ? 'rgba(21, 101, 192, 0.3)'
                        : 'rgba(21, 101, 192, 0.18)',
                    borderColor: (t) =>
                      t.palette.mode === 'dark'
                        ? 'rgba(21, 101, 192, 0.5)'
                        : 'rgba(21, 101, 192, 0.4)',
                    boxShadow: 'none',
                  },
                }}
              >
                Send
              </Button>
            </Tooltip>
          );
        },
      },
      {
        id: 'ASIN',
        header: 'ASIN / Item ID',
        size: 125,
        enableSorting: true,
        Cell: ({ row }) => {
          const orderItem = row.original.orderItem;
          if (!orderItem)
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title={`ASIN: ${orderItem.ASIN}`} arrow>
                  <Typography
                    sx={{
                      ...monoText,
                      fontSize: 12,
                      color: (t) => (t.palette.mode === 'dark' ? '#FB923C' : '#C2410C'),
                      fontWeight: 600,
                    }}
                  >
                    {orderItem.ASIN}
                  </Typography>
                </Tooltip>
                <FuseSvgIcon
                  size={12}
                  sx={{
                    ...copyIconSx,
                    '&:hover': {
                      color: (t) => (t.palette.mode === 'dark' ? '#FB923C' : '#C2410C'),
                    },
                  }}
                  onClick={() => navigator.clipboard.writeText(orderItem.ASIN)}
                >
                  heroicons-outline:clipboard-document
                </FuseSvgIcon>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title={`Item ID: ${orderItem.orderItemId}`} arrow>
                  <Typography sx={{ ...monoText, fontSize: 10.5, color: 'text.disabled' }}>
                    {orderItem.orderItemId}
                  </Typography>
                </Tooltip>
                <FuseSvgIcon
                  size={11}
                  sx={copyIconSx}
                  onClick={() => navigator.clipboard.writeText(orderItem.orderItemId)}
                >
                  heroicons-outline:clipboard-document
                </FuseSvgIcon>
              </Box>
            </Box>
          );
        },
      },
      {
        id: 'title',
        header: 'Product',
        size: 200,
        enableSorting: true,
        Cell: ({ row }) => {
          const orderItem = row.original.orderItem;
          if (!orderItem)
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;

          const isGift = orderItem.isGift;
          const isTransparency = orderItem.isTransparency;

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
              <Tooltip title={orderItem.title} arrow>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'text.primary',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    whiteSpace: 'normal',
                    lineHeight: 1.25,
                    maxWidth: 195,
                    wordBreak: 'break-word',
                  }}
                >
                  {orderItem.title}
                </Typography>
              </Tooltip>
              {(isGift || isTransparency) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {isGift && (
                    <Tooltip title="Gift order" arrow>
                      <Chip
                        icon={<FuseSvgIcon size={11}>heroicons-outline:gift</FuseSvgIcon>}
                        label="Gift"
                        size="small"
                        sx={{
                          ...chipBase,
                          height: 18,
                          fontSize: 10.5,
                          bgcolor: 'secondary.light',
                          color: 'secondary.dark',
                          '& .MuiChip-icon': { color: 'secondary.dark', ml: 0.5 },
                        }}
                      />
                    </Tooltip>
                  )}
                  {isTransparency && (
                    <Tooltip title="Amazon Transparency protected" arrow>
                      <Chip
                        icon={<FuseSvgIcon size={11}>heroicons-outline:shield-check</FuseSvgIcon>}
                        label="Transparency"
                        size="small"
                        sx={{
                          ...chipBase,
                          height: 18,
                          fontSize: 10.5,
                          bgcolor: 'info.light',
                          color: 'info.dark',
                          '& .MuiChip-icon': { color: 'info.dark', ml: 0.5 },
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              )}
            </Box>
          );
        },
      },
      {
        id: 'qtyCondition',
        header: 'Qty / Condition',
        size: 115,
        accessorFn: (row) => row.orderItem?.quantityOrdered ?? 0,
        enableColumnActions: false,
        enableHiding: false,
        enablePinning: false,
        enableResizing: false,
        Cell: ({ row }) => {
          const orderItem = row.original.orderItem;
          if (!orderItem)
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Tooltip title={`Quantity: ${orderItem.quantityOrdered}`} arrow>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
                  Qty {orderItem.quantityOrdered}
                </Typography>
              </Tooltip>
              {orderItem.conditionSubtypeId && (
                <Tooltip title={orderItem.conditionSubtypeId} arrow>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 1,
                      py: 0.15,
                      borderRadius: '999px',
                      fontSize: 10.5,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      bgcolor: (t) =>
                        t.palette.mode === 'dark'
                          ? 'rgba(21, 101, 192, 0.18)'
                          : 'rgba(21, 101, 192, 0.08)',
                      color: (t) =>
                        t.palette.mode === 'dark' ? '#90CAF9' : '#1565C0',
                      border: '1px solid',
                      borderColor: (t) =>
                        t.palette.mode === 'dark'
                          ? 'rgba(21, 101, 192, 0.32)'
                          : 'rgba(21, 101, 192, 0.2)',
                      maxWidth: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {orderItem.conditionSubtypeId}
                  </Box>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
      {
        id: 'channelInfo',
        header: 'Channel',
        size: 125,
        Cell: ({ row }) => {
          const fulfillment = row.original.fulfillmentChannel;
          const sales = row.original.salesChannel;
          const isAFN = fulfillment === 'AFN' || fulfillment === 'FBA';

          return (
            <Tooltip title={`Fulfillment: ${fulfillment || '—'} · Channel: ${sales || '—'}`} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 0.75,
                    py: 0.1,
                    borderRadius: '4px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    bgcolor: isAFN
                      ? (t) => t.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)'
                      : (t) => t.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(71, 85, 105, 0.08)',
                    color: isAFN
                      ? (t) => t.palette.mode === 'dark' ? '#93C5FD' : '#1D4ED8'
                      : 'text.primary',
                    border: '1px solid',
                    borderColor: isAFN
                      ? (t) => t.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.25)'
                      : 'divider',
                    lineHeight: 1.2,
                  }}
                >
                  {fulfillment || '—'}
                </Box>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sales}
                </Typography>
              </Box>
            </Tooltip>
          );
        },
      },
      {
        id: 'delivery',
        header: 'Delivery (EDD)',
        size: 105,
        accessorKey: 'earliestDeliveryDate',
        Cell: ({ row }) => {
          const edd = row.original.earliestDeliveryDate;
          const daysDiff =
            row.original.daysDifference ??
            row.original.deliveryDays ??
            row.original.daysToDelivery ??
            null;

          return (
            <Tooltip title={`Delivery Date: ${new Date(edd).toLocaleDateString('en-GB')}${daysDiff !== null ? ` (${daysDiff} days left)` : ''}`} arrow>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
                  {new Date(edd).toLocaleDateString('en-GB')}
                </Typography>
                {daysDiff === null ? (
                  <Chip
                    label="N/A"
                    size="small"
                    variant="outlined"
                    sx={{ ...chipBase, height: 18, fontSize: 10, borderColor: 'divider', color: 'text.disabled' }}
                  />
                ) : (
                  (() => {
                    const { color, bg } = urgencyToken(daysDiff as number);
                    return (
                      <Chip
                        label={`${daysDiff}d left`}
                        size="small"
                        sx={{ ...chipBase, height: 18, fontSize: 10.5, color, bgcolor: bg, alignSelf: 'flex-start' }}
                      />
                    );
                  })()
                )}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        id: 'totalAmount',
        header: 'Total',
        size: 85,
        accessorFn: (row) =>
          row.orderTotal?.amount ? parseFloat(String(row.orderTotal.amount)) : 0,
        Cell: ({ row }) => {
          const orderTotal = row.original.orderTotal;
          if (
            !orderTotal ||
            typeof orderTotal !== 'object' ||
            !orderTotal.amount ||
            !orderTotal.currencyCode
          ) {
            return (
              <Typography sx={{ fontSize: 12, color: 'text.disabled', fontStyle: 'italic' }}>
                N/A
              </Typography>
            );
          }

          const { currencyCode, amount } = orderTotal;
          const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);

          if (isNaN(numericAmount)) {
            return (
              <Typography sx={{ fontSize: 12, color: 'text.disabled', fontStyle: 'italic' }}>
                Invalid
              </Typography>
            );
          }

          return (
            <Tooltip title={`Total: ${numericAmount.toFixed(2)} ${currencyCode}`} arrow>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4 }}>
                <Typography
                  sx={{
                    ...monoText,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: (t) => t.palette.mode === 'dark' ? '#FBBF24' : '#B45309',
                    letterSpacing: -0.2,
                  }}
                >
                  {numericAmount.toFixed(2)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: (t) => t.palette.mode === 'dark' ? '#FCD34D' : '#D97706',
                  }}
                >
                  {currencyCode}
                </Typography>
              </Box>
            </Tooltip>
          );
        },
      },
      {
        id: 'city',
        header: 'Location',
        size: 110,
        accessorFn: (row) => row.shippingAddress?.city ?? '',
        Cell: ({ row }) => {
          const addr = row.original.shippingAddress;
          const city = addr?.city || 'N/A';
          const subLine = [addr?.postalCode, addr?.countryCode].filter(Boolean).join(', ');

          return (
            <Tooltip title={[city, subLine].filter(Boolean).join(' · ')} arrow>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.1 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: 105,
                  }}
                >
                  {city}
                </Typography>
                {subLine && (
                  <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                    {subLine}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        },
      },
    ],
    [theme]
  );

  return (
    <Paper
      ref={autoScrollRef}
      className="flex w-full flex-auto flex-col rounded-none mt-0"
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
          height: '100%',
        },
      }}
    >
      <DataTable
        enableRowActions={false}
        enableRowSelection={false}
        data={flattenedOrders}
        columns={columns}
        enableGlobalFilter={false}
        state={{
          isLoading,
          pagination,
          sorting,
        }}
        onPaginationChange={(updater) => {
          setPagination((prev) => {
            const newPagination =
              typeof updater === 'function' ? updater(prev) : updater;
            if (
              prev.pageIndex !== newPagination.pageIndex ||
              prev.pageSize !== newPagination.pageSize
            ) {
              if (!debounceRef.current) {
                debounceRef.current = true;
                setTimeout(() => {
                  debounceRef.current = false;
                }, 1000);
                return newPagination;
              } else {
                return prev;
              }
            }
            return prev;
          });
        }}
        onSortingChange={setSorting}
        manualPagination={true}
        manualSorting={true}
        pageCount={mappedPaginationInfo.totalPages}
        rowCount={mappedPaginationInfo.totalItems}
        enablePagination={true}
        enableColumnFilters={false}
        enableSorting={true}
        initialState={{
          pagination: { pageIndex: 0, pageSize: pagination.pageSize || 20 },
          sorting: [],
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'auto',
            minWidth: '100%',
            '& .MuiTableRow-root:hover': {
              backgroundColor: 'action.hover',
              transition: 'background-color 0.15s ease',
            },
            '& .MuiTableCell-root': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              padding: '4px 8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
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
              whiteSpace: 'normal',
              overflow: 'visible',
              textOverflow: 'clip',
              wordBreak: 'break-word',
              padding: '6px 8px',
              maxWidth: '100%',
              textAlign: 'left',
              '& .MuiTableSortLabel-root': {
                overflow: 'visible',
                textOverflow: 'clip',
                whiteSpace: 'normal',
                maxWidth: '100%',
              },
            },
          },
        }}
        muiTableHeadProps={{
          className: 'bg-gray-100 border-t border-b border-gray-200',
        }}
        muiTableHeadRowProps={{
          className: 'bg-gray-100 border-t border-b border-gray-200',
        }}
        muiTableHeadCellProps={{
          className: 'bg-gray-100 border-t border-b border-gray-200',
        }}
        muiTableContainerProps={{
          sx: {
            maxWidth: '100%',
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'auto',
            '&::-webkit-scrollbar': { height: 8, width: 8 },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'background.default',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'divider',
              borderRadius: 4,
              '&:hover': { backgroundColor: 'text.disabled' },
            },
          },
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
        }}
        renderRowActionMenuItems={({ closeMenu, row, table }) => {
          if (!canUpdateOrders) {
            return [];
          }

          const { isNeedToSend, isSent } = row.original;

          let buttonText = 'Send Feedback';
          let buttonIcon = <FuseSvgIcon size={16}>lucide:send</FuseSvgIcon>;
          let color: 'primary' | 'success' | 'warning' = 'primary';
          let disabled = false;

          if (isSent) {
            buttonText = 'Sent';
            buttonIcon = <FuseSvgIcon size={16}>heroicons-outline:check-circle</FuseSvgIcon>;
            color = 'success';
            disabled = true;
          } else if (isNeedToSend && !isSent) {
            buttonText = 'Pending';
            buttonIcon = <FuseSvgIcon size={16}>lucide:clock</FuseSvgIcon>;
            color = 'warning';
            disabled = true;
          }

          return [
            <MenuItem
              key="feedback"
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  sendFeedback([row.original._id]);
                  closeMenu();
                  table.resetRowSelection();
                }
              }}
              sx={{ color: `${color}.main`, fontWeight: 600 }}
            >
              <ListItemIcon sx={{ color: `${color}.main` }}>{buttonIcon}</ListItemIcon>
              <Typography fontWeight={600} fontSize={13.5}>
                {buttonText}
              </Typography>
            </MenuItem>,
          ];
        }}
        renderTopToolbarCustomActions={() => null}
      />
    </Paper>
  );
}

export default OrdersTable;