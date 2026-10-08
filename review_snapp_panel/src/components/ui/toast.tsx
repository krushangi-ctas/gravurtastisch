import React from 'react';
import { enqueueSnackbar, closeSnackbar } from 'notistack';

export type ToastVariant = 'default' | 'success' | 'destructive' | 'error' | 'warning' | 'info';

export interface ToastActionProps {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export interface ToastOptions {
  title?: string;
  description?: React.ReactNode;
  variant?: ToastVariant;
  actionProps?: ToastActionProps;
  duration?: number;
}

export const toast = {
  add(options: ToastOptions | string) {
    if (typeof options === 'string') {
      return enqueueSnackbar(options, { variant: 'default' });
    }

    const { title, description, variant = 'default', actionProps, duration = 4000 } = options;
    const notistackVariant = variant === 'destructive' ? 'error' : variant;

    let messageText = description;
    if (title && description) {
      messageText = `${title}\n${description}`;
    } else if (title && !description) {
      messageText = title;
    }

    const action = actionProps ? (
      <button
        type="button"
        onClick={actionProps.onClick}
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs cursor-pointer ${
          notistackVariant === 'success'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : notistackVariant === 'error'
            ? 'bg-rose-600 hover:bg-rose-700 text-white'
            : notistackVariant === 'warning'
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-slate-900 hover:bg-slate-800 text-white'
        } ${actionProps.className || ''}`}
      >
        {actionProps.children}
      </button>
    ) : undefined;

    return enqueueSnackbar(messageText as any, {
      variant: notistackVariant as any,
      autoHideDuration: duration,
      action,
    });
  },

  success(titleOrMessage: string | ToastOptions, description?: React.ReactNode) {
    if (typeof titleOrMessage === 'string') {
      return toast.add({ title: titleOrMessage, description, variant: 'success' });
    }
    return toast.add({ ...titleOrMessage, variant: 'success' });
  },

  error(titleOrMessage: string | ToastOptions, description?: React.ReactNode) {
    if (typeof titleOrMessage === 'string') {
      return toast.add({ title: titleOrMessage, description, variant: 'error' });
    }
    return toast.add({ ...titleOrMessage, variant: 'error' });
  },

  warning(titleOrMessage: string | ToastOptions, description?: React.ReactNode) {
    if (typeof titleOrMessage === 'string') {
      return toast.add({ title: titleOrMessage, description, variant: 'warning' });
    }
    return toast.add({ ...titleOrMessage, variant: 'warning' });
  },

  info(titleOrMessage: string | ToastOptions, description?: React.ReactNode) {
    if (typeof titleOrMessage === 'string') {
      return toast.add({ title: titleOrMessage, description, variant: 'info' });
    }
    return toast.add({ ...titleOrMessage, variant: 'info' });
  },

  close(key?: string | number) {
    closeSnackbar(key);
  },

  dismiss(key?: string | number) {
    closeSnackbar(key);
  },
};

export default toast;
