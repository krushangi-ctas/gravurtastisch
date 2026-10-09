import * as React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "destructive" | "error" | "warning" | "info";

export interface ToastActionProps {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export interface ToastData {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  actionProps?: ToastActionProps;
  duration?: number;
  open?: boolean;
}

type ToastState = {
  toasts: ToastData[];
};

type ToastListener = (state: ToastState) => void;

let memoryState: ToastState = { toasts: [] };
const listeners: ToastListener[] = [];

function dispatch(action: { type: "ADD_TOAST"; toast: ToastData } | { type: "DISMISS_TOAST"; toastId?: string } | { type: "REMOVE_TOAST"; toastId?: string }) {
  if (action.type === "ADD_TOAST") {
    memoryState = {
      toasts: [action.toast, ...memoryState.toasts].slice(0, 5),
    };
  } else if (action.type === "DISMISS_TOAST") {
    memoryState = {
      toasts: memoryState.toasts.map((t) =>
        t.id === action.toastId || action.toastId === undefined
          ? { ...t, open: false }
          : t
      ),
    };
  } else if (action.type === "REMOVE_TOAST") {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
    };
  }
  listeners.forEach((listener) => listener(memoryState));
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return `toast-${count}-${Date.now()}`;
}

export const toast = {
  add(props: Omit<ToastData, "id" | "open">): string {
    const id = genId();
    const duration = props.duration ?? 4500;
    const newToast: ToastData = {
      ...props,
      id,
      open: true,
    };

    dispatch({ type: "ADD_TOAST", toast: newToast });

    if (duration > 0) {
      setTimeout(() => {
        toast.close(id);
      }, duration);
    }

    return id;
  },
  success(titleOrProps: string | Omit<ToastData, "id" | "open" | "variant">, description?: React.ReactNode) {
    if (typeof titleOrProps === "string") {
      return toast.add({ title: titleOrProps, description, variant: "success" });
    }
    return toast.add({ ...titleOrProps, variant: "success" });
  },
  error(titleOrProps: string | Omit<ToastData, "id" | "open" | "variant">, description?: React.ReactNode) {
    if (typeof titleOrProps === "string") {
      return toast.add({ title: titleOrProps, description, variant: "error" });
    }
    return toast.add({ ...titleOrProps, variant: "error" });
  },
  warning(titleOrProps: string | Omit<ToastData, "id" | "open" | "variant">, description?: React.ReactNode) {
    if (typeof titleOrProps === "string") {
      return toast.add({ title: titleOrProps, description, variant: "warning" });
    }
    return toast.add({ ...titleOrProps, variant: "warning" });
  },
  info(titleOrProps: string | Omit<ToastData, "id" | "open" | "variant">, description?: React.ReactNode) {
    if (typeof titleOrProps === "string") {
      return toast.add({ title: titleOrProps, description, variant: "info" });
    }
    return toast.add({ ...titleOrProps, variant: "info" });
  },
  close(id?: string) {
    dispatch({ type: "DISMISS_TOAST", toastId: id });
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", toastId: id });
    }, 200);
  },
  dismiss(id?: string) {
    toast.close(id);
  },
};

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toasts: state.toasts,
    toast,
    dismiss: toast.close,
  };
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      tabIndex={-1}
      className="fixed top-0 right-0 z-[9999] flex max-h-screen w-full flex-col p-4 sm:top-0 sm:right-0 md:max-w-[420px] gap-2.5 pointer-events-none"
    >
      {toasts.map((t) => {
        const variant = t.variant || "default";
        const isSuccess = variant === "success";
        const isError = variant === "error" || variant === "destructive";
        const isWarning = variant === "warning";
        const isInfo = variant === "info";

        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-xl border p-4 shadow-xl transition-all duration-300 animate-in fade-in-0 slide-in-from-top-5",
              t.open === false && "opacity-0 scale-95 transition-opacity duration-200",
              // Default Variant
              variant === "default" &&
                "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 shadow-slate-900/10",
              // Success (Green theme)
              isSuccess &&
                "bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-100 border-emerald-500/40 dark:border-emerald-500/30 shadow-emerald-950/10",
              // Error / Destructive / Alert (Red theme)
              isError &&
                "bg-rose-50/95 dark:bg-rose-950/90 text-rose-950 dark:text-rose-100 border-rose-500/40 dark:border-rose-500/30 shadow-rose-950/10",
              // Warning / Alert (Amber theme)
              isWarning &&
                "bg-amber-50/95 dark:bg-amber-950/90 text-amber-950 dark:text-amber-100 border-amber-500/40 dark:border-amber-500/30 shadow-amber-950/10",
              // Info (Blue theme)
              isInfo &&
                "bg-blue-50/95 dark:bg-blue-950/90 text-blue-950 dark:text-blue-100 border-blue-500/40 dark:border-blue-500/30 shadow-blue-950/10"
            )}
          >
            {/* Left Status Icon */}
            <div className="flex shrink-0 items-center justify-center pt-0.5">
              {isSuccess && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                </div>
              )}
              {isError && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow-xs">
                  <AlertCircle className="h-4 w-4 stroke-[2.5]" />
                </div>
              )}
              {isWarning && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                  <AlertTriangle className="h-4 w-4 stroke-[2.5]" />
                </div>
              )}
              {isInfo && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white shadow-xs">
                  <Info className="h-4 w-4 stroke-[2.5]" />
                </div>
              )}
              {variant === "default" && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Info className="h-4 w-4 stroke-[2]" />
                </div>
              )}
            </div>

            {/* Content: Title & Description */}
            <div className="flex-1 min-w-0 pr-2">
              {t.title && (
                <div
                  className={cn(
                    "text-sm font-bold leading-snug tracking-tight",
                    isSuccess && "text-emerald-950 dark:text-emerald-100",
                    isError && "text-rose-950 dark:text-rose-100",
                    isWarning && "text-amber-950 dark:text-amber-100",
                    isInfo && "text-blue-950 dark:text-blue-100",
                    variant === "default" && "text-slate-900 dark:text-slate-100"
                  )}
                >
                  {t.title}
                </div>
              )}
              {t.description && (
                <div
                  className={cn(
                    "mt-1 text-xs leading-relaxed",
                    isSuccess && "text-emerald-800/90 dark:text-emerald-200/80",
                    isError && "text-rose-800/90 dark:text-rose-200/80",
                    isWarning && "text-amber-800/90 dark:text-amber-200/80",
                    isInfo && "text-blue-800/90 dark:text-blue-200/80",
                    variant === "default" && "text-slate-600 dark:text-slate-400"
                  )}
                >
                  {t.description}
                </div>
              )}
            </div>

            {/* Action / Undo Button */}
            {t.actionProps && (
              <button
                type="button"
                onClick={(e) => {
                  t.actionProps?.onClick(e);
                }}
                className={cn(
                  "shrink-0 inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer",
                  isSuccess && "bg-emerald-600 hover:bg-emerald-700 text-white",
                  isError && "bg-rose-600 hover:bg-rose-700 text-white",
                  isWarning && "bg-amber-600 hover:bg-amber-700 text-white",
                  isInfo && "bg-blue-600 hover:bg-blue-700 text-white",
                  variant === "default" && "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                )}
              >
                {t.actionProps.children}
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
