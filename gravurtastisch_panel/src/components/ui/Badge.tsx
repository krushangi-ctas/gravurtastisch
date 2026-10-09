import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-primary-700 text-white shadow-xs hover:bg-primary-800',
    secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100',
    destructive: 'border-transparent bg-red-500 text-white shadow-xs hover:bg-red-600 dark:bg-red-900 dark:text-red-100',
    outline: 'border-slate-200 text-slate-950 dark:border-slate-800 dark:text-slate-50',
    success: 'border-transparent bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300',
    warning: 'border-transparent bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
        variantStyles,
        className
      )}
      {...props}
    />
  );
}
