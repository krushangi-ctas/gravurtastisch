import {
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Checkbox,
  Typography,
  Chip,
} from '@mui/material';
import CustomStatusSwitch from '@/components/CustomSwitch';
import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { GeneralSettingFormType } from './GeneralSetAppView';

function GeneralSetting({
  generalSettingMutation,
  generalSetting,
}: {
  generalSettingMutation: any;
  generalSetting: any;
}) {
  const { enqueueSnackbar } = useSnackbar();

  const { control, formState, handleSubmit, setValue, watch } =
    useFormContext<GeneralSettingFormType>();
  const { isValid, dirtyFields } = formState;

  const autoSendRequestValue = watch('autoSendRequest');
  const selectedDay = watch('day');

  const onSubmit = async (data: GeneralSettingFormType) => {
    try {
      const response = await generalSettingMutation.mutateAsync({
        data: data,
      });
      enqueueSnackbar(
        response?.message || 'General setting updated successfully!',
        {
          variant: 'success',
          autoHideDuration: 2000,
        }
      );
    } catch (error: any) {
      console.error('Error in form submission:', error);
      enqueueSnackbar(
        error?.message || 'Failed to update general setting. Please try again.',
        {
          variant: 'error',
          autoHideDuration: 2000,
        }
      );
    }
  };

  useEffect(() => {
    if (generalSetting) {
      setValue(
        'marketplace_id',
        generalSetting?.marketplace_id || 'A21TJRUUN4KGV'
      );
      setValue('order_status', generalSetting?.order_status || 'shipped');
      setValue('fba', Boolean(generalSetting?.fba));
      setValue('fbm', Boolean(generalSetting?.fbm));
      setValue(
        'order_matching_rules',
        generalSetting?.order_matching_rules || 'all products'
      );
      setValue('autoSendRequest', Boolean(generalSetting?.autoSendRequest));
      setValue('hour', typeof generalSetting?.hour === 'number' ? generalSetting.hour : 0);
      setValue('minute', typeof generalSetting?.minute === 'number' ? generalSetting.minute : 0);
      setValue('second', typeof generalSetting?.second === 'number' ? generalSetting.second : 0);
      setValue('day', typeof generalSetting?.day === 'number' ? generalSetting.day : 0);
    }
  }, [generalSetting, setValue]);

  // Days array 0–31
  const days = Array.from({ length: 32 }, (_, i) => i);

  // Hours 0–23
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Minutes/Seconds 0–59
  const minsSecs = Array.from({ length: 60 }, (_, i) => i);

  const isPending = generalSettingMutation.isPending;

  return (
    <div className="w-full">
      <Paper
        elevation={0}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Header Section */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-primary-600/10 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <FuseSvgIcon size={22}>lucide:sliders-horizontal</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">
                    Review Automation Settings
                  </Typography>
                  <Typography className="text-[13px] leading-[20px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure automated review request rules, channels, and delivery triggers.
                  </Typography>
                </div>
              </div>
              <div className="self-start sm:self-auto">
                <Chip
                  label={autoSendRequestValue ? 'Automation Active' : 'Automation Paused'}
                  size="small"
                  className={`font-semibold border text-xs px-3 py-1 ${autoSendRequestValue
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 space-y-8 divide-y divide-slate-100 dark:divide-slate-800">
            {/* Section 1: Target Orders & Fulfillment Channel */}
            <div className="pt-0 space-y-4">
              <div>
                <Typography className="text-[16px] font-semibold text-slate-900 dark:text-white">
                  Target Orders & Fulfillment Channel
                </Typography>
                <Typography className="text-[13px] leading-[20px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Select which orders and fulfillment methods qualify for feedback requests.
                </Typography>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Target Order Status */}
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                    Order Status
                  </label>
                  <Controller
                    name="order_status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <Select
                          {...field}
                          className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl h-11 text-sm font-medium text-slate-800 dark:text-slate-100"
                          sx={{
                            '& .MuiSelect-select': {
                              fontSize: '14px !important',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                            },
                          }}
                        >
                          <MenuItem value="shipped">
                            <span className="flex items-center gap-2.5 text-[14px] font-medium text-slate-800 dark:text-slate-100">
                              <FuseSvgIcon size={18} className="text-primary-600 dark:text-primary-400">
                                lucide:package-check
                              </FuseSvgIcon>
                              Shipped Orders Only
                            </span>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                  <p className="text-[13px] leading-[20px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Emails are sent only after Amazon marks the order as shipped.
                  </p>
                </div>

                {/* Fulfillment Channels */}
                <div className="md:col-span-2 flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                    Fulfillment Channel
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Controller
                      name="fba"
                      control={control}
                      render={({ field }) => (
                        <div
                          onClick={() => field.onChange(!field.value)}
                          className={`h-11 px-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${field.value
                              ? 'bg-primary-50/80 dark:bg-primary-950/50 border-primary-400 dark:border-primary-600 text-primary-950 dark:text-primary-100 ring-2 ring-primary-500/20'
                              : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={Boolean(field.value)}
                              color="primary"
                              sx={{
                                p: 0,
                                '& .MuiSvgIcon-root': { fontSize: 22 },
                              }}
                            />
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[14px] font-bold text-slate-900 dark:text-white">FBA</span>
                              <span className="text-[13px] text-slate-500 dark:text-slate-400">
                                (Amazon)
                              </span>
                            </div>
                          </div>
                          <FuseSvgIcon size={18} className={field.value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}>
                            lucide:truck
                          </FuseSvgIcon>
                        </div>
                      )}
                    />

                    <Controller
                      name="fbm"
                      control={control}
                      render={({ field }) => (
                        <div
                          onClick={() => field.onChange(!field.value)}
                          className={`h-11 px-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${field.value
                              ? 'bg-primary-50/80 dark:bg-primary-950/50 border-primary-400 dark:border-primary-600 text-primary-950 dark:text-primary-100 ring-2 ring-primary-500/20'
                              : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={Boolean(field.value)}
                              color="primary"
                              sx={{
                                p: 0,
                                '& .MuiSvgIcon-root': { fontSize: 22 },
                              }}
                            />
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[14px] font-bold text-slate-900 dark:text-white">FBM</span>
                              <span className="text-[13px] text-slate-500 dark:text-slate-400">
                                (Merchant)
                              </span>
                            </div>
                          </div>
                          <FuseSvgIcon size={18} className={field.value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}>
                            lucide:store
                          </FuseSvgIcon>
                        </div>
                      )}
                    />
                  </div>
                  <p className="text-[13px] leading-[20px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Enable FBA and/or FBM to target specific fulfillment orders.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Automation Schedule */}
            <div className="pt-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <Typography className="text-[16px] font-semibold text-slate-900 dark:text-white">
                    Automatic Dispatch Schedule
                  </Typography>
                  <Typography className="text-[13px] leading-[20px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Specify the delivery delay in days and the preferred dispatch time.
                  </Typography>
                </div>
                <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5">
                  <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                    Auto-Send
                  </span>
                  <Controller
                    name="autoSendRequest"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <CustomStatusSwitch
                        size="small"
                        onChange={(e) => onChange(e.target.checked)}
                        checked={Boolean(value)}
                        name="autoSendRequest"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                  {/* Day Picker */}
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Delay (Days)
                    </label>
                    <Controller
                      name="day"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <Select
                            {...field}
                            value={field.value || ''}
                            onChange={(event) => {
                              if (event.target.value !== field.value) {
                                field.onChange(event.target.value);
                              }
                            }}
                            className="bg-white dark:bg-slate-900 rounded-xl h-11 text-sm font-medium text-slate-800 dark:text-slate-100"
                            sx={{
                              '& .MuiSelect-select': {
                                fontSize: '14px !important',
                                fontWeight: 500,
                              },
                            }}
                          >
                            {days.map((d) => (
                              <MenuItem key={d} value={d}>
                                <span className="text-[14px] font-medium">{d} {d === 1 ? 'Day' : 'Days'}</span>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </div>

                  {/* Hour */}
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Hour
                    </label>
                    <Controller
                      name="hour"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <Select
                            {...field}
                            className="bg-white dark:bg-slate-900 rounded-xl h-11 text-sm font-medium text-slate-800 dark:text-slate-100"
                            sx={{
                              '& .MuiSelect-select': {
                                fontSize: '14px !important',
                                fontWeight: 500,
                              },
                            }}
                          >
                            {hours.map((h) => (
                              <MenuItem key={h} value={h}>
                                <span className="text-[14px] font-medium">{h.toString().padStart(2, '0')} hrs</span>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </div>

                  {/* Minute */}
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Minute
                    </label>
                    <Controller
                      name="minute"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <Select
                            {...field}
                            className="bg-white dark:bg-slate-900 rounded-xl h-11 text-sm font-medium text-slate-800 dark:text-slate-100"
                            sx={{
                              '& .MuiSelect-select': {
                                fontSize: '14px !important',
                                fontWeight: 500,
                              },
                            }}
                          >
                            {minsSecs.map((m) => (
                              <MenuItem key={m} value={m}>
                                <span className="text-[14px] font-medium">{m.toString().padStart(2, '0')} min</span>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </div>

                  {/* Second */}
                  <div className="flex flex-col">
                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Second
                    </label>
                    <Controller
                      name="second"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <Select
                            {...field}
                            className="bg-white dark:bg-slate-900 rounded-xl h-11 text-sm font-medium text-slate-800 dark:text-slate-100"
                            sx={{
                              '& .MuiSelect-select': {
                                fontSize: '14px !important',
                                fontWeight: 500,
                              },
                            }}
                          >
                            {minsSecs.map((s) => (
                              <MenuItem key={s} value={s}>
                                <span className="text-[14px] font-medium">{s.toString().padStart(2, '0')} sec</span>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </div>
                </div>

                {/* Visual Explanation Bar */}
                <div className="rounded-xl border border-primary-100 dark:border-primary-900/50 bg-primary-50/70 dark:bg-primary-950/30 p-3.5 flex items-center gap-3">
                  <div className="text-primary-600 dark:text-primary-400 shrink-0">
                    <FuseSvgIcon size={20}>lucide:clock</FuseSvgIcon>
                  </div>
                  <Typography className="text-[13px] leading-[20px] text-primary-950 dark:text-primary-200 font-medium">
                    Emails will be sent automatically{' '}
                    <span className="font-bold underline decoration-primary-400 text-primary-900 dark:text-primary-100">
                      {selectedDay || 0} days
                    </span>{' '}
                    after the order is confirmed as{' '}
                    <span className="font-bold text-primary-900 dark:text-primary-100">delivered (estimated)</span>.
                  </Typography>
                </div>
              </div>
            </div>

            {/* Section 3: Order Matching Rules */}
            <div className="pt-7 space-y-4">
              <div>
                <Typography className="text-[16px] font-semibold text-slate-900 dark:text-white">
                  Order Matching Rules
                </Typography>
                <Typography className="text-[13px] leading-[20px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Define inventory targeting conditions for review request campaigns.
                </Typography>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 mb-1.5 block">
                    Target Inventory
                  </label>
                  <Controller
                    disabled
                    name="order_matching_rules"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <Select
                          {...field}
                          className="bg-slate-100/70 dark:bg-slate-800/30 rounded-xl h-11 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-not-allowed"
                          sx={{
                            '& .MuiSelect-select': {
                              fontSize: '14px !important',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                            },
                          }}
                        >
                          <MenuItem value="all products">
                            <span className="flex items-center gap-2.5 text-[14px] font-medium">
                              <FuseSvgIcon size={18} className="text-slate-500">
                                lucide:layers
                              </FuseSvgIcon>
                              All Products in Inventory
                            </span>
                          </MenuItem>
                          <MenuItem value="shipped items">
                            <span className="flex items-center gap-2.5 text-[14px] font-medium">
                              <FuseSvgIcon size={18} className="text-slate-500">
                                lucide:package
                              </FuseSvgIcon>
                              Shipped Items Only
                            </span>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                  <p className="text-[13px] leading-[20px] text-slate-500 dark:text-slate-400 mt-1.5">
                    This campaign automatically applies across your active product catalog.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Typography className="text-[13px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
              {Object.keys(dirtyFields).length === 0
                ? 'No changes to save'
                : 'Unsaved changes detected'}
            </Typography>

            <Button
              type="submit"
              variant="contained"
              disabled={!isValid || Object.keys(dirtyFields).length === 0 || isPending}
              className="w-full sm:w-auto bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-8 py-2.5 shadow-sm transition-all capitalize text-sm disabled:opacity-70 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 border border-transparent disabled:border-slate-200 dark:disabled:border-slate-700"
              startIcon={
                <FuseSvgIcon size={18}>
                  {isPending ? 'heroicons-outline:arrow-path' : 'lucide:save'}
                </FuseSvgIcon>
              }
            >
              {isPending ? 'Saving changes...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
}

export default GeneralSetting;