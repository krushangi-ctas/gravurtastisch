'use client';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useEffect } from 'react';
import { useUpdatePassword } from '../../api/hooks/security/useUpdateSecuritySettings';
import FormControl from '@mui/material/FormControl';
import type { UpdatePasswordData } from '../../api/types';
import { useSnackbar } from 'notistack';
import _ from 'lodash';

const defaultValues: FormType = {
  currentPassword: '',
  password: '',
  passwordConfirm: '',
};

/**
 * Form Validation Schema
 */
const schema = z
  .object({
    currentPassword: z
      .string()
      .max(20, 'Current password must be at most 20 characters'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(20, 'Password must be at most 20 characters')
      .or(z.literal(''))
      .optional(),
    passwordConfirm: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // If password is provided, passwordConfirm must match
      if (data.password && data.password.length > 0) {
        return data.password === data.passwordConfirm;
      }
      return true;
    },
    {
      message: 'Passwords must match',
      path: ['passwordConfirm'],
    }
  );

type FormType = z.infer<typeof schema>;

function SecurityTabView() {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: updatePassword, isSuccess } = useUpdatePassword();

  const { control, reset, handleSubmit, formState } = useForm<FormType>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  useEffect(() => {
    reset({
      currentPassword: '',
      password: '',
      passwordConfirm: '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  /**
   * Form Submit
   */
  function onSubmit(formData: FormType) {
    // Structure the data according to API expectations - only password fields
    const updateData: UpdatePasswordData = {
      currentPassword: formData.currentPassword,
      password: formData.password,
      passwordConfirm: formData.passwordConfirm,
    };

    updatePassword(updateData, {
      onSettled: (data) => {
        if (
          data &&
          data.status === 200 &&
          data.data &&
          data.data.success !== false
        ) {
          // API succeeded
          enqueueSnackbar(
            data?.data?.message || 'Password updated successfully!',
            {
              variant: 'success',
              autoHideDuration: 2000,
            }
          );
        } else {
          // API responded but with error
          enqueueSnackbar(
            data?.data?.message ||
            'Failed to update password. Please try again.',
            {
              variant: 'error',
              autoHideDuration: 2000,
            }
          );
        }
      },
    });
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
                  <FuseSvgIcon size={20}>lucide:shield-alert</FuseSvgIcon>
                </div>
                <div>
                  <Typography className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Change Password
                  </Typography>
                  <Typography className="text-md text-slate-500 dark:text-slate-400">
                    Update your account password to keep your credentials secure.
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6">
            <div className="space-y-5">
              {/* Current Password Field */}
              <div className="flex flex-col">
                <label
                  htmlFor="currentPassword"
                  className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                >
                  Current Password <span className="text-slate-400 font-normal normal-case">(default: changeme)</span>
                </label>
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field }) => (
                    <FormControl className="w-full">
                      <TextField
                        {...field}
                        id="currentPassword"
                        type="password"
                        error={!!errors.currentPassword}
                        helperText={errors?.currentPassword?.message}
                        variant="outlined"
                        placeholder="Enter your current password"
                        fullWidth
                        inputProps={{ maxLength: 20 }}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* New Password Field */}
                <div className="flex flex-col">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                  >
                    New Password
                  </label>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <FormControl className="w-full">
                        <TextField
                          {...field}
                          id="password"
                          type="password"
                          error={!!errors.password}
                          variant="outlined"
                          placeholder="Min. 6 characters"
                          fullWidth
                          inputProps={{ maxLength: 20 }}
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-50/50 dark:bg-slate-800/50 rounded-xl h-11 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                              startAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 mr-2 flex items-center">
                                  <FuseSvgIcon size={18}>lucide:lock</FuseSvgIcon>
                                </div>
                              ),
                            },
                          }}
                          helperText={errors?.password?.message}
                        />
                      </FormControl>
                    )}
                  />
                </div>

                {/* Confirm New Password Field */}
                <div className="flex flex-col">
                  <label
                    htmlFor="passwordConfirm"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block"
                  >
                    Confirm New Password
                  </label>
                  <Controller
                    name="passwordConfirm"
                    control={control}
                    render={({ field }) => (
                      <FormControl className="w-full">
                        <TextField
                          {...field}
                          id="passwordConfirm"
                          type="password"
                          error={!!errors.passwordConfirm}
                          helperText={errors?.passwordConfirm?.message as string}
                          fullWidth
                          variant="outlined"
                          inputProps={{ maxLength: 20 }}
                          placeholder="Re-enter new password"
                          slotProps={{
                            input: {
                              className:
                                'bg-slate-50/50 dark:bg-slate-800/50 rounded-xl h-11 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                              startAdornment: (
                                <div className="text-slate-400 dark:text-slate-500 mr-2 flex items-center">
                                  <FuseSvgIcon size={18}>lucide:shield-check</FuseSvgIcon>
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
            </div>

            {/* Quick Security Tips Box */}
            <div className="rounded-lg border border-amber-100 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 flex items-start gap-3">
              <div className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                <FuseSvgIcon size={20}>lucide:info</FuseSvgIcon>
              </div>
              <div>
                <Typography className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Password Security Policy
                </Typography>
                <Typography className="text-md text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                  You can only change your password twice within 24 hours. Ensure your new password contains a mix of uppercase, lowercase, numbers, and special characters.
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
              disabled={_.isEmpty(dirtyFields) || !isValid}
              type="submit"
              className="w-full sm:w-auto bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-7 py-2.5 shadow-sm transition-all capitalize text-sm disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-800"
              startIcon={<FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
}

export default SecurityTabView;
