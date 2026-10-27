'use client';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { z } from 'zod';
import { Controller as HookFormController, useForm } from 'react-hook-form';

const Controller = HookFormController as React.ComponentType<any>;
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import _ from 'lodash';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useProfile } from '../../api/hooks/account/useAccountSettings';
import {
  useUpdateUser,
  useUploadAvatar,
  useDeleteAvatar,
} from '../../api/hooks/account/useUpdateAccountSettings';
import FormControl from '@mui/material/FormControl';
import type { UpdateUserData } from '../../api/types';
import { useSnackbar } from 'notistack';
import { AccountSettingsSkeleton } from '@/components/skeletons/SettingsFormSkeleton';
import useUser from '@auth/useUser';
import usePermissions from '@/hooks/usePermissions';
import { Paper, Chip, LinearProgress } from '@mui/material';
import moment from 'moment';
import { generateSellerInvoicePDF } from '../../../users/utils/generateSellerInvoicePDF';
import { getImageUrl } from '@/configs/env';

const defaultValues: FormType = {
  name: '',
  businessName: '',
  contact_no: '',
  email: '',
};

const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.'-]+$/;
const PHONE_CHARS_REGEX = /^[+0-9\s()]+$/;

/**
 * Form Validation Schema
 */
const accountSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required!' })
    .trim()
    .min(1, 'Full name is required!')
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')
    .regex(
      NAME_REGEX,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  businessName: z.string().optional().or(z.literal('')),
  contact_no: z
    .string({ required_error: 'Contact number is required!' })
    .trim()
    .min(1, 'Contact number is required!')
    .max(20, 'Contact number cannot exceed 20 characters')
    .regex(
      PHONE_CHARS_REGEX,
      'Contact number can only contain numbers, +, spaces, and parentheses'
    )
    .refine((val) => !val.includes('-'), {
      message: 'Contact number cannot contain hyphens (-)',
    })
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '');
        return digits.length >= 10;
      },
      {
        message: 'Contact number must be at least 10 digits',
      }
    )
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '');
        return digits.length <= 20;
      },
      {
        message: 'Contact number cannot exceed 20 digits',
      }
    ),
  email: z
    .string({ required_error: 'Email is required!' })
    .trim()
    .email('You must enter a valid email address')
    .min(1, 'Email is required!'),
});

type FormType = z.infer<typeof accountSchema>;

