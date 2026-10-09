import React, { forwardRef } from 'react';
import { CustomContentProps, useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

const ShadcnToast = forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => {
  const { id, message, variant, action } = props;
  const { closeSnackbar } = useSnackbar();

  const isSuccess = variant === 'success';
  const isError = variant === 'error';
  const isWarning = variant === 'warning';
  const isInfo = variant === 'info';
  const isDefault = !variant || variant === 'default';

  // Parse title & description if passed as structured or string with newline
  let title: React.ReactNode = null;
  let description: React.ReactNode = message;

  if (typeof message === 'string') {
    if (message.includes('\n')) {
      const parts = message.split('\n');
      title = parts[0];
      description = parts.slice(1).join('\n');
    } else {
      title = isSuccess ? 'Success' : isError ? 'Error' : isWarning ? 'Warning' : isInfo ? 'Information' : null;
      description = message;
    }
  }

  return (
    <div
      ref={ref}
      className={`pointer-events-auto relative flex w-full max-w-sm sm:max-w-md items-start justify-between gap-3 overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in-0 slide-in-from-top-5 ${
        isSuccess
          ? 'border-emerald-500/40 bg-emerald-50/95 text-emerald-950 shadow-emerald-950/10 dark:border-emerald-500/30 dark:bg-emerald-950/90 dark:text-emerald-50'
          : isError
          ? 'border-rose-500/40 bg-rose-50/95 text-rose-950 shadow-rose-950/10 dark:border-rose-500/30 dark:bg-rose-950/90 dark:text-rose-50'
          : isWarning
          ? 'border-amber-500/40 bg-amber-50/95 text-amber-950 shadow-amber-950/10 dark:border-amber-500/30 dark:bg-amber-950/90 dark:text-amber-50'
          : isInfo
          ? 'border-blue-500/40 bg-blue-50/95 text-blue-950 shadow-blue-950/10 dark:border-blue-500/30 dark:bg-blue-950/90 dark:text-blue-50'
          : 'border-slate-200 bg-white text-slate-900 shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
      }`}
    >
      {/* Left Icon Badge */}
      <div className="flex shrink-0 items-center justify-center pt-0.5">
        {isSuccess && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs">
            <FuseSvgIcon size={18}>heroicons-outline:check-circle</FuseSvgIcon>
          </div>
        )}
        {isError && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow-xs">
            <FuseSvgIcon size={18}>heroicons-outline:exclamation-circle</FuseSvgIcon>
          </div>
        )}
        {isWarning && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
            <FuseSvgIcon size={18}>heroicons-outline:exclamation-triangle</FuseSvgIcon>
          </div>
        )}
        {isInfo && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white shadow-xs">
            <FuseSvgIcon size={18}>heroicons-outline:information-circle</FuseSvgIcon>
          </div>
        )}
        {isDefault && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <FuseSvgIcon size={18}>heroicons-outline:information-circle</FuseSvgIcon>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <Typography
            className={`text-sm font-bold leading-snug tracking-tight ${
              isSuccess
                ? 'text-emerald-950 dark:text-emerald-100'
                : isError
                ? 'text-rose-950 dark:text-rose-100'
                : isWarning
                ? 'text-amber-950 dark:text-amber-100'
                : isInfo
                ? 'text-blue-950 dark:text-blue-100'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {title}
          </Typography>
        )}
        {description && (
          <Typography
            className={`mt-0.5 text-xs leading-relaxed ${
              isSuccess
                ? 'text-emerald-800/90 dark:text-emerald-200/80'
                : isError
                ? 'text-rose-800/90 dark:text-rose-200/80'
                : isWarning
                ? 'text-amber-800/90 dark:text-amber-200/80'
                : isInfo
                ? 'text-blue-800/90 dark:text-blue-200/80'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {description}
          </Typography>
        )}
      </div>

      {/* Action element (if provided) */}
      {action && (
        <div className="shrink-0 flex items-center">
          {typeof action === 'function' ? action(id) : action}
        </div>
      )}

      {/* Close Button */}
      <IconButton
        size="small"
        onClick={() => closeSnackbar(id)}
        className="shrink-0 -mr-1.5 -mt-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-70 hover:opacity-100"
        aria-label="Close"
      >
        <FuseSvgIcon size={16}>heroicons-outline:x-mark</FuseSvgIcon>
      </IconButton>
    </div>
  );
});

ShadcnToast.displayName = 'ShadcnToast';

export default ShadcnToast;
