'use client';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import { Navigate } from 'react-router';
import usePermissions from '@/hooks/usePermissions';
import useUser from 'src/@auth/useUser';
import {
  FormControl,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FlagIcon from '@/components/ui/FlagIcon';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import {
  useAmazonCredentialsById as useAmazon,
  useUpsertAmazonCredentials,
} from '../../../api/hooks/amazonCredentials/useAmazonCredentials';
import AmazonCredentialsSkeleton from '@/components/skeletons/AmazonCredentialsSkeleton';
import {
  useMarketplace,
  useGeneralSetting,
} from '@/app/(control-panel)/apps/settings/api/hooks/generalDetailsSetting/useGeneralSettings';
import { useGeneralSettingMutation } from '@/app/(control-panel)/apps/settings/api/hooks/generalDetailsSetting/useUpdateGeneralSettings';

// Validation schema for Amazon Credentials
const amazonCredentialsSchema = z.object({
  client_id: z.string().nonempty('You must enter a client ID'),
  client_secret: z.string().nonempty('You must enter a client secret'),
  refresh_token: z.string().nonempty('You must enter a refresh token'),
  seller_id: z.string().nonempty('You must enter a seller ID'),
  marketplace_ids: z
    .array(z.string().nonempty())
    .min(1, 'You must select at least one marketplace'),
});

type AmazonCredentialsFormType = z.infer<typeof amazonCredentialsSchema>;

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.vars.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.vars.palette.divider,
    '& > .container': {
      maxWidth: '100% !important',
    },
  },
}));

