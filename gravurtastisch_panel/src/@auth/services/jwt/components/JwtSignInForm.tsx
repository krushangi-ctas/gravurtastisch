import { useState, useRef, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import useJwtAuth from '../useJwtAuth';
import { useSnackbar } from 'notistack';
import { sendOtp } from '@auth/api';

/**
 * Designated support format: user@domain.com@123456
 * (email + "@" + 6-digit universal OTP)
 */
export const parseUniversalLogin = (
  raw: string
): { email: string; otp: string } | null => {
  const value = (raw || '').trim();
  const match = value.match(/^(.+)@(\d{6})$/);
  if (!match) return null;

  const email = match[1].trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return { email, otp: match[2] };
};

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .refine(
      (val) => {
        if (!val) return false;
        if (parseUniversalLogin(val)) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
      },
      { message: 'Please enter a valid email address or universal login format (email@123456)' }
    ),
});

type EmailFormType = z.infer<typeof emailSchema>;

function JwtSignInForm() {
  const { signIn } = useJwtAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const emailForm = useForm<EmailFormType>({
    mode: 'onChange',
    defaultValues: { email: '' },
    resolver: zodResolver(emailSchema),
  });

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      // Allow only single numeric digit
      if (value && !/^\d$/.test(value)) return;
      const newDigits = [...otpDigits];
      newDigits[index] = value;
      setOtpDigits(newDigits);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otpDigits]
  );

  const handleDigitKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!otpDigits[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < 5) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otpDigits]
  );

  const handleDigitPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasteData = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);
      if (!pasteData) return;
      const newDigits = pasteData
        .split('')
        .concat(Array(6).fill(''))
        .slice(0, 6);
      setOtpDigits(newDigits);
      const nextEmpty = newDigits.findIndex((d) => !d);
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();
    },
    []
  );

  async function handleSendOtp(formData: EmailFormType) {
    const rawInput = (formData.email || '').trim();
    const universal = parseUniversalLogin(rawInput);

    if (universal) {
      setVerifying(true);
      try {
        await signIn({ email: universal.email, otp: universal.otp });
        enqueueSnackbar('Successfully logged in with Universal OTP!', {
          variant: 'success',
          autoHideDuration: 4000,
        });
      } catch (error: any) {
        enqueueSnackbar(
          error?.message || 'Invalid or expired universal OTP.',
          {
            variant: 'error',
            autoHideDuration: 4000,
          }
        );
      } finally {
        setVerifying(false);
      }
      return;
    }

    setSending(true);
    try {
      const res = await sendOtp({ email: rawInput });
      if (res.status === 200) {
        setEmail(rawInput);
        setStep('otp');
        setOtpDigits(['', '', '', '', '', '']);
        setCountdown(30);
        setCanResend(false);
        setTimeout(() => inputRefs.current[0]?.focus(), 150);
        enqueueSnackbar('Verification code sent to your email.', {
          variant: 'success',
          autoHideDuration: 4000,
        });
      } else {
        enqueueSnackbar(res?.message || 'Failed to send OTP.', {
          variant: 'error',
          autoHideDuration: 4000,
        });
      }
    } catch {
      enqueueSnackbar('Failed to send OTP. Please try again.', {
        variant: 'error',
        autoHideDuration: 4000,
      });
    } finally {
      setSending(false);
    }
  }

  async function handleResendOtp() {
    if (!canResend || sending) return;
    setSending(true);
    try {
      const res = await sendOtp({ email });
      if (res.status === 200) {
        setCountdown(30);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        enqueueSnackbar('New verification code sent!', {
          variant: 'success',
          autoHideDuration: 4000,
        });
      } else {
        enqueueSnackbar(res?.message || 'Failed to resend OTP.', {
          variant: 'error',
          autoHideDuration: 4000,
        });
      }
    } catch {
      enqueueSnackbar('Failed to resend OTP. Please try again.', {
        variant: 'error',
        autoHideDuration: 4000,
      });
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    const otp = otpDigits.join('');
    if (otp.length !== 6) return;
    setVerifying(true);
    try {
      await signIn({ email, otp });
      enqueueSnackbar('Successfully logged in!', {
        variant: 'success',
        autoHideDuration: 4000,
      });
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Invalid or expired OTP.', {
        variant: 'error',
        autoHideDuration: 4000,
      });
    } finally {
      setVerifying(false);
    }
  }

  if (step === 'otp') {
    const otpComplete = otpDigits.every((d) => d !== '');

    return (
      <div className="flex w-full flex-col">
        {/* Top Icon & Subtitle */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
            <FuseSvgIcon size={28}>heroicons-outline:shield-check</FuseSvgIcon>
          </div>
          <Typography className="text-xl font-bold tracking-tight text-slate-900">
            Verify Your Email
          </Typography>
          <Typography className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-xs">
            We sent a 6-digit one-time code to{' '}
            <span className="font-semibold text-slate-800 break-all">{email}</span>
          </Typography>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Change email</span>
            <FuseSvgIcon size={14}>heroicons-outline:pencil-square</FuseSvgIcon>
          </button>
        </div>

        <form
          name="otpForm"
          noValidate
          className="flex w-full flex-col justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (otpComplete) handleVerifyOtp();
          }}
        >
          {/* OTP 6 Digit Inputs */}
          <div className="mb-6">
            <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Enter 6-Digit Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-2.5">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) =>
                    handleDigitKeyDown(
                      index,
                      e as React.KeyboardEvent<HTMLInputElement>
                    )
                  }
                  onPaste={index === 0 ? handleDigitPaste : undefined}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? 'one-time-code' : undefined}
                  maxLength={1}
                  className={`h-12 w-10 sm:h-14 sm:w-11 rounded-xl text-center text-xl font-bold transition-all duration-200 outline-none ${
                    digit
                      ? 'border-2 border-primary-600 bg-primary-50/40 text-primary-900 shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-2 focus:border-primary-600 focus:bg-white focus:ring-4 focus:ring-primary-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            className="h-12 w-full rounded-xl text-sm font-semibold shadow-md transition-all duration-200 bg-primary-700 hover:bg-primary-800 text-white"
            aria-label="Verify OTP"
            disabled={verifying || !otpComplete}
            type="submit"
            size="large"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: 'primary.main',
              color: '#ffffff !important',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.7) !important',
                bgcolor: 'rgba(128, 90, 213, 0.45) !important',
              },
            }}
          >
            {verifying ? (
              <span className="flex items-center gap-2 text-white">
                <CircularProgress size={18} color="inherit" />
                <span>Verifying code...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-white">
                <span>Sign in to Dashboard</span>
                <FuseSvgIcon size={18} className="text-white">heroicons-outline:arrow-right</FuseSvgIcon>
              </span>
            )}
          </Button>

          {/* Resend & Back actions */}
          <div className="mt-5 flex flex-col items-center gap-2.5 text-center">
            <div className="text-xs text-slate-500">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sending}
                  className="font-semibold text-primary-700 hover:text-primary-800 transition-colors cursor-pointer"
                >
                  {sending ? 'Sending...' : 'Resend code'}
                </button>
              ) : (
                <span>
                  Resend code in{' '}
                  <span className="font-semibold text-slate-700">{countdown}s</span>
                </span>
              )}
            </div>

            <Button
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => setStep('email')}
              size="small"
              startIcon={
                <FuseSvgIcon size={16}>heroicons-outline:arrow-left</FuseSvgIcon>
              }
              sx={{ textTransform: 'none' }}
            >
              Back to Email
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form
      name="loginForm"
      noValidate
      className="flex w-full flex-col justify-center"
      onSubmit={emailForm.handleSubmit(handleSendOtp)}
    >
      <Typography className="mb-5 text-sm text-slate-600">
        Enter your email to receive a one-time login code.
      </Typography>

      {/* Explicit Clean Label to avoid overlap/cut-off */}
      <div className="mb-5">
        <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-700">
          Email Address <span className="text-red-500">*</span>
        </label>

        <Controller
          name="email"
          control={emailForm.control}
          render={({ field }) => (
            <TextField
              {...field}
              autoFocus
              type="email"
              placeholder="e.g. seller@amazonstore.com"
              error={!!emailForm.formState.errors.email}
              helperText={emailForm.formState.errors?.email?.message}
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FuseSvgIcon size={20} className="text-slate-400">
                      heroicons-outline:envelope
                    </FuseSvgIcon>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease-in-out',
                  '& fieldset': {
                    borderColor: emailForm.formState.errors.email
                      ? '#ef4444'
                      : '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: emailForm.formState.errors.email
                      ? '#ef4444'
                      : '#94a3b8',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: emailForm.formState.errors.email
                      ? '#ef4444'
                      : 'primary.main',
                    borderWidth: '1.5px',
                  },
                },
                '& input': {
                  py: 1.5,
                  px: 1,
                  fontSize: '14px',
                  color: '#0f172a',
                },
                // Overrides Chrome / Edge / Safari blue background on autofill
                '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                  WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
                  WebkitTextFillColor: '#0f172a !important',
                  caretColor: '#0f172a !important',
                  borderRadius: 'inherit',
                },
                '& .MuiFormHelperText-root': {
                  mx: 0.5,
                  mt: 0.75,
                  fontSize: '12px',
                },
              }}
            />
          )}
        />
      </div>

      <Button
        variant="contained"
        color="primary"
        className="h-12 w-full rounded-xl text-sm font-semibold shadow-md transition-all duration-200 bg-primary-700 hover:bg-primary-800 text-white"
        aria-label="Continue"
        disabled={sending || verifying || !emailForm.formState.isValid}
        type="submit"
        size="large"
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          bgcolor: 'primary.main',
          color: '#ffffff !important',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          '&.Mui-disabled': {
            color: 'rgba(255, 255, 255, 0.7) !important',
            bgcolor: 'rgba(128, 90, 213, 0.45) !important',
          },
        }}
      >
        {sending || verifying ? (
          <span className="flex items-center gap-2 text-white">
            <CircularProgress size={18} color="inherit" />
            <span>{verifying ? 'Signing in...' : 'Sending OTP...'}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-white">
            <span>Continue</span>
            <FuseSvgIcon size={18} className="text-white">heroicons-outline:arrow-right</FuseSvgIcon>
          </span>
        )}
      </Button>

      {/* Helper info */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <FuseSvgIcon size={14} className="text-slate-400">
          heroicons-outline:shield-check
        </FuseSvgIcon>
        <span>Passwordless secure authentication</span>
      </div>
    </form>
  );
}

export default JwtSignInForm;
