'use client';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import _ from 'lodash';
import { useEffect } from 'react';
import { useProfile } from '../../api/hooks/account/useAccountSettings';
import { useUpdateUser } from '../../api/hooks/account/useUpdateAccountSettings';
import FormControl from '@mui/material/FormControl';
import type { UpdateUserData } from '../../api/types';
import { useSnackbar } from 'notistack';
import { AccountSettingsSkeleton } from '@/components/skeletons/SettingsFormSkeleton';
import { Paper, Chip } from '@mui/material';

const defaultValues: FormType = {
  name: '',
  email: '',
  // phone: "",
};

/**
 * Form Validation Schema
 */
const schema = z.object({
  name: z
    .string()
    .nonempty('You must enter your name')
    .max(40, 'Name must be at most 40 characters'),
  email: z
    .string()
    .email('You must enter a valid email')
    .nonempty('Email is required'),
  // phone: z
  //   .string()
  //   .nonempty("You must enter your phone number")
  //   .max(20, "Phone number must be at most 20 characters")
  //   .regex(/^\d+$/, "Phone number must contain only numbers"),
});

type FormType = z.infer<typeof schema>;

function AccountTabView() {
  const { data: accountSettings, isLoading: isProfileLoading } = useProfile();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: updateAccountSettings, isPending } = useUpdateUser();

  const { control, handleSubmit, formState, setValue } = useForm<FormType>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  /**
   * Form Submit
   */
  function onSubmit(data: FormType) {
    // Structure the data according to API expectations
    const updateData: UpdateUserData = {
      name: data.name,
      email: data.email,
      // contact_no: data.phone,
    };

    updateAccountSettings(updateData, {
      onSuccess: (response) => {
        // Show success toast message with API response message
        enqueueSnackbar(response?.message || 'Profile updated successfully!', {
          variant: 'success',
          autoHideDuration: 2000,
        });
      },
      onError: (error) => {
        // Show error toast message with API error message
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

  useEffect(() => {
    if (accountSettings?.data) {
      setValue('name', accountSettings?.data?.name || '');
      setValue('email', accountSettings?.data?.email || '');
    }
  }, [accountSettings, setValue]);

  if (isProfileLoading) {
    return <AccountSettingsSkeleton />;
  }

  return (
    <div className="w-full">
      <Paper
        elevation={0}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Header Section */}
          <div className="px-4 sm:px-6 md:px-8 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/10 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <FuseSvgIcon size={20}>lucide:circle-user</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Personal Information
                  </Typography>
                  <Typography className="text-md text-slate-500 dark:text-slate-400">
                    Update your personal profile details and contact information.
                  </Typography>
                </div>
              </div>
              <div className="self-start sm:self-auto">
                <Chip
                  label="Active Account"
                  size="small"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700 text-xs px-2.5 py-0.5"
                />
              </div>
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name Field */}
              <div className="flex flex-col">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                >
                  Full Name <span className="text-red-500">*</span>
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
                        inputProps={{ maxLength: 40 }}
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

              {/* Email Field */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-100 block"
                  >
                    Email Address
                  </label>
                  <span className="text-md text-slate-400 font-medium">Primary Login</span>
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
                              'bg-slate-100/70 dark:bg-slate-800/30 rounded-xl h-11 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-not-allowed',
                            startAdornment: (
                              <div className="text-slate-400 dark:text-slate-500 mr-2 flex items-center">
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
              {/* <div className="sm:col-span-4">
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <FormControl className="w-full">
                    <FormLabel htmlFor="phone">Phone Number</FormLabel>
                    <TextField
                      {...field}
                      id="phone"
                      type="tel"
                      placeholder="Phone Number"
                      variant="outlined"
                      fullWidth
                      inputProps={{
                        maxLength: 20,
                        pattern: "[0-9]*",
                        inputMode: "numeric",
                      }}
                      error={!!errors.phone}
                      helperText={errors?.phone?.message}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(value);
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <FuseSvgIcon color="action">
                              lucide:phone
                            </FuseSvgIcon>
                          ),
                        },
                      }}
                    />
                  </FormControl>
                )}
              />
            </div> */}
            </div>

            {/* Quick Tips Box */}
            <div className="rounded-lg border border-primary-100 dark:border-primary-900/50 bg-primary-50/70 dark:bg-primary-950/30 p-3.5 flex items-start gap-3">
              <div className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0">
                <FuseSvgIcon size={20}>lucide:shield-check</FuseSvgIcon>
              </div>
              <div>
                <Typography className="text-sm font-bold text-primary-950 dark:text-primary-200">
                  Security & Privacy
                </Typography>
                <Typography className="text-md text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                  Your profile name will appear in reports, notifications, and customer support communications. Your data is encrypted and securely stored.
                </Typography>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-4 sm:px-6 md:px-8 py-4 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Typography className="text-md text-slate-500 dark:text-slate-400 text-center sm:text-left">
              {_.isEmpty(dirtyFields) ? 'No changes to save' : 'Unsaved changes detected'}
            </Typography>

            <Button
              variant="contained"
              disabled={_.isEmpty(dirtyFields) || !isValid || isPending}
              type="submit"
              className="w-full sm:w-auto bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-7 py-2.5 shadow-sm transition-all capitalize text-sm disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-800"
              startIcon={
                <FuseSvgIcon size={18}>
                  {isPending ? 'heroicons-outline:arrow-path' : 'lucide:save'}
                </FuseSvgIcon>
              }
            >
              {isPending ? 'Saving changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
}

export default AccountTabView;
