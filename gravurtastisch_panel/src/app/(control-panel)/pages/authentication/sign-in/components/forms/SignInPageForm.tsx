'use client';
import { Controller, useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FormLabel from '@mui/material/FormLabel';
import Tooltip from '@mui/material/Tooltip';

/**
 * Form Validation Schema
 */
const getSignInSchema = (t: any) =>
	z.object({
		email: z.string().email(t('auth.emailInvalid', 'You must enter a valid email')).nonempty(t('auth.emailRequired', 'Email is required!')),
		password: z
			.string()
			.min(8, t('auth.passwordTooShort', 'Password is too short - must be at least 8 chars.'))
			.nonempty(t('auth.passwordRequired', 'Password is required!')),
		remember: z.boolean().optional()
	});

type FormType = {
	email: string;
	password: string;
	remember?: boolean;
};

const defaultValues = {
	email: '',
	password: '',
	remember: true
};

function SignInPageForm() {
	const { t } = useTranslation();
	const schema = useMemo(() => getSignInSchema(t), [t]);
	const { control, formState, handleSubmit, reset } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema as any)
	});

	const { isValid, dirtyFields, errors } = formState;

	function onSubmit() {
		reset(defaultValues);
	}

	return (
		<form
			name="loginForm"
			noValidate
			className="flex w-full flex-col justify-center gap-4"
			onSubmit={handleSubmit(onSubmit)}
		>
			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<FormControl>
						<FormLabel htmlFor="email">Email address</FormLabel>
						<TextField
							{...field}
							autoFocus
							type="email"
							error={!!errors.email}
							helperText={errors?.email?.message}
							required
							fullWidth
						/>
					</FormControl>
				)}
			/>

			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<FormControl>
						<FormLabel htmlFor="password">Password</FormLabel>
						<TextField
							{...field}
							type="password"
							error={!!errors.password}
							helperText={errors?.password?.message}
							required
							fullWidth
						/>
					</FormControl>
				)}
			/>

			<div className="flex flex-col items-center justify-center sm:flex-row sm:justify-between">
				<Controller
					name="remember"
					control={control}
					render={({ field }) => (
						<FormControl>
							<FormControlLabel
								label="Remember me"
								control={
									<Checkbox
										size="medium"
										{...field}
									/>
								}
							/>
						</FormControl>
					)}
				/>
			</div>

			<Tooltip title={t('header.signIn', 'Sign In')} arrow>
				<span>
					<Button
						variant="contained"
						color="primary"
						className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold"
						aria-label={t('header.signIn', 'Sign In')}
						disabled={_.isEmpty(dirtyFields) || !isValid}
						type="submit"
						size="medium"
						sx={{
							bgcolor: 'primary.main',
							color: '#ffffff !important',
							'&:hover': { bgcolor: 'primary.dark' }
						}}
					>
						{t('header.signIn', 'Sign in')}
					</Button>
				</span>
			</Tooltip>

			<div className="flex items-center py-4">
				<div className="mt-px flex-auto border-t" />
				<Typography
					className="mx-2"
					color="text.secondary"
				>
					Or continue with
				</Typography>
				<div className="mt-px flex-auto border-t" />
			</div>

			<div className="flex items-center gap-4">
				<Button
					variant="outlined"
					className="flex-auto"
				>
					<FuseSvgIcon
						size={20}
						color="action"
					>
						feather:facebook
					</FuseSvgIcon>
				</Button>
				<Button
					variant="outlined"
					className="flex-auto"
				>
					<FuseSvgIcon
						size={20}
						color="action"
					>
						feather:twitter
					</FuseSvgIcon>
				</Button>
				<Button
					variant="outlined"
					className="flex-auto"
				>
					<FuseSvgIcon
						size={20}
						color="action"
					>
						feather:github
					</FuseSvgIcon>
				</Button>
			</div>
		</form>
	);
}

export default SignInPageForm;
