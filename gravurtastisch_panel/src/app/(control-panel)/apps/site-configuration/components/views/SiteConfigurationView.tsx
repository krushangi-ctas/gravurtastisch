'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller as HookFormController } from 'react-hook-form';

const Controller = HookFormController as React.ComponentType<any>;
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import NavbarToggleButton from '@/components/theme-layouts/components/navbar/NavbarToggleButton';
import {
	Typography,
	Paper,
	TextField,
	InputAdornment,
	CircularProgress,
	Tooltip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import AccessDeniedView from '@/components/AccessDeniedView';
import usePermissions from '@/hooks/usePermissions';
import SiteConfigurationSkeleton from '@/components/skeletons/SiteConfigurationSkeleton';
import {
	useWebsiteConfiguration,
	useUpdateWebsiteConfiguration
} from '../../api/hooks/useSiteConfiguration';

const isValidUrl = (val?: string) => {
	if (!val || !val.trim()) return true;
	try {
		const parsed = new URL(val.trim());
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
};

const isValidEmail = (val?: string) => {
	if (!val || !val.trim()) return true;
	return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
};

const isValidPhone = (val?: string) => {
	if (!val || !val.trim()) return true;
	const trimmed = val.trim();
	const allowedChars = /^[+0-9\s\-()]{10,20}$/.test(trimmed);
	const digitCount = trimmed.replace(/\D/g, '').length;
	return allowedChars && digitCount >= 10 && digitCount <= 20;
};

const isValidPostalCode = (val?: string) => {
	if (!val || !val.trim()) return true;
	return /^[A-Za-z0-9\s\-]{3,20}$/.test(val.trim());
};

const siteConfigSchema = z.object({
	company: z.object({
		name: z
			.string({ required_error: 'Company name is required' })
			.trim()
			.min(2, 'Company name must be at least 2 characters')
			.max(100, 'Company name must not exceed 100 characters'),
		website: z
			.string()
			.max(150, 'Website URL must not exceed 150 characters')
			.refine(isValidUrl, {
				message: 'Please enter a valid website URL (e.g. https://example.com)'
			})
			.optional()
			.or(z.literal('')),
		tagline: z
			.string()
			.max(150, 'Tagline must not exceed 150 characters')
			.optional()
			.or(z.literal('')),
		about: z
			.string()
			.max(1000, 'About description must not exceed 1000 characters')
			.optional()
			.or(z.literal('')),
		copyright_text: z
			.string()
			.max(150, 'Copyright text must not exceed 150 characters')
			.optional()
			.or(z.literal(''))
	}),
	contact: z.object({
		email: z
			.string()
			.max(100, 'Email address must not exceed 100 characters')
			.refine(isValidEmail, {
				message: 'Please enter a valid email address (e.g. info@example.com)'
			})
			.optional()
			.or(z.literal('')),
		phone: z
			.string()
			.max(20, 'Phone number must not exceed 20 characters')
			.refine(isValidPhone, {
				message: 'Please enter a valid phone number (10 to 20 digits, +, spaces, hyphens only)'
			})
			.optional()
			.or(z.literal('')),
		address: z
			.string()
			.max(255, 'Street address must not exceed 255 characters')
			.optional()
			.or(z.literal('')),
		city: z
			.string()
			.max(100, 'City must not exceed 100 characters')
			.optional()
			.or(z.literal('')),
		state: z
			.string()
			.max(100, 'State/Province must not exceed 100 characters')
			.optional()
			.or(z.literal('')),
		country: z
			.string()
			.max(100, 'Country must not exceed 100 characters')
			.optional()
			.or(z.literal('')),
		postal_code: z
			.string()
			.max(20, 'Postal code must not exceed 20 characters')
			.refine(isValidPostalCode, {
				message: 'Please enter a valid postal/ZIP code (3-20 letters/numbers)'
			})
			.optional()
			.or(z.literal('')),
		working_hours: z
			.string()
			.max(100, 'Working hours must not exceed 100 characters')
			.optional()
			.or(z.literal('')),
		timezone: z
			.string()
			.max(60, 'Timezone must not exceed 60 characters')
			.optional()
			.or(z.literal(''))
	}),
	social_links: z.object({
		facebook: z
			.string()
			.max(200, 'Facebook URL must not exceed 200 characters')
			.refine(isValidUrl, {
				message: 'Please enter a valid Facebook URL (e.g. https://facebook.com/page)'
			})
			.optional()
			.or(z.literal('')),
		instagram: z
			.string()
			.max(200, 'Instagram URL must not exceed 200 characters')
			.refine(isValidUrl, {
				message: 'Please enter a valid Instagram URL (e.g. https://instagram.com/profile)'
			})
			.optional()
			.or(z.literal('')),
		linkedin: z
			.string()
			.max(200, 'LinkedIn URL must not exceed 200 characters')
			.refine(isValidUrl, {
				message: 'Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/profile)'
			})
			.optional()
			.or(z.literal('')),
		youtube: z
			.string()
			.max(200, 'YouTube URL must not exceed 200 characters')
			.refine(isValidUrl, {
				message: 'Please enter a valid YouTube URL (e.g. https://youtube.com/@channel)'
			})
			.optional()
			.or(z.literal(''))
	})
});

export type SiteConfigFormType = z.infer<typeof siteConfigSchema>;

const defaultValues: SiteConfigFormType = {
	company: {
		name: '',
		website: '',
		tagline: '',
		about: '',
		copyright_text: ''
	},
	contact: {
		email: '',
		phone: '',
		address: '',
		city: '',
		state: '',
		country: '',
		postal_code: '',
		working_hours: '',
		timezone: ''
	},
	social_links: {
		facebook: '',
		instagram: '',
		linkedin: '',
		youtube: ''
	}
};

type SiteConfigurationViewProps = {
	isInsideSettings?: boolean;
};

function SiteConfigurationView({ isInsideSettings = false }: SiteConfigurationViewProps = {}) {
	const { canView, canUpdate } = usePermissions();
	const hasAccess =
		canView('/settings/site-configuration') ||
		canView('site-configuration');
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const canMutate =
		canUpdate('/settings/site-configuration') ||
		canUpdate('site-configuration');
	const { enqueueSnackbar } = useSnackbar();
	const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);

	const {
		data: configResponse,
		isLoading: isConfigLoading,
		refetch,
		isRefetching
	} = useWebsiteConfiguration(hasAccess);
	const updateMutation = useUpdateWebsiteConfiguration();

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty, isValid }
	} = useForm<SiteConfigFormType>({
		defaultValues,
		mode: 'onChange',
		resolver: zodResolver(siteConfigSchema)
	});

	// Populate form when data is loaded
	useEffect(() => {
		if (configResponse?.data) {
			const { company, contact, social_links } = configResponse.data;
			reset({
				company: {
					name: company?.name || '',
					website: company?.website || '',
					tagline: company?.tagline || '',
					about: company?.about || '',
					copyright_text: company?.copyright_text || ''
				},
				contact: {
					email: contact?.email || '',
					phone: contact?.phone || '',
					address: contact?.address || '',
					city: contact?.city || '',
					state: contact?.state || '',
					country: contact?.country || '',
					postal_code: contact?.postal_code || '',
					working_hours: contact?.working_hours || '',
					timezone: contact?.timezone || ''
				},
				social_links: {
					facebook: social_links?.facebook || '',
					instagram: social_links?.instagram || '',
					linkedin: social_links?.linkedin || '',
					youtube: social_links?.youtube || ''
				}
			});
		}
	}, [configResponse, reset]);

	if (!hasAccess) {
		return <AccessDeniedView sectionTitle="Site Configuration" />;
	}

	const onSubmit = async (data: SiteConfigFormType) => {
		try {
			const res = await updateMutation.mutateAsync(data);
			enqueueSnackbar(res?.message || 'Site configuration updated successfully!', {
				variant: 'success',
				autoHideDuration: 2500
			});
			reset(data); // Clear dirty state
		} catch (error: any) {
			console.error('Error updating site configuration:', error);
			enqueueSnackbar(
				error?.message || 'Failed to update site configuration. Please try again.',
				{
					variant: 'error',
					autoHideDuration: 3000
				}
			);
		}
	};

	const handleReset = () => {
		if (configResponse?.data) {
			const { company, contact } = configResponse.data;
			reset({
				company: {
					name: company?.name || '',
					website: company?.website || '',
					tagline: company?.tagline || '',
					about: company?.about || '',
					copyright_text: company?.copyright_text || ''
				},
				contact: {
					email: contact?.email || '',
					phone: contact?.phone || '',
					address: contact?.address || '',
					city: contact?.city || '',
					state: contact?.state || '',
					country: contact?.country || '',
					postal_code: contact?.postal_code || '',
					working_hours: contact?.working_hours || '',
					timezone: contact?.timezone || ''
				}
			});
			enqueueSnackbar('Changes reverted to saved state.', {
				variant: 'info',
				autoHideDuration: 1500
			});
		}
	};

	const actionButtons = (
		<div className="flex items-center gap-2 w-full lg:w-auto justify-start sm:justify-end flex-wrap sm:flex-nowrap shrink-0">
			<Tooltip title="Reload configuration" arrow>
				<button
					type="button"
					onClick={() => refetch()}
					disabled={isRefetching}
					style={{ height: '32px', width: '32px' }}
					className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-xs cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 disabled:opacity-50"
				>
					<FuseSvgIcon
						size={16}
						className={`text-slate-700 dark:text-slate-200 ${isRefetching ? 'animate-spin' : ''}`}
					>
						heroicons-outline:arrow-path
					</FuseSvgIcon>
				</button>
			</Tooltip>

			<button
				type="button"
				onClick={handleReset}
				disabled={!canMutate || !isDirty || updateMutation.isPending}
				style={{ height: '32px' }}
				className="h-8 flex-1 sm:flex-initial px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
			>
				<span>Discard Changes</span>
			</button>

			<button
				type="button"
				onClick={handleSubmit(onSubmit)}
				disabled={!canMutate || !isDirty || !isValid || updateMutation.isPending}
				style={{ height: '32px' }}
				className="h-8 flex-1 sm:flex-initial px-3.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border-0 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
			>
				{updateMutation.isPending ? (
					<CircularProgress size={14} color="inherit" />
				) : (
					<FuseSvgIcon size={15} className="text-white">
						lucide:save
					</FuseSvgIcon>
				)}
				<span>{updateMutation.isPending ? 'Saving...' : 'Save Configuration'}</span>
			</button>
		</div>
	);

	const segmentedTabs = (
		<div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-fit max-w-full overflow-x-auto custom-table-scrollbar">
			<button
				type="button"
				onClick={() => setActiveTab(0)}
				className={`h-8 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border-0 ${activeTab === 0
					? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-xs'
					: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
					}`}
			>
				<FuseSvgIcon size={15}>lucide:briefcase</FuseSvgIcon>
				<span>Company Details</span>
				{Boolean(errors.company && Object.keys(errors.company).length > 0) && (
					<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
				)}
			</button>

			<button
				type="button"
				onClick={() => setActiveTab(1)}
				className={`h-8 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border-0 ${activeTab === 1
					? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-xs'
					: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
					}`}
			>
				<FuseSvgIcon size={15}>lucide:map-pin</FuseSvgIcon>
				<span>Contact & Location</span>
				{Boolean(errors.contact && Object.keys(errors.contact).length > 0) && (
					<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
				)}
			</button>

			<button
				type="button"
				onClick={() => setActiveTab(2)}
				className={`h-8 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border-0 ${activeTab === 2
					? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-xs'
					: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
					}`}
			>
				<FuseSvgIcon size={15}>lucide:share-2</FuseSvgIcon>
				<span>Social Media Links</span>
				{Boolean(errors.social_links && Object.keys(errors.social_links).length > 0) && (
					<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
				)}
			</button>
		</div>
	);

	return (
		<div className="w-full flex flex-col min-h-0">
				{isConfigLoading ? (
					<SiteConfigurationSkeleton />
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 pb-10">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							{segmentedTabs}
							{actionButtons}
						</div>

						{/* TAB 0: Company Details */}
						{activeTab === 0 && (
							<Paper
								elevation={0}
								className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
							>
								<div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
									<div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
										<FuseSvgIcon size={16}>lucide:briefcase</FuseSvgIcon>
									</div>
									<div>
										<Typography className="text-[15px] font-bold text-slate-900 dark:text-white">
											Company Details
										</Typography>
										<Typography className="text-[12px] text-slate-500 dark:text-slate-400">
											General identity, official name, website link, and copyright notice
										</Typography>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
									{/* Company Name */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Company Name <span className="text-red-500">*</span>
										</label>
										<Controller
											name="company.name"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. Gravurtastisch"
													inputProps={{ maxLength: 100 }}
													error={Boolean(errors.company?.name)}
													helperText={errors.company?.name?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:building
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Website URL */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Website URL
										</label>
										<Controller
											name="company.website"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. https://gravurtastisch.com"
													inputProps={{ maxLength: 150 }}
													error={Boolean(errors.company?.website)}
													helperText={errors.company?.website?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:globe
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Tagline */}
									<div className="md:col-span-2">
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Tagline
										</label>
										<Controller
											name="company.tagline"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. Automated Amazon buyer review requests built on official SP-API"
													inputProps={{ maxLength: 150 }}
													error={Boolean(errors.company?.tagline)}
													helperText={errors.company?.tagline?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:sparkles
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* About / Description */}
									<div className="md:col-span-2">
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											About / Description
										</label>
										<Controller
											name="company.about"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													multiline
													rows={3}
													placeholder="Write a short summary about the company and its services..."
													inputProps={{ maxLength: 1000 }}
													error={Boolean(errors.company?.about)}
													helperText={errors.company?.about?.message}
													InputProps={{
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium p-2.5'
													}}
												/>
											)}
										/>
									</div>

									{/* Copyright Text */}
									<div className="md:col-span-2">
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Copyright Text
										</label>
										<Controller
											name="company.copyright_text"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. © 2026 Gravurtastisch. All rights reserved."
													inputProps={{ maxLength: 150 }}
													error={Boolean(errors.company?.copyright_text)}
													helperText={errors.company?.copyright_text?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:shield-check
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>
								</div>
							</Paper>
						)}

						{/* TAB 1: Contact & Location */}
						{activeTab === 1 && (
							<Paper
								elevation={0}
								className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
							>
								<div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
									<div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
										<FuseSvgIcon size={16}>lucide:map-pin</FuseSvgIcon>
									</div>
									<div>
										<Typography className="text-[15px] font-bold text-slate-900 dark:text-white">
											Contact & Location Details
										</Typography>
										<Typography className="text-[12px] text-slate-500 dark:text-slate-400">
											Public contact email, customer support phone, business address, and operational hours
										</Typography>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
									{/* Email */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Official Email Address
										</label>
										<Controller
											name="contact.email"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. info@gravurtastisch.com"
													inputProps={{ maxLength: 100 }}
													error={Boolean(errors.contact?.email)}
													helperText={errors.contact?.email?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:mail
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Phone */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Phone Number
										</label>
										<Controller
											name="contact.phone"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. +91 79487893409"
													inputProps={{ maxLength: 20 }}
													error={Boolean(errors.contact?.phone)}
													helperText={errors.contact?.phone?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:phone
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Full Address */}
									<div className="md:col-span-2">
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Street Address
										</label>
										<Controller
											name="contact.address"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. A-869, Jagatpur Road, Sarkhej - Gandhinagar Hwy, near BSNL Office, Gota"
													inputProps={{ maxLength: 255 }}
													error={Boolean(errors.contact?.address)}
													helperText={errors.contact?.address?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:navigation
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* City */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											City
										</label>
										<Controller
											name="contact.city"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. Ahmedabad"
													inputProps={{ maxLength: 100 }}
													error={Boolean(errors.contact?.city)}
													helperText={errors.contact?.city?.message}
													InputProps={{
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* State */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											State / Province
										</label>
										<Controller
											name="contact.state"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. Gujarat"
													inputProps={{ maxLength: 100 }}
													error={Boolean(errors.contact?.state)}
													helperText={errors.contact?.state?.message}
													InputProps={{
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Country */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Country
										</label>
										<Controller
											name="contact.country"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. India"
													inputProps={{ maxLength: 100 }}
													error={Boolean(errors.contact?.country)}
													helperText={errors.contact?.country?.message}
													InputProps={{
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Postal Code */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Postal / ZIP Code
										</label>
										<Controller
											name="contact.postal_code"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. 382470"
													inputProps={{ maxLength: 20 }}
													error={Boolean(errors.contact?.postal_code)}
													helperText={errors.contact?.postal_code?.message}
													InputProps={{
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Working Hours */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Working Hours
										</label>
										<Controller
											name="contact.working_hours"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. Mon–Fri, 10:30 AM – 8:30 PM IST"
													inputProps={{ maxLength: 100 }}
													error={Boolean(errors.contact?.working_hours)}
													helperText={errors.contact?.working_hours?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:clock
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Timezone */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Default Timezone
										</label>
										<Controller
											name="contact.timezone"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. Asia/Kolkata"
													inputProps={{ maxLength: 60 }}
													error={Boolean(errors.contact?.timezone)}
													helperText={errors.contact?.timezone?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:globe
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>
								</div>
							</Paper>
						)}

						{/* TAB 2: Social Media Links */}
						{activeTab === 2 && (
							<Paper
								elevation={0}
								className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
							>
								<div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
									<div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
										<FuseSvgIcon size={16}>lucide:share-2</FuseSvgIcon>
									</div>
									<div>
										<Typography className="text-[15px] font-bold text-slate-900 dark:text-white">
											Social Media Links
										</Typography>
										<Typography className="text-[12px] text-slate-500 dark:text-slate-400">
											Official profiles on Facebook, Instagram, LinkedIn, and YouTube
										</Typography>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
									{/* Facebook */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Facebook
										</label>
										<Controller
											name="social_links.facebook"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. https://www.facebook.com/ctasinfoservices"
													inputProps={{ maxLength: 200 }}
													error={Boolean(errors.social_links?.facebook)}
													helperText={errors.social_links?.facebook?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:facebook
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* Instagram */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											Instagram
										</label>
										<Controller
											name="social_links.instagram"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. https://instagram.com/ctasinfoservices/"
													inputProps={{ maxLength: 200 }}
													error={Boolean(errors.social_links?.instagram)}
													helperText={errors.social_links?.instagram?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:instagram
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* LinkedIn */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											LinkedIn
										</label>
										<Controller
											name="social_links.linkedin"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. https://linkedin.com/company/ctas-info-services"
													inputProps={{ maxLength: 200 }}
													error={Boolean(errors.social_links?.linkedin)}
													helperText={errors.social_links?.linkedin?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:linkedin
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>

									{/* YouTube */}
									<div>
										<label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
											YouTube
										</label>
										<Controller
											name="social_links.youtube"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													fullWidth
													size="small"
													placeholder="e.g. https://www.youtube.com/@ctasinfoservicesllp7030"
													inputProps={{ maxLength: 200 }}
													error={Boolean(errors.social_links?.youtube)}
													helperText={errors.social_links?.youtube?.message}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<FuseSvgIcon size={16} className="text-slate-400">
																	lucide:youtube
																</FuseSvgIcon>
															</InputAdornment>
														),
														className:
															'rounded-xl bg-slate-50/60 dark:bg-slate-800/40 text-sm font-medium'
													}}
												/>
											)}
										/>
									</div>
								</div>
							</Paper>
						)}

						{/* Bottom Action Footer */}
						<Paper
							elevation={0}
							className="px-4 sm:px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3"
						>
							<Typography className="text-xs text-slate-500 dark:text-slate-400">
								{isDirty
									? 'You have unsaved changes in your website configuration.'
									: 'All settings are up to date and live.'}
							</Typography>

							<div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
								<button
									type="button"
									onClick={handleReset}
									disabled={!canMutate || !isDirty || updateMutation.isPending}
									style={{ height: '34px' }}
									className="w-full sm:w-auto px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
								>
									Discard Changes
								</button>
								<button
									type="submit"
									disabled={!canMutate || !isDirty || !isValid || updateMutation.isPending}
									style={{ height: '34px' }}
									className="w-full sm:w-auto px-5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-0"
								>
									{updateMutation.isPending ? (
										<CircularProgress size={14} color="inherit" />
									) : (
										<FuseSvgIcon size={15} className="text-white">
											lucide:save
										</FuseSvgIcon>
									)}
									<span>{updateMutation.isPending ? 'Saving...' : 'Save Configuration'}</span>
								</button>
							</div>
						</Paper>
					</form>
				)}
			</div>
	);
}

export default SiteConfigurationView;
