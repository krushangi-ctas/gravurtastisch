import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Checkbox,
  FormControl,
  Select,
} from '@mui/material';
import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { useMarketplace, ordersQueryKey } from '../../../api/hooks/orders/useOrders';
import { useQueryClient } from '@tanstack/react-query';
import FlagIcon from 'src/components/ui/FlagIcon';
import {
  format,
  isValid,
  isAfter,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
} from 'date-fns';

// Custom Date Range Picker Component
interface DateRangePickerProps {
  value: Record<string, Date | null>;
  onChange: (range: Record<string, Date | null>) => void;
  onClose: () => void;
}

function CustomDateRangePicker({
  value,
  onChange,
  onClose,
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [tempRange, setTempRange] =
    useState<Record<string, Date | null>>(value);

  useEffect(() => {
    setTempRange(value);
    if (value.from) {
      setCurrentMonth(value.from);
    }
  }, [value]);

  const handleDateClick = (date: Date) => {
    if (!tempRange.from || (tempRange.from && tempRange.to)) {
      // Start new range
      setTempRange({ from: date, to: null });
    } else {
      // Complete the range
      if (isAfter(date, tempRange.from)) {
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

    // Add padding days to fill the grid
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

  const isRangeStart = (date: Date) =>
    tempRange.from && isSameDay(date, tempRange.from);
  const isRangeEnd = (date: Date) =>
    tempRange.to && isSameDay(date, tempRange.to);
  const isInHoverRange = (date: Date) => {
    if (!tempRange.from || tempRange.to) return false;
    return (
      hoveredDate &&
      isWithinInterval(date, { start: tempRange.from, end: hoveredDate })
    );
  };

  const days = getDaysInMonth();

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, minWidth: { xs: 280, sm: 320 }, maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <IconButton
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          size="small"
        >
          <FuseSvgIcon>lucide:chevron-left</FuseSvgIcon>
        </IconButton>

        <Typography variant="h6">
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>

        <IconButton
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          size="small"
        >
          <FuseSvgIcon>lucide:chevron-right</FuseSvgIcon>
        </IconButton>
      </Box>

      {/* Day Headers */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Box
            key={day}
            sx={{
              textAlign: 'center',
              py: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: 'text.secondary',
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
          const isHoverRange = isInHoverRange(date);

          return (
            <Box
              key={index}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              sx={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: isStart || isEnd ? 'bold' : 'normal',
                color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                backgroundColor:
                  isStart || isEnd
                    ? 'rgba(25, 118, 210, 0.15)'
                    : isHoverRange
                      ? 'rgba(25, 118, 210, 0.08)'
                      : isSelected
                        ? 'rgba(25, 118, 210, 0.05)'
                        : 'transparent',
                borderRadius: isStart
                  ? '50% 0 0 50%'
                  : isEnd
                    ? '0 50% 50% 0'
                    : '0',
                '&:hover': {
                  backgroundColor:
                    isStart || isEnd ? 'primary.100' : 'action.hover',
                },
                border: isStart || isEnd ? '1px solid' : 'none',
                borderColor: 'primary.main',
              }}
            >
              {format(date, 'd')}
            </Box>
          );
        })}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={!tempRange.from || !tempRange.to}
        >
          Apply
        </Button>
      </Box>
    </Paper>
  );
}

/**
 * The orders header.
 */
function OrdersHeader({
  searchDate,
  setSearchDate,
  searchText,
  setSearchText,
  selectedMarketplace,
  setSelectedMarketplace,
}: {
  searchDate: Record<string, Date | null>;
  setSearchDate: (date: Record<string, Date | null>) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  selectedMarketplace: string[];
  setSelectedMarketplace: Dispatch<SetStateAction<string[]>>;
}) {
  const queryClient = useQueryClient();
  const { data: marketplaces } = useMarketplace();
  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const allMarketplaceIds =
    marketplaces?.map((item: any) => item.marketplace_id) || [];

  const handleChange = (event: { target: { value: string | string[] } }) => {
    const value = event.target.value;
    const newValue = typeof value === 'string' ? value.split(',') : value;

    // If "ALL" is included in the new selection
    if (newValue.includes('')) {
      // If all marketplaces are already selected, deselect all
      if (selectedMarketplace.length === allMarketplaceIds.length) {
        setSelectedMarketplace([]);
      } else {
        // Select all marketplaces
        setSelectedMarketplace(allMarketplaceIds);
      }
    } else {
      // Normal selection, update with new values (excluding "")
      setSelectedMarketplace(newValue.filter((id) => id !== ''));
    }
  };

  const handleInlineDateRangeChange = (range: Record<string, Date | null>) => {
    setSearchDate(range);
    setDateAnchorEl(null);
  };



  const formatDateRange = () => {
    if (!searchDate.from && !searchDate.to) return 'Select date range';
    if (searchDate.from && searchDate.to) {
      return `${format(searchDate.from, 'MMM dd')} - ${format(searchDate.to, 'MMM dd, yyyy')}`;
    }
    if (searchDate.from)
      return `From ${format(searchDate.from, 'MMM dd, yyyy')}`;
    if (searchDate.to) return `Until ${format(searchDate.to, 'MMM dd, yyyy')}`;
    return 'Select date range';
  };

  const hasValidDateRange =
    searchDate.from &&
    searchDate.to &&
    isValid(searchDate.from) &&
    isValid(searchDate.to);


  const resetbtn = () => {
    setSearchDate({
      from: null,
      to: null,
    });
    setSearchText('');
    setDateAnchorEl(null);
    const defaultMarketplace = marketplaces?.find(
      (item: any) =>
        item.country_code?.toUpperCase() === 'IN' ||
        item.country?.toLowerCase() === 'india'
    ) || marketplaces?.[0];
    if (defaultMarketplace) {
      setSelectedMarketplace([defaultMarketplace.marketplace_id]);
    }
    queryClient.invalidateQueries({ queryKey: ordersQueryKey });
  };

  const getMarketplaceLabel = (id: string) => {
    const marketplace = marketplaces?.find(
      (item: any) => item.marketplace_id === id || item._id === id || item.id === id
    );
    if (marketplace) {
      const country = marketplace.country || marketplace.country_code;
      const code = marketplace.country_code ? ` (${marketplace.country_code})` : '';
      return `${country}${code}`;
    }
    return id;
  };

  const getMarketplaceCountryName = (id: string) => {
    const marketplace = marketplaces?.find(
      (item: any) =>
        item.marketplace_id === id || item._id === id || item.id === id
    );
    return marketplace?.country || marketplace?.country_code || id;
  };

  // Generate tooltip text and chip label
  const getMarketplaceTooltipAndLabel = () => {
    const selectedNames = selectedMarketplace
      .map((id) => getMarketplaceCountryName(id))
      .filter(Boolean)
      .join(', ');

    let chipLabel = '';
    if (selectedMarketplace.length === 0) {
      chipLabel = '';
    } else if (
      selectedMarketplace.length === allMarketplaceIds.length &&
      allMarketplaceIds.length > 0
    ) {
      chipLabel = 'ALL';
    } else if (selectedMarketplace.length === 1) {
      chipLabel = getMarketplaceLabel(selectedMarketplace[0]);
    } else {
      const firstTwo = selectedMarketplace
        .slice(0, 2)
        .map((id) => getMarketplaceLabel(id))
        .join(', ');
      const remainingCount = selectedMarketplace.length - 2;
      chipLabel =
        remainingCount > 0 ? `${firstTwo} +${remainingCount}` : firstTwo;
    }

    return { tooltip: selectedNames, chipLabel };
  };

  const { tooltip, chipLabel } = getMarketplaceTooltipAndLabel();

  const handleDeleteClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDeleteMarketplace = (marketplaceId: string) => {
    setSelectedMarketplace((prev) => prev.filter((id) => id !== marketplaceId));
    setAnchorEl(null);
  };

  const handleClearAll = () => {
    setSelectedMarketplace([]);
    setAnchorEl(null);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 sm:px-6 py-2 sm:py-2.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Left Title & Icon */}
      <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
          <FuseSvgIcon size={20} className="text-primary">
            heroicons-outline:shopping-bag
          </FuseSvgIcon>
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight">
            Orders
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 m-0 font-medium leading-tight mt-1">
            Manage and track customer orders, shipments, and fulfillment status.
          </p>
        </div>
      </div>

      {/* Right Controls: Filters, Date, Marketplace, Search, Reload */}
      <div className="flex items-center gap-2 w-full lg:w-auto justify-start lg:justify-end flex-wrap sm:flex-nowrap">
        {/* Marketplace Chip Display if selected */}
        {selectedMarketplace.length > 0 && (
          <Tooltip title={tooltip || 'Selected Marketplaces'} arrow>
            <Box className="flex items-center">
              <Chip
                label={chipLabel}
                onDelete={
                  selectedMarketplace.length > 0
                    ? handleDeleteClick
                    : undefined
                }
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#ffffff',
                  borderRadius: 20,
                  px: 1,
                  py: 1,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 600,
                }}
                deleteIcon={
                  <FuseSvgIcon size={14} sx={{ color: '#ffffff !important' }}>
                    heroicons-outline:x-mark
                  </FuseSvgIcon>
                }
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                }}
              >
                {selectedMarketplace.map((marketplaceId) => {
                  const marketplace = marketplaces?.find(
                    (item: any) => item.marketplace_id === marketplaceId
                  );
                  return (
                    <MenuItem
                      key={marketplaceId}
                      onClick={() => handleDeleteMarketplace(marketplaceId)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1,
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                        {marketplace
                          ? `${marketplace.country} (${marketplace.country_code})`
                          : marketplaceId}
                      </Typography>
                      <FuseSvgIcon size={14} sx={{ color: '#e65100' }}>
                        heroicons-outline:x-mark
                      </FuseSvgIcon>
                    </MenuItem>
                  );
                })}
                <MenuItem
                  onClick={handleClearAll}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                    Clear All
                  </Typography>
                  <FuseSvgIcon size={14} sx={{ color: '#e65100' }}>
                    heroicons-outline:trash
                  </FuseSvgIcon>
                </MenuItem>
              </Menu>
            </Box>
          </Tooltip>
        )}

        {/* Date Range Picker Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => setDateAnchorEl(dateAnchorEl ? null : e.currentTarget)}
            style={{ height: '32px', minHeight: '32px', maxHeight: '32px' }}
            className="h-8 flex items-center justify-between gap-2 px-3 bg-white text-slate-800 text-xs font-medium rounded-lg border border-slate-200 outline-none hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              <FuseSvgIcon size={15} className="text-slate-500">
                heroicons-outline:calendar
              </FuseSvgIcon>
              <span className="text-slate-700">{formatDateRange()}</span>
            </div>
            <FuseSvgIcon size={14} className="text-slate-400">
              heroicons-outline:calendar-days
            </FuseSvgIcon>
          </button>

          {/* Date Range Popover */}
          <Popover
            open={Boolean(dateAnchorEl)}
            anchorEl={dateAnchorEl}
            onClose={() => setDateAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }
              }
            }}
          >
            <CustomDateRangePicker
              value={searchDate}
              onChange={handleInlineDateRangeChange}
              onClose={() => setDateAnchorEl(null)}
            />
          </Popover>
        </div>

        {/* Marketplace Selector Dropdown */}
        <FormControl
          size="small"
          className="min-w-[130px] bg-white rounded-lg border border-slate-200 shadow-xs table-toolbar-control shrink-0"
          sx={{
            height: '32px !important',
            minHeight: '32px !important',
            maxHeight: '32px !important',
            justifyContent: 'center',
            '& .MuiInputBase-root': {
              height: '32px !important',
              minHeight: '32px !important',
              maxHeight: '32px !important',
              borderRadius: '8px !important',
              backgroundColor: 'transparent !important',
              fontSize: '12px !important',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none !important',
            },
            '& .MuiSelect-select': {
              py: '0 !important',
              height: '32px !important',
              minHeight: '32px !important',
              maxHeight: '32px !important',
              lineHeight: '32px !important',
              display: 'flex !important',
              alignItems: 'center !important',
              fontSize: '12px !important',
              boxSizing: 'border-box !important',
            },
          }}
        >
          <Select
            value={selectedMarketplace}
            onChange={handleChange}
            displayEmpty
            className="text-xs bg-white font-medium text-slate-700 border-0"
            sx={{
              height: '32px !important',
              borderRadius: '8px !important',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none !important'
              },
              '& .MuiSelect-select': {
                py: '0 !important',
                height: '32px !important',
                display: 'flex !important',
                alignItems: 'center !important',
                fontSize: '12px !important'
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 380,
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                }
              }
            }}
            multiple
            renderValue={(selected) => {
              if (selected.length === 0) {
                return (
                  <span className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                    <FuseSvgIcon size={15} className="text-slate-500">
                      heroicons-outline:building-storefront
                    </FuseSvgIcon>
                    All Shops
                  </span>
                );
              }
              return (
                <span className="flex items-center gap-1.5 text-slate-800 text-xs font-semibold">
                  <FuseSvgIcon size={15} className="text-slate-600">
                    heroicons-outline:building-storefront
                  </FuseSvgIcon>
                  {Array.isArray(selected)
                    ? selected.length > 2
                      ? `${selected.length} Shops`
                      : selected
                        .map((id) => getMarketplaceCountryName(id))
                        .join(', ')
                    : 'All Shops'}
                </span>
              );
            }}
          >
            <MenuItem
              value=""
              sx={{
                py: 1.25,
                px: 2,
                minHeight: 42,
                '&:hover': {
                  bgcolor: (t) =>
                    t.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Checkbox
                checked={
                  selectedMarketplace.length === allMarketplaceIds.length &&
                  allMarketplaceIds.length > 0
                }
                size="medium"
                sx={{
                  p: 0.75,
                  mr: 1,
                  color: '#94a3b8',
                  '& .MuiSvgIcon-root': { fontSize: 20 },
                  '&.Mui-checked': { color: 'var(--color-primary-700)' },
                }}
              />
              <em className="text-sm font-semibold not-italic text-slate-800 dark:text-slate-100">
                ALL SHOPS
              </em>
            </MenuItem>
            {marketplaces?.map((item: any) => (
              <MenuItem
                key={item?.marketplace_id}
                value={item?.marketplace_id}
                sx={{
                  py: 1.25,
                  px: 2,
                  minHeight: 42,
                  '&:hover': {
                    bgcolor: (t) =>
                      t.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Checkbox
                  checked={selectedMarketplace.includes(
                    item.marketplace_id
                  )}
                  size="medium"
                  sx={{
                    p: 0.75,
                    mr: 1,
                    color: '#94a3b8',
                    '& .MuiSvgIcon-root': { fontSize: 20 },
                    '&.Mui-checked': { color: 'var(--color-primary-700)' },
                  }}
                />
                <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <FlagIcon
                    code={item?.country_code}
                    country={item?.country}
                    className="w-5 h-3.5 rounded-xs shrink-0 shadow-2xs"
                  />
                  <span>
                    {item?.country} ({item?.country_code})
                  </span>
                </span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Search Input */}
        <div className="relative flex items-center min-w-[170px] sm:min-w-[190px] flex-1 sm:flex-initial">
          <div className="absolute left-2.5 flex items-center pointer-events-none text-slate-400">
            <FuseSvgIcon size={15}>heroicons-outline:magnifying-glass</FuseSvgIcon>
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search orders..."
            style={{ height: '38px' }}
            className="w-full pl-8 pr-3 h-[38px] text-xs bg-white text-slate-900 placeholder-slate-400 rounded-lg border-0 shadow-xs outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Reset / Reload Button */}
        <Tooltip title="Reset & Refresh" arrow>
          <button
            type="button"
            onClick={resetbtn}
            style={{ height: '38px', width: '38px' }}
            className="h-[38px] w-[38px] flex items-center justify-center rounded-lg bg-white text-slate-800 hover:bg-slate-100 transition-all shadow-xs cursor-pointer border-0 shrink-0"
          >
            <FuseSvgIcon size={17} className="text-slate-800">
              heroicons-outline:arrow-path
            </FuseSvgIcon>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function OrdersFilters({
  searchDate,
  setSearchDate,
  selectedMarketplace,
  setSelectedMarketplace,
}: {
  searchDate: Record<string, Date | null>;
  setSearchDate: (date: Record<string, Date | null>) => void;
  selectedMarketplace: string[];
  setSelectedMarketplace: Dispatch<SetStateAction<string[]>>;
}) {
  const { data: marketplaces } = useMarketplace();
  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);

  const allMarketplaceIds =
    marketplaces?.map((item: any) => item.marketplace_id) || [];

  const handleChange = (event: { target: { value: string | string[] } }) => {
    const value = event.target.value;
    const newValue = typeof value === 'string' ? value.split(',') : value;

    if (newValue.includes('')) {
      if (selectedMarketplace.length === allMarketplaceIds.length) {
        setSelectedMarketplace([]);
      } else {
        setSelectedMarketplace(allMarketplaceIds);
      }
    } else {
      setSelectedMarketplace(newValue.filter((id) => id !== ''));
    }
  };

  const handleInlineDateRangeChange = (range: Record<string, Date | null>) => {
    setSearchDate(range);
    setDateAnchorEl(null);
  };

  const formatDateRange = () => {
    if (!searchDate.from && !searchDate.to) return 'Date Range';
    if (searchDate.from && searchDate.to) {
      return `${format(searchDate.from, 'MMM dd')} - ${format(searchDate.to, 'MMM dd')}`;
    }
    if (searchDate.from)
      return `From ${format(searchDate.from, 'MMM dd')}`;
    if (searchDate.to) return `Until ${format(searchDate.to, 'MMM dd')}`;
    return 'Date Range';
  };

  const getMarketplaceCountryName = (id: string) => {
    const marketplace = marketplaces?.find(
      (item: any) =>
        item.marketplace_id === id || item._id === id || item.id === id
    );
    return marketplace?.country || marketplace?.country_code || id;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
      {/* Marketplace Selector Dropdown */}
      <FormControl
        size="small"
        className="min-w-[125px] sm:min-w-[140px] flex-1 sm:flex-initial bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 table-toolbar-control shrink-0"
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
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none !important',
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
            boxSizing: 'border-box !important',
          },
        }}
      >
        <Select
          value={selectedMarketplace}
          onChange={handleChange}
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
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 400,
                minWidth: 230,
                borderRadius: '12px',
                boxShadow:
                  '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                py: 0.5,
              },
            },
          }}
          multiple
          renderValue={(selected) => {
            if (selected.length === 0) {
              return (
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                  <FuseSvgIcon size={15} className="text-slate-500">heroicons-outline:building-storefront</FuseSvgIcon>
                  All Shops
                </span>
              );
            }
            return (
              <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 text-xs font-semibold">
                <FuseSvgIcon size={15} className="text-slate-600">heroicons-outline:building-storefront</FuseSvgIcon>
                {Array.isArray(selected)
                  ? selected.length > 2
                    ? `${selected.length} Shops`
                    : selected.map((id) => getMarketplaceCountryName(id)).join(', ')
                  : 'All Shops'}
              </span>
            );
          }}
        >
          <MenuItem
            value=""
            sx={{
              py: 1.25,
              px: 2,
              minHeight: 42,
              '&:hover': {
                bgcolor: (t) =>
                  t.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Checkbox
              checked={
                selectedMarketplace.length === allMarketplaceIds.length &&
                allMarketplaceIds.length > 0
              }
              size="medium"
              sx={{
                p: 0.75,
                mr: 1,
                color: '#94a3b8',
                '& .MuiSvgIcon-root': { fontSize: 20 },
                '&.Mui-checked': { color: 'var(--color-primary-700)' },
              }}
            />
            <em className="text-sm font-semibold not-italic text-slate-800 dark:text-slate-100">
              ALL SHOPS
            </em>
          </MenuItem>
          {marketplaces?.map((item: any) => (
            <MenuItem
              key={item?.marketplace_id}
              value={item?.marketplace_id}
              sx={{
                py: 1.25,
                px: 2,
                minHeight: 42,
                '&:hover': {
                  bgcolor: (t) =>
                    t.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Checkbox
                checked={selectedMarketplace.includes(item.marketplace_id)}
                size="medium"
                sx={{
                  p: 0.75,
                  mr: 1,
                  color: '#94a3b8',
                  '& .MuiSvgIcon-root': { fontSize: 20 },
                  '&.Mui-checked': { color: 'var(--color-primary-700)' },
                }}
              />
              <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                <FlagIcon
                  code={item?.country_code}
                  country={item?.country}
                  className="w-5 h-3.5 rounded-xs shrink-0 shadow-2xs"
                />
                <span>{item?.country} ({item?.country_code})</span>
              </span>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Date Range Picker Trigger */}
      <button
        type="button"
        onClick={(e) => setDateAnchorEl(dateAnchorEl ? null : e.currentTarget)}
        style={{ height: '38px', minHeight: '38px', maxHeight: '38px' }}
        className="h-[38px] flex-1 sm:flex-initial flex items-center justify-between gap-2 px-2.5 sm:px-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[12px] sm:text-[13px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs shrink-0 box-border whitespace-nowrap"
      >
        <FuseSvgIcon size={16} className="text-slate-500">heroicons-outline:calendar</FuseSvgIcon>
        <span>{formatDateRange()}</span>
      </button>

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
              overflow: 'hidden',
              maxWidth: 'calc(100vw - 24px)',
            }
          }
        }}
      >
        <CustomDateRangePicker
          value={searchDate}
          onChange={handleInlineDateRangeChange}
          onClose={() => setDateAnchorEl(null)}
        />
      </Popover>
    </div>
  );
}

export default OrdersHeader;


