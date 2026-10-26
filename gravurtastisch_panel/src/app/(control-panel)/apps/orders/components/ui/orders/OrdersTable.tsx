import { useMemo, useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { Order } from '../../../api/types';
import { useUpdateOrder } from '../../../api/hooks/orders/useUpdateOrder';
import { useOrders, useMarketplace, ordersQueryKey } from '../../../api/hooks/orders/useOrders';
import { OrdersFilters } from './OrdersHeader';
import { useSnackbar } from 'notistack';
import React from 'react';
import moment from 'moment';

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
  setSearchDate,
  searchText,
  setSearchText,
  selectedMarketplace,
  setSelectedMarketplace,
  canUpdateOrders = true,
}: {
  searchDate: Record<string, Date | null>;
  setSearchDate?: (date: Record<string, Date | null>) => void;
  searchText: string;
  setSearchText?: (text: string) => void;
  selectedMarketplace: string[];
  setSelectedMarketplace?: React.Dispatch<React.SetStateAction<string[]>>;
  canUpdateOrders?: boolean;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const autoScrollRef = useAutoScrollRef<HTMLDivElement>();
  const queryClient = useQueryClient();
  const { data: marketplaces } = useMarketplace();

  const handleReset = () => {
    if (setSearchDate) setSearchDate({ from: null, to: null });
    if (setSearchText) setSearchText('');
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize || 100 });
    setSorting([{ id: 'purchaseDate', desc: true }]);
    const defaultMarketplace = marketplaces?.find(
      (item: any) =>
        item.country_code?.toUpperCase() === 'DE' ||
        item.country?.toLowerCase() === 'germany' ||
        item.country?.toLowerCase() === 'deutschland'
    ) || marketplaces?.[0];
    if (setSelectedMarketplace && defaultMarketplace) {
      setSelectedMarketplace([defaultMarketplace.marketplace_id]);
    }
    queryClient.invalidateQueries({ queryKey: ordersQueryKey });
  };

  const actionButtons = setSearchDate && setSelectedMarketplace ? (
    <OrdersFilters
      searchDate={searchDate}
      setSearchDate={setSearchDate}
      selectedMarketplace={selectedMarketplace}
      setSelectedMarketplace={setSelectedMarketplace}
    />
  ) : null;
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



  // State for sorting
  const [sorting, setSorting] = useState<MRT_SortingState>([
    { id: 'purchaseDate', desc: true },
  ]);

  // Derive sortKey and sortOrder from sorting state
  const rawSortKey = sorting[0]?.id || 'purchaseDate';
  const sortKeyMapping: Record<string, string> = {
    purchaseDate: 'purchaseDate',
    orderInfo: 'amazonOrderId',
    amazonOrderId: 'amazonOrderId',
    buyerEmail: 'buyerEmail',
    delivery: 'earliestDeliveryDate',
    earliestDeliveryDate: 'earliestDeliveryDate',
    totalAmount: 'orderTotal.amount',
    city: 'shippingAddress.city',
    title: 'orderItems.title',
    ASIN: 'orderItems.ASIN',
    orderItemId: 'orderItems.orderItemId',
  };
  const sortKey = sortKeyMapping[rawSortKey] || rawSortKey;
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

  const planLimits = (ordersResponse as any)?.planLimits;
  const isPlanCanceled = Boolean(planLimits && (planLimits.isCanceled || planLimits.status === 3));
  const isPlanExpired = Boolean(planLimits && (planLimits.isExpired || planLimits.status === 2));
  const isQuotaExceeded = Boolean(
    planLimits &&
    (isPlanCanceled ||
      isPlanExpired ||
      planLimits.isLimitReached ||
      planLimits.remainingReviewRequests <= 0 ||
      planLimits.usedReviewRequests >= planLimits.maxReviewRequestsPerMonth)
  );

  const showQuotaMessage = () => {
    if (isPlanCanceled) {
      enqueueSnackbar(
        'Your subscription plan has been cancelled. Please subscribe to an active plan to send review requests.',
        { variant: 'error', autoHideDuration: 5000 }
      );
      return;
    }
    if (isPlanExpired) {
      enqueueSnackbar(
        'Your subscription plan has expired. Please renew your subscription plan to send review requests.',
        { variant: 'error', autoHideDuration: 5000 }
      );
      return;
    }
    enqueueSnackbar(
      `Plan limit reached! Your monthly quota is exhausted (${planLimits?.usedReviewRequests?.toLocaleString() ?? 0}/${planLimits?.maxReviewRequestsPerMonth?.toLocaleString() ?? 1000} used). Please upgrade your plan.`,
      { variant: 'error', autoHideDuration: 5000 }
    );
  };

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
    pageSize: paginationInfo?.size || 100,
  };

  const columns = useMemo<MRT_ColumnDef<FlattenedOrder>[]>(
    () => [
      {
        id: 'purchaseDate',
        header: 'Order Date',
        size: 160,
        Cell: ({ row }) => {
          if (!row.original || !row.original.purchaseDate) {
            return null;
          }
          if (!row.original.isFirstRow) {
            return null;
          }

          const m = moment(row.original.purchaseDate);
          if (!m.isValid()) return null;

          return (
            <Tooltip title={m.format('DD MMM YYYY, hh:mm:ss A')} arrow>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: (t) => (t.palette.mode === 'dark' ? '#94A3B8' : '#475569'),
                  whiteSpace: 'nowrap',
                }}
              >
                {m.format('DD-MM-YYYY hh:mm A')}
              </Typography>
            </Tooltip>
          );
        },
      },
      {
        id: 'orderInfo',
        header: 'Order',
        size: 175,
        accessorKey: 'amazonOrderId',
        Cell: ({ row }) => {
          if (!row.original || !row.original.amazonOrderId) {
            return null;
          }
          if (!row.original.isFirstRow) {
            return null;
          }

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={`Order ID: ${row.original.amazonOrderId}`} arrow>
                <Box
                  component="span"
                  sx={{
                    ...monoText,
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1,
                    py: 0.2,
                    borderRadius: '3px',
                    bgcolor: (t) =>
                      t.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#EBF1F7',
                    color: (t) =>
                      t.palette.mode === 'dark' ? '#E2E8F0' : '#0F2C59',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.25,
                  }}
                >
                  {row.original.amazonOrderId}
                </Box>
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
          );
        },
      },
      {
        id: 'buyerEmail',
        header: 'Buyer Email',
        size: 165,
        accessorKey: 'buyerEmail',
        enableSorting: true,
        Cell: ({ row }) => {
          if (!row.original || !row.original.buyerEmail) {
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
          }
          if (!row.original.isFirstRow) {
            return null;
          }

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={row.original.buyerEmail} arrow>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 160,
                    display: 'block',
                  }}
                >
                  {row.original.buyerEmail}
                </Typography>
              </Tooltip>
              <FuseSvgIcon
                size={12}
                sx={copyIconSx}
                onClick={() =>
                  navigator.clipboard.writeText(row.original.buyerEmail)
                }
              >
                heroicons-outline:clipboard-document
              </FuseSvgIcon>
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
          if (!row.original || !Array.isArray(row.original.orderItems)) {
            return null;
          }
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
                    py: 0.1,
                    borderRadius: '5px',
                    fontSize: 12,
                    fontWeight: 600,
                    height: 22,
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
                    py: 0.1,
                    borderRadius: '5px',
                    fontSize: 12,
                    fontWeight: 600,
                    height: 22,
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
                onClick={() => {
                  if (isQuotaExceeded) {
                    showQuotaMessage();
                    return;
                  }
                  sendFeedback([row.original._id]);
                }}
                startIcon={<FuseSvgIcon size={13}>lucide:send</FuseSvgIcon>}
                sx={{
                  borderRadius: '5px',
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: 'none',
                  px: 1.25,
                  py: 0.1,
                  minHeight: 22,
                  height: 22,
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
        header: 'ASIN',
        size: 110,
        enableSorting: true,
        Cell: ({ row }) => {
          const asin = row.original.orderItem?.ASIN;
          if (!asin)
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={`ASIN: ${asin}`} arrow>
                <Typography
                  sx={{
                    ...monoText,
                    fontSize: 12,
                    color: (t) => (t.palette.mode === 'dark' ? '#FB923C' : '#C2410C'),
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {asin}
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
                onClick={() => navigator.clipboard.writeText(asin)}
              >
                heroicons-outline:clipboard-document
              </FuseSvgIcon>
            </Box>
          );
        },
      },
      {
        id: 'orderItemId',
        header: 'Item ID',
        size: 135,
        enableSorting: true,
        Cell: ({ row }) => {
          const itemId = row.original.orderItem?.orderItemId;
          if (!itemId)
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={`Item ID: ${itemId}`} arrow>
                <Typography
                  sx={{
                    ...monoText,
                    fontSize: 12,
                    color: (t) => (t.palette.mode === 'dark' ? '#94A3B8' : '#64748B'),
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {itemId}
                </Typography>
              </Tooltip>
              <FuseSvgIcon
                size={12}
                sx={copyIconSx}
                onClick={() => navigator.clipboard.writeText(itemId)}
              >
                heroicons-outline:clipboard-document
              </FuseSvgIcon>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: 220 }}>
              <Tooltip title={orderItem.title} arrow>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'text.primary',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    maxWidth: (isGift || isTransparency) ? 145 : 215,
                  }}
                >
                  {orderItem.title}
                </Typography>
              </Tooltip>
              {(isGift || isTransparency) && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
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
                          '& .MuiChip-icon': { color: 'secondary.dark', ml: 0.4 },
                          '& .MuiChip-label': { px: 0.5 },
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
                          '& .MuiChip-icon': { color: 'info.dark', ml: 0.4 },
                          '& .MuiChip-label': { px: 0.5 },
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
        enableSorting: false,
        Cell: ({ row }) => {
          const orderItem = row.original.orderItem;
          if (!orderItem)
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={`Quantity: ${orderItem.quantityOrdered}`} arrow>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>
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
                      px: 0.85,
                      py: 0.05,
                      borderRadius: '999px',
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: 1.1,
                      height: 19,
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
        enableSorting: false,
        Cell: ({ row }) => {
          const fulfillment = row.original?.fulfillmentChannel;
          const sales = row.original?.salesChannel;
          if (!fulfillment && !sales) {
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
          }
          const isAFN = fulfillment === 'AFN' || fulfillment === 'FBA';

          return (
            <Tooltip title={`Fulfillment: ${fulfillment || '—'} · Channel: ${sales || '—'}`} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 0.75,
                    py: 0.05,
                    height: 19,
                    borderRadius: '4px',
                    fontSize: 11,
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
                    lineHeight: 1,
                  }}
                >
                  {fulfillment || '—'}
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
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
        size: 165,
        accessorKey: 'earliestDeliveryDate',
        Cell: ({ row }) => {
          const edd = row.original?.earliestDeliveryDate;
          if (!edd) {
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
          }
          const m = moment(edd);
          if (!m.isValid()) {
            return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>;
          }
          const daysDiff =
            row.original?.daysDifference ??
            row.original?.deliveryDays ??
            row.original?.daysToDelivery ??
            null;

          return (
            <Tooltip title={`Delivery Date: ${m.format('DD MMM YYYY, hh:mm:ss A')}${daysDiff !== null ? ` (${daysDiff} days left)` : ''}`} arrow>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: (t) => (t.palette.mode === 'dark' ? '#94A3B8' : '#475569'),
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.format('DD-MM-YYYY hh:mm A')}
                </Typography>
                {daysDiff !== null && (
                  (() => {
                    const { color, bg } = urgencyToken(daysDiff as number);
                    return (
                      <Chip
                        label={`${daysDiff}d left`}
                        size="small"
                        sx={{ ...chipBase, height: 18, fontSize: 10.5, color, bgcolor: bg, flexShrink: 0, '& .MuiChip-label': { px: 0.6 } }}
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
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.3 }}>
                <Typography
                  sx={{
                    ...monoText,
                    fontSize: 12,
                    fontWeight: 700,
                    color: (t) => t.palette.mode === 'dark' ? '#FBBF24' : '#B45309',
                    letterSpacing: -0.2,
                  }}
                >
                  {numericAmount.toFixed(2)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
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
        size: 130,
        accessorFn: (row) => row.shippingAddress?.city ?? '',
        Cell: ({ row }) => {
          const addr = row.original.shippingAddress;
          const locationParts = [addr?.city, addr?.postalCode, addr?.countryCode].filter(Boolean);
          const locationText = locationParts.length > 0 ? locationParts.join(', ') : 'N/A';

          return (
            <Tooltip title={locationText} arrow>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  maxWidth: 140,
                }}
              >
                {locationText}
              </Typography>
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
        title="Orders"
        icon="heroicons-outline:shopping-bag"
        actionButtons={actionButtons}
        onRefresh={handleReset}
        enableRowActions={false}
        enableRowSelection={false}
        data={flattenedOrders}
        columns={columns}
        enableGlobalFilter={true}
        onGlobalFilterChange={setSearchText}
        tableId="Orders_v4"
        state={{
          globalFilter: searchText,
          isLoading,
          showSkeletons: isLoading,
          pagination,
          sorting,
          columnOrder: [
            'purchaseDate',
            'orderInfo',
            'buyerEmail',
            'actions',
            'ASIN',
            'orderItemId',
            'title',
            'qtyCondition',
            'channelInfo',
            'delivery',
            'totalAmount',
            'city',
          ],
        }}
        onPaginationChange={(updater) => {
          setPagination((prev) => {
            const newPagination =
              typeof updater === 'function' ? updater(prev) : updater;
            return newPagination;
          });
        }}
        onSortingChange={setSorting}
        manualPagination={true}
        manualSorting={true}
        manualFiltering={true}
        pageCount={mappedPaginationInfo.totalPages}
        rowCount={mappedPaginationInfo.totalItems}
        enablePagination={true}
        enableColumnFilters={false}
        enableSorting={true}
        initialState={{
          pagination: { pageIndex: 0, pageSize: pagination.pageSize || 100 },
          sorting: [],
          columnOrder: [
            'purchaseDate',
            'orderInfo',
            'buyerEmail',
            'actions',
            'ASIN',
            'orderItemId',
            'title',
            'qtyCondition',
            'channelInfo',
            'delivery',
            'totalAmount',
            'city',
          ],
        }}
        muiTableBodyRowProps={{
          sx: {
            minHeight: '36px',
            height: '36px',
          },
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'auto',
            minWidth: { xs: '1200px', lg: '100%' },
            '& .MuiTableRow-root:hover': {
              backgroundColor: (t: any) => (t.palette?.mode === 'dark' ? '#1f2937 !important' : '#f3f4f6 !important'),
              transition: 'background-color 0.15s ease',
            },
            '& .MuiTableRow-root:hover td': {
              backgroundColor: (t: any) => (t.palette?.mode === 'dark' ? '#1f2937 !important' : '#f3f4f6 !important'),
            },
            '& .MuiTableRow-root:hover td:after': {
              backgroundColor: 'transparent !important',
            },
            '& .MuiTableCell-root': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              padding: '4px 8px',
              height: '36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              fontSize: 11.5,
              lineHeight: 1.15,
            },
            '& .MuiTableHead-root, & .MuiTableHead-root .MuiTableCell-root': {
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 0.3,
              textTransform: 'uppercase',
              color: (t: any) => (t.palette?.mode === 'dark' ? '#e2e8f0' : '#1f2937'),
              backgroundColor: (t: any) => (t.palette?.mode === 'dark' ? '#1e293b' : '#e5e7eb'),
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: (t: any) => (t.palette?.mode === 'dark' ? '#334155' : '#d1d5db'),
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'clip',
              padding: '5px 8px',
              height: '36px',
              maxWidth: '100%',
              textAlign: 'left',
              '& .MuiTableSortLabel-root': {
                overflow: 'visible',
                textOverflow: 'clip',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              },
              '& .MuiTableCell-root[data-pinned="true"]:before, & th[data-pinned="true"]:before, & th:before': {
                backgroundColor: (t: any) => (t.palette?.mode === 'dark' ? '#1e293b !important' : '#e5e7eb !important'),
              },
            },
          },
        }}
        muiTableHeadProps={{
          className: 'bg-gray-200 dark:bg-slate-800 border-t border-b border-gray-300 dark:border-slate-700',
        }}
        muiTableHeadRowProps={{
          className: 'bg-gray-200 dark:bg-slate-800 border-t border-b border-gray-300 dark:border-slate-700',
        }}
        muiTableHeadCellProps={{
          className: 'bg-gray-200 dark:bg-slate-800 border-t border-b border-gray-300 dark:border-slate-700',
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
            backgroundColor: (theme: any) =>
              theme.palette?.mode === 'dark' ? '#0f172a' : '#ffffff',
            WebkitOverflowScrolling: 'touch',
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
            'flex flex-row items-center justify-end min-h-[46px] h-[46px] py-0 px-2 sm:px-4 bg-gray-200 dark:bg-slate-800 border-t border-gray-300 dark:border-slate-700 overflow-x-auto',
          sx: {
            backgroundColor: (theme: any) =>
              theme.palette?.mode === 'dark' ? '#1e293b' : '#e5e7eb',
            borderTop: '1px solid',
            borderColor: (theme: any) =>
              theme.palette?.mode === 'dark' ? '#334155' : '#d1d5db',
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
                if (isQuotaExceeded) {
                  showQuotaMessage();
                  return;
                }
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