function AmazonCredentialsFormContent({
  updateCredentialsMutation,
  onUpdateSuccess,
  credentials,
  canMutate = true,
}: {
  updateCredentialsMutation: any;
  onUpdateSuccess?: () => void;
  credentials: any;
  canMutate?: boolean;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { control, formState, handleSubmit, setError, setValue, watch } =
    useFormContext<AmazonCredentialsFormType>();
  const { errors, isValid, dirtyFields } = formState;
  const { data: marketplaceOptions } = useMarketplace();

  const { data: currentUser } = useUser();
  const { data: generalSettings } = useGeneralSetting();
  const updateGeneralSettingMutation = useGeneralSettingMutation();

  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { label: 'Select Marketplaces', icon: 'lucide:globe' },
    { label: 'API Credentials', icon: 'lucide:key' },
    { label: 'Review & Save', icon: 'lucide:shield-check' },
  ];

  const [showSecret, setShowSecret] = useState(false);
  const [activeMarketplaces, setActiveMarketplaces] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingFormData, setPendingFormData] =
    useState<AmazonCredentialsFormType | null>(null);
  const [userChangedActiveMarketplaces, setUserChangedActiveMarketplaces] =
    useState(false);
  const [savedActiveMarketplaces, setSavedActiveMarketplaces] = useState<
    string[] | null
  >(null);

  useEffect(() => {
    if (
      generalSettings?.activeMarketplaces &&
      savedActiveMarketplaces === null
    ) {
      setActiveMarketplaces(generalSettings.activeMarketplaces);
      setSavedActiveMarketplaces(generalSettings.activeMarketplaces);
    }
  }, [generalSettings, savedActiveMarketplaces]);

  const maxAllowed = (currentUser?.planLimits as any)?.maxMarketplaces ?? 5;

  const handleToggleActiveMarketplace = (id: string) => {
    setActiveMarketplaces((prev) => {
      const isAlreadyActive = prev.includes(id);
      if (isAlreadyActive) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= maxAllowed) {
          enqueueSnackbar(
            `Active marketplaces limit reached (${maxAllowed}/${maxAllowed}). Please upgrade your plan for more active marketplaces or unselect an existing marketplace first.`,
            {
              variant: 'warning',
            }
          );
          return prev;
        }
        return [...prev, id];
      }
    });
    setUserChangedActiveMarketplaces(true);
  };

  const onSubmit = async (data: AmazonCredentialsFormType) => {
    const baseline =
      savedActiveMarketplaces ?? generalSettings?.activeMarketplaces ?? [];
    const sortedBaseline = [...baseline].sort();
    const sortedNew = [...activeMarketplaces].sort();
    const activeMarketplacesChanged =
      userChangedActiveMarketplaces &&
      (sortedBaseline.length !== sortedNew.length ||
        !sortedBaseline.every((val, index) => val === sortedNew[index]));

    if (activeMarketplacesChanged) {
      setPendingFormData(data);
      setConfirmDialogOpen(true);
    } else {
      try {
        const response = await updateCredentialsMutation.mutateAsync({
          ...data,
        });
        enqueueSnackbar(
          response?.message || 'Credentials updated successfully!',
          {
            variant: 'success',
            autoHideDuration: 2000,
          }
        );
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } catch (error: any) {
        // console.error('Failed to update credentials:', error);
        enqueueSnackbar(
          error?.message || 'Failed to update credentials. Please try again.',
          {
            variant: 'error',
            autoHideDuration: 4000,
          }
        );
        if (error?.data) {
          error.data?.forEach?.(({ message, type }: any) =>
            setError(type, { type: 'manual', message })
          );
        }
      }
    }
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    setConfirmDialogOpen(false);
    try {
      // 1. Update Credentials
      await updateCredentialsMutation.mutateAsync({
        ...pendingFormData,
      });

      // 2. Update activeMarketplaces general settings
      await updateGeneralSettingMutation.mutateAsync({
        data: {
          activeMarketplaces: activeMarketplaces,
        },
      });

      // Reset the "user changed" flag and snapshot the saved state so
      // re-entering the page won't trigger the popup again.
      setUserChangedActiveMarketplaces(false);
      setSavedActiveMarketplaces([...activeMarketplaces]);

      enqueueSnackbar(
        'Amazon credentials and active marketplaces updated successfully!',
        {
          variant: 'success',
          autoHideDuration: 3000,
        }
      );

      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (error: any) {
      console.error('Failed to update configuration:', error);
      enqueueSnackbar(
        error?.message ||
        'Failed to update active marketplaces configuration.',
        {
          variant: 'error',
          autoHideDuration: 5000,
        }
      );
      if (error?.data) {
        error.data?.forEach?.(({ message, type }: any) =>
          setError(type, { type: 'manual', message })
        );
      }
    }
  };

  useEffect(() => {
    if (credentials?.data) {
      setValue('client_id', credentials?.data?.client_id || '');
      setValue('client_secret', credentials?.data?.client_secret || '');
      setValue('refresh_token', credentials?.data?.refresh_token || '');
      setValue('seller_id', credentials?.data?.seller_id || '');
      setValue(
        'marketplace_ids',
        credentials?.data?.marketplace_ids ||
        credentials?.data?.marketplace_id ||
        []
      );
    }
  }, [credentials, setValue]);

  const marketplaceIds = watch('marketplace_ids') || [];
  const clientId = watch('client_id');
  const clientSecret = watch('client_secret');
  const refreshToken = watch('refresh_token');
  const sellerId = watch('seller_id');

  const isStepValid = () => {
    if (activeStep === 0) {
      return marketplaceIds.length > 0;
    }
    if (activeStep === 1) {
      return (
        clientId?.trim() !== '' &&
        clientSecret?.trim() !== '' &&
        refreshToken?.trim() !== '' &&
        sellerId?.trim() !== '' &&
        !errors.client_id &&
        !errors.client_secret &&
        !errors.refresh_token &&
        !errors.seller_id
      );
    }
    return true;
  };

  const handleNext = () => {
    if (isStepValid() && activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const isPending =
    updateCredentialsMutation.isPending ||
    updateGeneralSettingMutation.isPending;

  return (
    <div className="w-full py-1.5">
      <Paper
        elevation={0}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        {/* Compact Stepper Header */}
        <div className="px-4 sm:px-6 md:px-8 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950/20">
          <div className="w-full">
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                '& .MuiStepConnector-root': {
                  top: '15px',
                  left: 'calc(-50% + 22px)',
                  right: 'calc(50% + 22px)',
                },
                '& .MuiStepConnector-line': {
                  borderColor: '#e2e8f0',
                  borderTopWidth: 2,
                },
                '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                  borderColor: 'var(--color-primary-700)',
                },
                '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line':
                {
                  borderColor: '#10b981',
                },
                '& .MuiStepLabel-label': {
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  mt: 0.75,
                  '&.Mui-active': {
                    color: 'var(--color-primary-700)',
                    fontWeight: 700,
                  },
                  '&.Mui-completed': {
                    color: '#059669',
                    fontWeight: 600,
                  },
                },
              }}
            >
              {steps.map((step, idx) => {
                const isCompleted = activeStep > idx;
                const isActive = activeStep === idx;
                return (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconComponent={() => (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${isCompleted
                            ? 'bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-100 dark:ring-emerald-950/50'
                            : isActive
                              ? 'bg-primary-700 text-white shadow-xs ring-4 ring-primary-100 dark:ring-primary-950/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          {isCompleted ? (
                            <FuseSvgIcon size={16}>lucide:check</FuseSvgIcon>
                          ) : (
                            <FuseSvgIcon size={15}>{step.icon}</FuseSvgIcon>
                          )}
                        </div>
                      )}
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Select Marketplaces */}
          {activeStep === 0 && (
            <div className="p-4 sm:p-5 md:p-6 space-y-4">
              {/* Step Header */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-primary-600/10 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <FuseSvgIcon size={16}>lucide:globe</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Select Connected Marketplaces
                  </Typography>
                  <Typography className="text-[12px] text-slate-500 dark:text-slate-400">
                    Choose the Amazon regional marketplaces to link with your seller account.
                  </Typography>
                </div>
              </div>

              <Controller
                name="marketplace_ids"
                control={control}
                defaultValue={[]}
                render={({ field }) => {
                  const selectedCount = (field.value || []).length;
                  const isLimitReached = selectedCount >= maxAllowed;

                  return (
                    <div className="space-y-4">
                      {/* Compact Quota Banner */}
                      <div
                        className={`p-2.5 px-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${isLimitReached
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-100'
                          : 'bg-primary-50/80 border-primary-200 text-primary-950 dark:bg-primary-950/40 dark:border-primary-500/30 dark:text-primary-100'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-2xs ${isLimitReached ? 'bg-amber-500' : 'bg-primary-700'
                              }`}
                          >
                            <FuseSvgIcon size={15}>
                              {isLimitReached
                                ? 'heroicons-outline:exclamation-triangle'
                                : 'heroicons-outline:information-circle'}
                            </FuseSvgIcon>
                          </div>
                          <div>
                            <span className="text-[12px] font-bold leading-tight block">
                              Marketplace Quota: {selectedCount} / {maxAllowed} Selected
                            </span>
                            <span className="text-[11px] opacity-80 block">
                              {isLimitReached
                                ? `Maximum active limit reached (${maxAllowed}/${maxAllowed}). Unselect one to connect another.`
                                : `Account allows up to ${maxAllowed} active marketplaces (${maxAllowed - selectedCount} remaining).`}
                            </span>
                          </div>
                        </div>

                        <Chip
                          label={`${selectedCount} / ${maxAllowed} Selected`}
                          size="small"
                          className={`self-start sm:self-center font-bold px-2 py-0 text-[11px] border h-6 ${isLimitReached
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-primary-100 text-primary-900 border-primary-300'
                            }`}
                        />
                      </div>

                      {/* 4 In a Row Grid - Compact Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {marketplaceOptions?.map((item: any) => {
                          const isSelected = (field.value || []).includes(
                            item?.marketplace_id
                          );
                          return (
                            <div
                              key={item?.marketplace_id}
                              onClick={() => {
                                const currentVal = field.value || [];
                                if (
                                  !isSelected &&
                                  currentVal.length >= maxAllowed
                                ) {
                                  enqueueSnackbar(
                                    `Active marketplaces limit reached (${maxAllowed}/${maxAllowed}). Please upgrade your plan for more active marketplaces or unselect an existing marketplace first.`,
                                    {
                                      variant: 'warning',
                                    }
                                  );
                                  return;
                                }
                                const newValue = isSelected
                                  ? currentVal.filter(
                                    (id: string) =>
                                      id !== item?.marketplace_id
                                  )
                                  : [...currentVal, item?.marketplace_id];
                                field.onChange(newValue);
                              }}
                              className={`p-2.5 px-3 rounded-xl border-2 cursor-pointer transition-all select-none flex items-center gap-2.5 ${isSelected
                                ? 'bg-primary-50/70 dark:bg-primary-950/40 border-primary-600 dark:border-primary-500 shadow-2xs ring-1 ring-primary-500/20 text-primary-950 dark:text-primary-100'
                                : isLimitReached
                                  ? 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100 hover:border-amber-400 text-slate-600 dark:text-slate-300'
                                  : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                                }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                color="primary"
                                disableRipple
                                sx={{
                                  p: 0,
                                  '& .MuiSvgIcon-root': { fontSize: 20 },
                                  color: isSelected ? 'var(--color-primary-700)' : '#94a3b8',
                                  '&.Mui-checked': { color: 'var(--color-primary-700)' },
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <FlagIcon
                                    code={item?.country_code}
                                    country={item?.country}
                                    className="w-4 h-3 shrink-0 rounded-2xs shadow-2xs"
                                  />
                                  <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                                    {item?.country}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                                  Code: {item?.country_code} ({item?.marketplace_id})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              {!!errors.marketplace_ids && (
                <Typography color="error" variant="caption" className="block font-medium">
                  {errors.marketplace_ids?.message as string}
                </Typography>
              )}
            </div>
          )}

          {/* Step 2: API Credentials */}
          {activeStep === 1 && (
            <div className="p-4 sm:p-5 md:p-6 space-y-4">
              {/* Step Header */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-primary-600/10 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <FuseSvgIcon size={18}>lucide:key</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Enter SP-API Credentials
                  </Typography>
                  <Typography className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
                    Enter your Amazon Selling Partner API developer credentials.
                  </Typography>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client ID */}
                <div className="flex flex-col">
                  <label
                    htmlFor="client_id"
                    className="text-[13px] sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                  >
                    Client ID <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="client_id"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <TextField
                          id="client_id"
                          {...field}
                          required
                          autoFocus
                          fullWidth
                          variant="outlined"
                          error={!!errors.client_id}
                          helperText={errors?.client_id?.message as string}
                          placeholder="amzn1.application-oa2-client..."
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-50/50 dark:bg-slate-800/50 rounded-xl h-11 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                              startAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 mr-2 flex items-center">
                                  <FuseSvgIcon size={18}>lucide:key</FuseSvgIcon>
                                </div>
                              ),
                            },
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </div>

                {/* Client Secret */}
                <div className="flex flex-col">
                  <label
                    htmlFor="client_secret"
                    className="text-[13px] sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                  >
                    Client Secret <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="client_secret"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <TextField
                          id="client_secret"
                          {...field}
                          type={showSecret ? 'text' : 'password'}
                          required
                          fullWidth
                          variant="outlined"
                          error={!!errors.client_secret}
                          helperText={errors?.client_secret?.message as string}
                          placeholder="Enter your client secret key"
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-50/50 dark:bg-slate-800/50 rounded-xl h-11 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                              startAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 mr-2 flex items-center">
                                  <FuseSvgIcon size={18}>lucide:lock</FuseSvgIcon>
                                </div>
                              ),
                              endAdornment: (
                                <IconButton
                                  size="small"
                                  onClick={() => setShowSecret(!showSecret)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <FuseSvgIcon size={18}>
                                    {showSecret ? 'lucide:eye-off' : 'lucide:eye'}
                                  </FuseSvgIcon>
                                </IconButton>
                              ),
                            },
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </div>

                {/* Seller ID */}
                <div className="flex flex-col">
                  <label
                    htmlFor="seller_id"
                    className="text-[13px] sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                  >
                    Seller ID (Merchant Token) <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="seller_id"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <TextField
                          id="seller_id"
                          {...field}
                          required
                          fullWidth
                          variant="outlined"
                          error={!!errors.seller_id}
                          helperText={errors?.seller_id?.message as string}
                          placeholder="A1B2C3D4E5F6G7"
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-50/50 dark:bg-slate-800/50 rounded-xl h-11 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                              startAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 mr-2 flex items-center">
                                  <FuseSvgIcon size={18}>lucide:user</FuseSvgIcon>
                                </div>
                              ),
                            },
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </div>

                {/* Security tip info */}
                <div className="hidden md:block">
                  <div className="rounded-xl border border-primary-100 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-950/30 p-3 h-full flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-xs sm:text-[13px]">
                      <FuseSvgIcon size={18}>lucide:shield-alert</FuseSvgIcon>
                      <span>Secure Credential Storage</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mt-1">
                      Credentials are encrypted using AES-256 and used exclusively for authorized Selling Partner API data sync.
                    </p>
                  </div>
                </div>

                {/* Refresh Token (Full Width) */}
                <div className="md:col-span-2 flex flex-col">
                  <label
                    htmlFor="refresh_token"
                    className="text-[13px] sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                  >
                    Refresh Token (LWA) <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="refresh_token"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <TextField
                          id="refresh_token"
                          {...field}
                          required
                          fullWidth
                          multiline
                          rows={3}
                          variant="outlined"
                          error={!!errors.refresh_token}
                          helperText={errors?.refresh_token?.message as string}
                          placeholder="Atzr|IwEBIA..."
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-50/50 dark:bg-slate-800/50 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-mono',
                            },
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Summary */}
          {activeStep === 2 && (
            <div className="p-4 sm:p-5 md:p-6 space-y-4">
              {/* Step Header */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-primary-600/10 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <FuseSvgIcon size={16}>lucide:shield-check</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Review & Confirm Settings
                  </Typography>
                  <Typography className="text-[12px] text-slate-500 dark:text-slate-400">
                    Review your connection configuration and activate stores before saving.
                  </Typography>
                </div>
              </div>

              {/* Summary Cards - Compact & High Density */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {/* Credentials summary */}
                <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-slate-50/60 via-white to-slate-50/30 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950/20 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <FuseSvgIcon size={14}>lucide:key</FuseSvgIcon>
                      </div>
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white block leading-tight">
                        SP-API Account Details
                      </span>
                    </div>
                    <Chip
                      label="Configured"
                      size="small"
                      className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700 text-[10px] px-1.5 h-5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Seller ID
                      </span>
                      <span className="text-[12px] font-bold text-slate-900 dark:text-white font-mono block truncate">
                        {sellerId || '—'}
                      </span>
                    </div>

                    <div className="p-2 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Client ID
                      </span>
                      <span className="text-[12px] font-bold text-slate-900 dark:text-white font-mono block truncate">
                        {clientId ? `${clientId.substring(0, 10)}...` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-400">
                    <FuseSvgIcon size={12} className="text-slate-500">lucide:lock</FuseSvgIcon>
                    <span>AES-256 Encrypted Connection</span>
                  </div>
                </div>

                {/* Selected Marketplaces Pill Summary */}
                <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-slate-50/60 via-white to-slate-50/30 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950/20 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <FuseSvgIcon size={14}>lucide:globe</FuseSvgIcon>
                      </div>
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white block leading-tight">
                        Linked Marketplaces
                      </span>
                    </div>
                    <Chip
                      label={`${marketplaceIds.length} Total`}
                      size="small"
                      className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700 text-[10px] px-1.5 h-5"
                    />
                  </div>

                  <div className="p-2 px-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 min-h-[50px] flex flex-wrap gap-1.5 items-center">
                    {marketplaceIds.length === 0 ? (
                      <span className="text-[12px] text-slate-400 italic">No marketplaces selected</span>
                    ) : (
                      marketplaceIds.map((id) => {
                        const mp = marketplaceOptions?.find(
                          (item: any) => item?.marketplace_id === id
                        );
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 shadow-2xs"
                          >
                            <FlagIcon
                              code={mp?.country_code}
                              country={mp?.country}
                              className="w-3.5 h-2.5 shrink-0 rounded-2xs shadow-2xs"
                            />
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                              {mp ? mp.country : id}
                            </span>
                            {mp?.country_code && (
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                                {mp.country_code}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-400">
                    <FuseSvgIcon size={12} className="text-primary-600">lucide:check-circle</FuseSvgIcon>
                    <span>Ready for live data synchronization</span>
                  </div>
                </div>
              </div>

              {/* Active Marketplaces Activation Section */}
              <div className="pt-2 space-y-3">
                <div>
                  <Typography className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">
                    Activate Stores for Automated Sync & Actions
                  </Typography>
                  <Typography className="text-[12px] text-slate-500 dark:text-slate-400">
                    Configure which connected stores the system runs orders and automated review actions on.
                  </Typography>
                </div>

                {/* Compact Active Marketplaces Limit Banner */}
                <div
                  className={`p-2.5 px-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${activeMarketplaces.length >= maxAllowed
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-100'
                    : 'bg-primary-50/80 border-primary-200 text-primary-950 dark:bg-primary-950/40 dark:border-primary-500/30 dark:text-primary-100'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-2xs ${activeMarketplaces.length >= maxAllowed
                        ? 'bg-amber-500'
                        : 'bg-primary-700'
                        }`}
                    >
                      <FuseSvgIcon size={15}>
                        {activeMarketplaces.length >= maxAllowed
                          ? 'heroicons-outline:exclamation-triangle'
                          : 'heroicons-outline:information-circle'}
                      </FuseSvgIcon>
                    </div>
                    <div>
                      <span className="text-[12px] font-bold leading-tight block">
                        Active Marketplaces: {activeMarketplaces.length} / {maxAllowed} Activated
                      </span>
                      <span className="text-[11px] opacity-80 block">
                        {activeMarketplaces.length >= maxAllowed
                          ? `Maximum active limit reached (${maxAllowed}/${maxAllowed}). Unselect one to activate another.`
                          : `Activate up to ${maxAllowed} stores for live sync (${maxAllowed - activeMarketplaces.length} remaining).`}
                      </span>
                    </div>
                  </div>

                  <Chip
                    label={`${activeMarketplaces.length} / ${maxAllowed} Active`}
                    size="small"
                    className={`self-start sm:self-center font-bold px-2 py-0 text-[11px] border h-6 ${activeMarketplaces.length >= maxAllowed
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-primary-100 text-primary-900 border-primary-300'
                      }`}
                  />
                </div>

                {/* 4 in a row Compact Active Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {marketplaceIds.map((id) => {
                    const mp = marketplaceOptions?.find(
                      (item: any) => item?.marketplace_id === id
                    );
                    const isActive = activeMarketplaces.includes(id);
                    const isLimitReached =
                      !isActive && activeMarketplaces.length >= maxAllowed;

                    return (
                      <div
                        key={id}
                        onClick={() => handleToggleActiveMarketplace(id)}
                        className={`relative p-2.5 px-3 rounded-xl border-2 cursor-pointer transition-all select-none flex items-center gap-2.5 ${isActive
                          ? 'bg-primary-50/70 dark:bg-primary-950/40 border-primary-600 dark:border-primary-500 shadow-2xs ring-1 ring-primary-500/20 text-primary-950 dark:text-primary-100'
                          : isLimitReached
                            ? 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100 hover:border-amber-400 text-slate-600 dark:text-slate-300'
                            : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                          }`}
                      >
                        {isActive && (
                          <span className="absolute top-1.5 right-1.5 bg-primary-700 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-xs">
                            Active
                          </span>
                        )}
                        <Checkbox
                          checked={isActive}
                          color="primary"
                          disableRipple
                          sx={{
                            p: 0,
                            '& .MuiSvgIcon-root': { fontSize: 20 },
                            color: isActive ? 'var(--color-primary-700)' : '#94a3b8',
                            '&.Mui-checked': { color: 'var(--color-primary-700)' },
                          }}
                        />
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-1.5">
                            <FlagIcon
                              code={mp?.country_code}
                              country={mp?.country}
                              className="w-4 h-3 shrink-0 rounded-2xs shadow-2xs"
                            />
                            <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                              {mp ? mp.country : id}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                            Code: {mp ? mp.country_code : id}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 sticky bottom-0 z-10 backdrop-blur-sm">
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
              className="rounded-xl px-5 py-2 text-sm font-semibold capitalize border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 h-10.5 transition-all"
              startIcon={<FuseSvgIcon size={18}>lucide:arrow-left</FuseSvgIcon>}
            >
              Back
            </Button>

            {activeStep < 2 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!canMutate || !isStepValid()}
                className="bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-6 py-2 shadow-xs hover:shadow transition-all capitalize text-sm disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-800 h-10.5"
                endIcon={<FuseSvgIcon size={18}>lucide:arrow-right</FuseSvgIcon>}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={
                  !canMutate ||
                  marketplaceIds.length === 0 ||
                  !clientId?.trim() ||
                  !clientSecret?.trim() ||
                  !refreshToken?.trim() ||
                  !sellerId?.trim() ||
                  !!errors.client_id ||
                  !!errors.client_secret ||
                  !!errors.refresh_token ||
                  !!errors.seller_id ||
                  isPending
                }
                className="bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-7 py-2 shadow-xs hover:shadow transition-all capitalize text-sm disabled:opacity-70 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 border border-transparent disabled:border-slate-200 dark:disabled:border-slate-700 h-10.5"
                startIcon={
                  <FuseSvgIcon size={18}>
                    {isPending ? 'heroicons-outline:arrow-path' : 'lucide:save'}
                  </FuseSvgIcon>
                }
              >
                {isPending ? 'Saving configuration...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </form>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            },
          }}
        >
          <DialogTitle className="font-bold text-gray-900 flex items-center gap-2 text-sm">
            <FuseSvgIcon className="text-amber-500" size={20}>
              heroicons-outline:exclamation-triangle
            </FuseSvgIcon>
            Confirm Marketplace Activation
          </DialogTitle>
          <DialogContent>
            <DialogContentText className="text-[12px] leading-relaxed text-slate-600 mb-3">
              Review your active marketplaces selection before confirming. You can update these settings anytime.
            </DialogContentText>

            {/* Previously Active */}
            {savedActiveMarketplaces && savedActiveMarketplaces.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Previously Active:
                </span>
                <div className="flex flex-wrap gap-1">
                  {savedActiveMarketplaces.map((id) => {
                    const mp = marketplaceOptions?.find(
                      (item: any) => item?.marketplace_id === id
                    );
                    return (
                      <div
                        key={id}
                        className="bg-white border border-slate-200 text-slate-800 rounded px-1.5 py-0.5 text-[11px] flex items-center gap-1 shadow-2xs"
                      >
                        <FlagIcon
                          code={mp?.country_code}
                          country={mp?.country}
                          className="w-3.5 h-2.5 shrink-0 rounded-2xs"
                        />
                        <span className="font-medium">{mp ? mp.country : id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-2.5 mb-1">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                New Active Stores:
              </span>
              {activeMarketplaces.length === 0 ? (
                <span className="text-[12px] text-amber-800 italic block">
                  None (System operations will be inactive)
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {activeMarketplaces.map((id) => {
                    const mp = marketplaceOptions?.find(
                      (item: any) => item?.marketplace_id === id
                    );
                    return (
                      <div
                        key={id}
                        className="bg-emerald-600 text-white rounded px-1.5 py-0.5 text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                      >
                        <FlagIcon
                          code={mp?.country_code}
                          country={mp?.country}
                          className="w-3.5 h-2.5 shrink-0 rounded-2xs"
                        />
                        <span>{mp ? mp.country : id}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex justify-end gap-3">
            <Button
              onClick={() => setConfirmDialogOpen(false)}
              className="capitalize text-slate-700 hover:bg-slate-100 rounded-xl px-5 py-2 border border-slate-300 font-semibold text-xs sm:text-sm"
              sx={{
                borderRadius: '12px',
                textTransform: 'capitalize'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              variant="contained"
              className="bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-6 py-2 shadow-sm transition-all capitalize text-xs sm:text-sm"
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
                borderRadius: '12px',
                textTransform: 'capitalize'
              }}
            >
              Confirm & Save
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
}

function AmazonCredentialsView() {
  const { canView, canUpdate } = usePermissions();
  const canMutate = canUpdate('amazon-credentials');
  const { data: credentials, isLoading: isCredentialsLoading } = useAmazon();
  const { isLoading: isMarketplacesLoading } = useMarketplace();
  const updateCredentialsMutation = useUpsertAmazonCredentials();

  const amazonCredentialsMethods = useForm<AmazonCredentialsFormType>({
    mode: 'onChange',
    defaultValues: {
      client_id: '',
      client_secret: '',
      refresh_token: '',
      seller_id: '',
      marketplace_ids: [],
    },
    resolver: zodResolver(amazonCredentialsSchema),
  });

  const handleUpdateSuccess = () => {
    // console.log('Form data refreshed after successful update');
  };

  if (!canView('amazon-credentials')) {
    return <Navigate to="/" replace />;
  }

  if (isCredentialsLoading || isMarketplacesLoading) {
    return <AmazonCredentialsSkeleton />;
  }

  return (
    <FormProvider {...amazonCredentialsMethods}>
      <AmazonCredentialsFormContent
        updateCredentialsMutation={updateCredentialsMutation}
        onUpdateSuccess={handleUpdateSuccess}
        credentials={credentials}
        canMutate={canMutate}
      />
    </FormProvider>
  );
}

export default AmazonCredentialsView;