function AccountTabView() {
  const [activeTab, setActiveTab] = useState(0);
  const { data: authUser } = useUser();
  const { canUpdate, scope } = usePermissions();
  const canEdit = canUpdate('/settings/account');
  const { data: accountSettings, isLoading: isProfileLoading } = useProfile();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: updateAccountSettings, isPending } = useUpdateUser();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
  const { mutate: deleteAvatar, isPending: isDeletingAvatar } = useDeleteAvatar();

  const user = accountSettings?.data || (authUser as any);
  const isSeller =
    scope === 'seller' &&
    !user?.isSuperAdmin &&
    user?.userType !== 'admin';

  const { control, handleSubmit, formState, reset, setError } = useForm<FormType>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(accountSchema),
  });

  const { isValid, dirtyFields, errors } = formState;

  /**
   * Form Submit
   */
  function onSubmit(data: FormType) {
    if (!canEdit) {
      enqueueSnackbar('You do not have permission to update account settings.', {
        variant: 'error',
      });
      return;
    }
    if (isSeller && (!data.businessName || data.businessName.trim().length < 2)) {
      setError('businessName', {
        type: 'manual',
        message: 'Business / Brand name must be at least 2 characters',
      });
      return;
    }
    const updateData: UpdateUserData = {
      name: data.name,
      businessName: data.businessName ? data.businessName.trim() : '',
      contact_no: data.contact_no ? data.contact_no.trim() : '',
      email: data.email,
    };

    updateAccountSettings(updateData, {
      onSuccess: (response) => {
        enqueueSnackbar(response?.message || 'Profile updated successfully!', {
          variant: 'success',
          autoHideDuration: 2000,
        });
        reset({
          name: updateData.name,
          businessName: updateData.businessName,
          contact_no: updateData.contact_no,
          email: updateData.email,
        });
      },
      onError: (error) => {
        enqueueSnackbar(
          error?.message || 'Failed to update profile. Please try again.',
          {
            variant: 'error',
            autoHideDuration: 2000,
          }
        );
      },
    });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      enqueueSnackbar('You do not have permission to update avatar.', {
        variant: 'error',
      });
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('Image size should be less than 5MB', {
        variant: 'error',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Only image files (JPG, PNG, WEBP) are allowed', {
        variant: 'error',
      });
      return;
    }

    uploadAvatar(file, {
      onSuccess: (res: any) => {
        enqueueSnackbar(res?.message || 'Profile image updated successfully!', {
          variant: 'success',
          autoHideDuration: 2500,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: (err: any) => {
        enqueueSnackbar(err?.message || 'Failed to upload profile image', {
          variant: 'error',
          autoHideDuration: 3000,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
    });
  };

  const handleDeleteAvatar = () => {
    if (!canEdit) {
      enqueueSnackbar('You do not have permission to delete avatar.', {
        variant: 'error',
      });
      return;
    }
    deleteAvatar(undefined as any, {
      onSuccess: (res: any) => {
        enqueueSnackbar(res?.message || 'Profile image removed successfully!', {
          variant: 'success',
          autoHideDuration: 2500,
        });
      },
      onError: (err: any) => {
        enqueueSnackbar(err?.message || 'Failed to remove profile image', {
          variant: 'error',
          autoHideDuration: 3000,
        });
      },
    });
  };

  useEffect(() => {
    const userData = accountSettings?.data || accountSettings;
    if (userData || authUser) {
      const nameVal = userData?.name || authUser?.name || authUser?.displayName || '';
      const businessVal = userData?.businessName || (authUser as any)?.businessName || '';
      const contactVal =
        userData?.contact_no ||
        userData?.phone ||
        userData?.contact ||
        userData?.phoneNumber ||
        authUser?.contact_no ||
        (authUser as any)?.phone ||
        (authUser as any)?.contact ||
        '';
      const emailVal = userData?.email || authUser?.email || '';

      reset({
        name: nameVal,
        businessName: businessVal,
        contact_no: contactVal,
        email: emailVal,
      });
    }
  }, [accountSettings, authUser, reset]);

  const userAvatar = user?.avatar || (authUser as any)?.avatar;
  const userInitials = (user?.name?.[0] || authUser?.name?.[0] || 'U').toUpperCase();

  const paidPlan =
    (Array.isArray(user?.plans) &&
      (user.plans.find((p: any) => p.paymentStatus === 1 || p.status === 1) || user.plans[0])) ||
    (typeof user?.currentPlanId === 'object' && user?.currentPlanId ? user.currentPlanId : null);

  const planName =
    paidPlan?.name ||
    (typeof user?.currentPlanId === 'object' ? user.currentPlanId?.name : null) ||
    'Seller Subscription';
  const price = Number(paidPlan?.price) || 0;
  const cycleNum =
    Number(paidPlan?.billingCycle) ||
    (typeof user?.currentPlanId === 'object' ? Number(user.currentPlanId?.billingCycle) : 1);
  const cycleText =
    cycleNum === 3 ? 'Annual (Billed Yearly)' : cycleNum === 2 ? 'Quarterly (3 Months)' : 'Monthly';
  const planPriceText =
    price > 0 ? `$${price} / ${cycleNum === 3 ? 'yr' : cycleNum === 2 ? 'qtr' : 'mo'}` : 'Free Plan';
  const marketplaces =
    Number(paidPlan?.marketplace) || Number(user?.planLimits?.maxMarketplaces) || 1;

  const maxQuota =
    Number(paidPlan?.request_quota) ||
    (typeof user?.currentPlanId === 'object' ? Number(user.currentPlanId?.request_quota) : 0) ||
    Number(user?.planLimits?.maxReviewRequestsPerMonth) ||
    1000;
  const usedRequests =
    Number(user?.planLimits?.usedReviewRequests) ||
    Number(user?.usedReviewRequests) ||
    0;
  const remainingRequests = Math.max(0, maxQuota - usedRequests);
  const usagePercent = Math.min(100, Math.round((usedRequests / (maxQuota || 1)) * 100));

  const expiryDate =
    paidPlan?.expireAt ||
    paidPlan?.expiresAt ||
    (typeof user?.currentPlanId === 'object' ? user?.currentPlanId?.expireAt : null);

  const hasExpiry = Boolean(expiryDate && moment(expiryDate).isValid());
  const expiryMoment = hasExpiry ? moment(expiryDate) : null;
  const isExpired = expiryMoment ? expiryMoment.isBefore(moment(), 'day') : false;
  const daysLeft = expiryMoment ? expiryMoment.diff(moment(), 'days') : null;

  const formattedExpiryDate = hasExpiry
    ? expiryMoment!.format('DD MMM YYYY')
    : 'No Expiration';

  const expirySubtitle = hasExpiry
    ? isExpired
      ? 'Plan has expired'
      : daysLeft === 0
      ? 'Expires today'
      : daysLeft === 1
      ? 'Expires tomorrow'
      : `${daysLeft} days remaining`
    : 'Continuous access';

  const expiryDateText = expiryDate
    ? `Renews / Expires: ${moment(expiryDate).format('DD MMM YYYY')}`
    : 'Auto-renews per cycle';

  const subStatus = user?.subscriptionStatus;
  let statusLabel = 'Active Subscription';
  let statusChipClass =
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700 text-xs px-2.5 py-0.5';

  if (subStatus === 0) {
    statusLabel = 'Pending Payment';
    statusChipClass =
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700 text-xs px-2.5 py-0.5';
  } else if (subStatus === 2) {
    statusLabel = 'Past Due / Expired';
    statusChipClass =
      'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-semibold border border-orange-300 dark:border-orange-700 text-xs px-2.5 py-0.5';
  } else if (subStatus === 3) {
    statusLabel = 'Canceled';
    statusChipClass =
      'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-semibold border border-red-300 dark:border-red-700 text-xs px-2.5 py-0.5';
  }

  const handleDownloadInvoice = async () => {
    if (!accountSettings?.data) {
      enqueueSnackbar('No billing information found to generate invoice.', {
        variant: 'error',
      });
      return;
    }
    try {
      await generateSellerInvoicePDF(accountSettings.data);
      enqueueSnackbar('Invoice PDF downloaded successfully!', {
        variant: 'success',
        autoHideDuration: 2500,
      });
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Failed to generate invoice PDF', {
        variant: 'error',
        autoHideDuration: 2500,
      });
    }
  };

  if (isProfileLoading) {
    return <AccountSettingsSkeleton />;
  }

  return (
    <div className="w-full space-y-4">
      {/* Slim Compact Segmented Tabs (Shown when multiple tabs exist) */}
      {isSeller && (
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab(0)}
            className={`h-8 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border-0 ${
              activeTab === 0
                ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
            }`}
          >
            <FuseSvgIcon size={15}>lucide:circle-user</FuseSvgIcon>
            <span>Personal Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`h-8 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border-0 ${
              activeTab === 1
                ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
            }`}
          >
            <FuseSvgIcon size={15}>lucide:credit-card</FuseSvgIcon>
            <span>Subscription</span>
          </button>
        </div>
      )}

      {/* TAB 0: Personal Information */}
      {activeTab === 0 && (
        <Paper
          elevation={0}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            {!canEdit && (
              <div className="mx-4 sm:mx-6 md:mx-8 mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium">
                <FuseSvgIcon size={20} className="text-amber-600 dark:text-amber-400 shrink-0">
                  heroicons-outline:information-circle
                </FuseSvgIcon>
                <span>
                  <strong>View-only mode:</strong> You do not have permission to modify account settings. All fields are read-only.
                </span>
              </div>
            )}

            {/* Header Section */}
            <div className="px-5 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-slate-50/90 via-white to-primary/5 dark:from-slate-900 dark:via-slate-900 dark:to-primary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 flex items-center justify-center text-primary dark:text-primary-400 shrink-0 shadow-xs">
                    <FuseSvgIcon size={22}>lucide:circle-user</FuseSvgIcon>
                  </div>
                  <div>
                    <Typography className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Personal Information
                    </Typography>
                    <Typography className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Update your personal profile details, photo, and contact information.
                    </Typography>
                  </div>
                </div>
                <div className="self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Account
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields Section */}
            <div className="p-5 sm:p-8 space-y-6">
              {/* Profile Photo / Avatar Hero Card */}
              <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-linear-to-br from-slate-50/70 via-white to-primary/5 dark:from-slate-800/40 dark:via-slate-850 dark:to-primary-950/20 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative group shrink-0">
                  <Avatar
                    src={userAvatar ? getImageUrl(userAvatar) : undefined}
                    alt={user?.name || 'Profile Image'}
                    variant="circular"
                    className="w-18 h-18 sm:w-20 sm:h-20 border-2 border-primary-200/90 dark:border-primary-800 shadow-xs text-2xl font-bold bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 flex items-center justify-center transition-all"
                  >
                    {userInitials}
                  </Avatar>
                  {(isUploadingAvatar || isDeletingAvatar) && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs rounded-full flex items-center justify-center">
                      <FuseSvgIcon size={20} className="text-white animate-spin">
                        heroicons-outline:arrow-path
                      </FuseSvgIcon>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5 flex-1 min-w-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0">
                      {user?.name || 'Account User'}
                    </h3>
                  </div>

                  <Typography className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a high-resolution avatar photo. JPG, PNG, or WEBP (Max 5MB).
                  </Typography>

                  <div className="flex items-center gap-2.5 pt-1 flex-wrap justify-center sm:justify-start">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={!canEdit || isUploadingAvatar || isDeletingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="normal-case font-semibold text-xs px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                      startIcon={
                        <FuseSvgIcon size={16}>
                          {isUploadingAvatar ? 'heroicons-outline:arrow-path' : 'lucide:upload'}
                        </FuseSvgIcon>
                      }
                    >
                      {isUploadingAvatar ? 'Uploading...' : 'Upload Image'}
                    </Button>

                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      disabled={!canEdit || !userAvatar || isUploadingAvatar || isDeletingAvatar}
                      onClick={handleDeleteAvatar}
                      className="normal-case font-semibold text-xs px-3.5 py-2 rounded-lg border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 shadow-2xs transition-all disabled:opacity-50"
                      startIcon={
                        <FuseSvgIcon size={16} className="text-red-600 dark:text-red-400">
                          lucide:trash-2
                        </FuseSvgIcon>
                      }
                    >
                      {isDeletingAvatar ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                </div>
              </div>

              <fieldset disabled={!canEdit} className={!canEdit ? 'pointer-events-none opacity-80 border-0 p-0 m-0' : 'border-0 p-0 m-0'}>

              {/* Form Input Grid (3 columns in a single row) */}
              <div className={`grid grid-cols-1 ${isSeller ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-5`}>
                {/* Name Field */}
                <div className="flex flex-col">
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                  >
                    Full Name <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <FormControl className="w-full">
                        <TextField
                          {...field}
                          placeholder="Enter your full name"
                          id="name"
                          error={!!errors.name}
                          helperText={errors?.name?.message}
                          required
                          fullWidth
                          inputProps={{ maxLength: 60 }}
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 rounded-xl h-11 text-sm font-medium transition-all shadow-xs',
                              startAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 mr-2.5 flex items-center">
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

                {/* Business Name Field (Only for Sellers) */}
                {isSeller && (
                  <div className="flex flex-col">
                    <label
                      htmlFor="businessName"
                      className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                    >
                      Business / Brand Name <span className="text-red-500 font-bold ml-0.5">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="businessName"
                      render={({ field }) => (
                        <FormControl className="w-full">
                          <TextField
                            {...field}
                            placeholder="Enter your business or brand name"
                            id="businessName"
                            error={!!errors.businessName}
                            helperText={errors?.businessName?.message}
                            required
                            fullWidth
                            inputProps={{ maxLength: 100 }}
                            slotProps={{
                              input: {
                                className:
                                  'bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 rounded-xl h-11 text-sm font-medium transition-all shadow-xs',
                                startAdornment: (
                                  <div className="text-slate-400 dark:text-slate-500 mr-2.5 flex items-center">
                                    <FuseSvgIcon size={18}>lucide:building-2</FuseSvgIcon>
                                  </div>
                                ),
                              },
                            }}
                          />
                        </FormControl>
                      )}
                    />
                  </div>
                )}

                {/* Contact Number Field */}
                <div className="flex flex-col">
                  <label
                    htmlFor="contact_no"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                  >
                    Contact Number <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="contact_no"
                    render={({ field }) => (
                      <FormControl className="w-full">
                        <TextField
                          {...field}
                          onKeyDown={(e) => {
                            if (e.key === '-') {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            field.onChange(e.target.value.replace(/-/g, ''));
                          }}
                          placeholder="Enter your contact number (10-20 digits)"
                          id="contact_no"
                          error={!!errors.contact_no}
                          helperText={errors?.contact_no?.message}
                          required
                          fullWidth
                          inputProps={{ maxLength: 20 }}
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 rounded-xl h-11 text-sm font-medium transition-all shadow-xs',
                              startAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 mr-2.5 flex items-center">
                                  <FuseSvgIcon size={18}>lucide:phone</FuseSvgIcon>
                                </div>
                              ),
                            },
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </div>

                {/* Email Field */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-slate-800 dark:text-slate-100 block"
                    >
                      Email Address
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      <FuseSvgIcon size={12} className="text-slate-400">lucide:lock</FuseSvgIcon>
                      Primary Login
                    </span>
                  </div>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormControl className="w-full">
                        <TextField
                          {...field}
                          id="email"
                          placeholder="your.email@example.com"
                          variant="outlined"
                          fullWidth
                          disabled
                          error={!!errors.email}
                          helperText={errors?.email?.message || 'Email address is permanently linked to your account'}
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-100/70 dark:bg-slate-800/30 rounded-xl h-11 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-not-allowed border border-slate-200/80 dark:border-slate-700/60',
                              startAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 mr-2.5 flex items-center">
                                  <FuseSvgIcon size={18}>lucide:mail</FuseSvgIcon>
                                </div>
                              ),
                              endAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 ml-2 flex items-center">
                                  <FuseSvgIcon size={16}>lucide:lock</FuseSvgIcon>
                                </div>
                              ),
                            },
                          }}
                        />
                      </FormControl>
                    )}
                  />
                </div>
              </div>

              {/* Security & Privacy Notice Banner */}
              <div className="rounded-2xl border border-sky-100 dark:border-sky-900/40 bg-linear-to-r from-sky-50/70 via-blue-50/30 to-indigo-50/20 dark:from-slate-800/60 dark:to-slate-900/60 p-4 sm:p-5 flex items-start gap-4 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FuseSvgIcon size={20}>lucide:shield-check</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Security & Privacy Protection
                  </Typography>
                  <Typography className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Your profile name and avatar will appear across reports, notifications, and communications. Your data is encrypted and securely stored.
                  </Typography>
                </div>
              </div>
              </fieldset>
            </div>

            {/* Action Footer */}
            <div className="px-5 sm:px-8 py-4 bg-slate-50/80 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                {!canEdit ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <FuseSvgIcon size={14}>heroicons-outline:exclamation-circle</FuseSvgIcon>
                    Read-only mode (Save disabled)
                  </span>
                ) : _.isEmpty(dirtyFields) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <FuseSvgIcon size={14} className="text-emerald-500">heroicons-outline:check-circle</FuseSvgIcon>
                    All profile details are up to date
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved changes detected
                  </span>
                )}
              </div>

              <Button
                variant="contained"
                disabled={!canEdit || _.isEmpty(dirtyFields) || !isValid || isPending}
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl px-7 py-2.5 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all capitalize text-sm disabled:opacity-50 disabled:shadow-none"
                startIcon={
                  <FuseSvgIcon size={18}>
                    {isPending ? 'heroicons-outline:arrow-path' : 'lucide:save'}
                  </FuseSvgIcon>
                }
              >
                {!canEdit ? 'Save Disabled' : isPending ? 'Saving changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Paper>
      )}

      {/* TAB 1: Subscription (Sellers Only) */}
      {isSeller && activeTab === 1 && (
        <Paper
          elevation={0}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 md:px-8 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/10 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <FuseSvgIcon size={20}>lucide:credit-card</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Subscription & Billing
                  </Typography>
                  <Typography className="text-md text-slate-500 dark:text-slate-400">
                    Review your plan subscription, request quota usage, and download invoices.
                  </Typography>
                </div>
              </div>
              <div className="self-start sm:self-auto">
                <Chip
                  label={statusLabel}
                  size="small"
                  className={statusChipClass}
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 space-y-6">
            {/* Top Stats Grid: Active Plan Details (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Plan Card */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Plan
                  </span>
                  <FuseSvgIcon size={18} className="text-primary-600 dark:text-primary-400">
                    lucide:layers
                  </FuseSvgIcon>
                </div>
                <Typography className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {planName}
                </Typography>
                <Typography className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
                  {planPriceText}
                </Typography>
              </div>

              {/* Billing Cycle & Period */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Billing Cycle
                  </span>
                  <FuseSvgIcon size={18} className="text-slate-500">
                    lucide:calendar
                  </FuseSvgIcon>
                </div>
                <Typography className="text-base font-bold text-slate-900 dark:text-white">
                  {cycleText}
                </Typography>
                <Typography className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Auto-renews per cycle
                </Typography>
              </div>

              {/* Marketplaces Allowance */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Marketplaces
                  </span>
                  <FuseSvgIcon size={18} className="text-slate-500">
                    lucide:store
                  </FuseSvgIcon>
                </div>
                <Typography className="text-base font-bold text-slate-900 dark:text-white">
                  {marketplaces} {marketplaces === 1 ? 'Marketplace' : 'Marketplaces'}
                </Typography>
                <Typography className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Amazon store channels allowed
                </Typography>
              </div>

              {/* 4th Card: Expires At (Light Red Background) */}
              <div className="p-4 rounded-xl border border-red-200/80 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                    Expires At
                  </span>
                  <FuseSvgIcon size={18} className="text-red-600 dark:text-red-400">
                    lucide:calendar-clock
                  </FuseSvgIcon>
                </div>
                <Typography className="text-base font-bold text-red-950 dark:text-red-100 truncate">
                  {formattedExpiryDate}
                </Typography>
                <Typography className="text-xs font-semibold text-red-700/90 dark:text-red-400/90 mt-1 truncate">
                  {expirySubtitle}
                </Typography>
              </div>
            </div>

            {/* Request Usage Progress Bar Card */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <FuseSvgIcon size={18} className="text-amber-500">
                      lucide:zap
                    </FuseSvgIcon>
                    <Typography className="text-sm font-bold text-slate-900 dark:text-white">
                      Review Requests Quota
                    </Typography>
                  </div>
                  <Typography className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Monthly quota of automated review solicitations sent to buyers.
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {usedRequests.toLocaleString()} / {maxQuota.toLocaleString()}
                  </span>
                  <Chip
                    label={`${remainingRequests.toLocaleString()} remaining`}
                    size="small"
                    className={`font-semibold text-xs ${
                      usagePercent >= 90
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300'
                        : usagePercent >= 75
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                    }`}
                  />
                </div>
              </div>

              {/* Linear Progress */}
              <div className="w-full">
                <LinearProgress
                  variant="determinate"
                  value={usagePercent}
                  className="h-2.5 rounded-full"
                  sx={{
                    backgroundColor: 'rgba(226, 232, 240, 0.6)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 9999,
                      background:
                        usagePercent >= 90
                          ? 'linear-gradient(90deg, #f87171, #ef4444)'
                          : usagePercent >= 75
                          ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                          : 'linear-gradient(90deg, #10b981, #059669)',
                    },
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                <span>{usagePercent}% Used</span>
                <span>Reset every monthly billing cycle</span>
              </div>
            </div>

            {/* Invoice Download Action Box */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800/80 flex items-center justify-center text-primary-700 dark:text-primary-300 shrink-0">
                  <FuseSvgIcon size={22}>lucide:file-text</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-sm font-bold text-slate-900 dark:text-white">
                    Subscription Invoice & Receipt
                  </Typography>
                  <Typography className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Download an official PDF invoice containing payment details, billing address, and subscription summary.
                  </Typography>
                </div>
              </div>

              <Button
                variant="outlined"
                onClick={handleDownloadInvoice}
                className="shrink-0 font-semibold rounded-xl px-5 py-2.5 text-xs sm:text-sm border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800 shadow-2xs capitalize"
                startIcon={<FuseSvgIcon size={18}>lucide:download</FuseSvgIcon>}
              >
                Download Invoice (PDF)
              </Button>
            </div>
          </div>
        </Paper>
      )}
    </div>
  );
}

export default AccountTabView;
