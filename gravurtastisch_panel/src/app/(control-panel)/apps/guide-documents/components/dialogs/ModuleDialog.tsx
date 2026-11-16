'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Switch,
	FormControlLabel,
	CircularProgress,
	MenuItem,
	Select,
	FormControl,
	InputLabel
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { GuideModule } from '../../api/types';
import { useCreateModule, useUpdateModule } from '../../api/hooks/useGuideDocuments';
import usePermissions from '@/hooks/usePermissions';

interface ModuleDialogProps {
	open: boolean;
	onClose: () => void;
	editingModule?: GuideModule | null;
	parentModule?: GuideModule | null;
	isAdminUser?: boolean;
	defaultAdminSection?: boolean;
}

interface FormValues {
	title: string;
	description: string;
	isAdminSection: boolean;
	isPublished: boolean;
}

export default function ModuleDialog({
	open,
	onClose,
	editingModule,
	parentModule,
	isAdminUser = false,
	defaultAdminSection = true
}: ModuleDialogProps) {
	const { enqueueSnackbar } = useSnackbar();
	const createModuleMutation = useCreateModule();
	const updateModuleMutation = useUpdateModule();
	const { canCreate, canUpdate } = usePermissions();

	const isEditing = Boolean(editingModule);
	const isChild = Boolean(parentModule || editingModule?.parentId);
	const userCanSave = isEditing ? canUpdate('guide-document') : canCreate('guide-document');

	const {
		control,
		handleSubmit,
		reset,
		setError,
		clearErrors,
		formState: { errors }
	} = useForm<FormValues>({
		mode: 'onChange',
		defaultValues: {
			title: '',
			description: '',
			isAdminSection: defaultAdminSection,
			isPublished: false
		}
	});

	useEffect(() => {
		if (open) {
			if (editingModule) {
				reset({
					title: editingModule.title || editingModule.moduleName || '',
					description: editingModule.description || '',
					isAdminSection: editingModule.isAdminSection !== false,
					isPublished: Boolean(editingModule.isPublished)
				});
			} else {
				const sectionValue = parentModule
					? parentModule.isAdminSection !== false
					: defaultAdminSection;
				reset({
					title: '',
					description: '',
					isAdminSection: sectionValue,
					isPublished: false
				});
			}
		}
	}, [open, editingModule, parentModule, defaultAdminSection, reset]);

	const onSubmit = async (values: FormValues) => {
		if (!userCanSave) {
			enqueueSnackbar('You do not have permission to perform this action.', { variant: 'error' });
			return;
		}

		const trimmedTitle = values.title?.trim();
		if (!trimmedTitle) {
			setError('title', { type: 'manual', message: 'Title is required.' });
			return;
		}

		try {
			if (isEditing && editingModule?._id) {
				await updateModuleMutation.mutateAsync({
					moduleId: editingModule._id,
					payload: {
						title: trimmedTitle,
						description: values.description?.trim() || '',
						isAdminSection: values.isAdminSection,
						isPublished: values.isPublished
					}
				});
				enqueueSnackbar(
					isChild
						? 'Child guide updated successfully.'
						: 'Parent module updated successfully.',
					{ variant: 'success' }
				);
			} else {
				await createModuleMutation.mutateAsync({
					title: trimmedTitle,
					description: values.description?.trim() || '',
					parentId: parentModule?._id || null,
					isAdminSection: values.isAdminSection,
					isPublished: values.isPublished
				});
				enqueueSnackbar(
					isChild
						? 'Child guide added successfully.'
						: 'Parent module added successfully.',
					{ variant: 'success' }
				);
			}
			onClose();
		} catch (err: any) {
			enqueueSnackbar(err?.message || 'Failed to save module', { variant: 'error' });
		}
	};

	const isPending = createModuleMutation.isPending || updateModuleMutation.isPending;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			slotProps={{
				paper: {
					className: 'rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800'
				}
			}}
		>
			<form onSubmit={handleSubmit(onSubmit)} noValidate>
				<DialogTitle className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 bg-primary-50/50 dark:bg-slate-900/50">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 text-primary-600">
							<FuseSvgIcon size={18}>
								{isChild ? 'lucide:folder-git-2' : 'lucide:folder'}
							</FuseSvgIcon>
						</div>
						<div>
							<h3 className="text-base font-semibold text-slate-900 dark:text-white">
								{isEditing
									? isChild
										? 'Edit Child Module'
										: 'Edit Parent Module'
									: isChild
									? `Add Child to "${parentModule?.title}"`
									: 'Create New Parent Module'}
							</h3>
							<p className="text-xs text-slate-500">
								{isChild
									? 'Child modules contain step-by-step documentation guides.'
									: 'Parent modules act as category containers for related guides.'}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
					>
						<FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
					</button>
				</DialogTitle>

				<DialogContent className="pt-5 space-y-4">
					<Controller
						name="title"
						control={control}
						rules={{
							required: 'Title is required.',
							validate: (val) =>
								Boolean(val && val.trim().length > 0) || 'Title is required.'
						}}
						render={({ field }) => (
							<TextField
								{...field}
								label="Title *"
								fullWidth
								autoFocus
								error={Boolean(errors.title)}
								helperText={errors.title?.message}
								placeholder={
									isChild
										? 'e.g. Add Users, Setup Store, Orders Walkthrough'
										: 'e.g. Users, Orders, Products, Settings'
								}
								size="small"
								variant="outlined"
								onChange={(e) => {
									field.onChange(e);
									if (errors.title && e.target.value.trim().length > 0) {
										clearErrors('title');
									}
								}}
							/>
						)}
					/>

					<Controller
						name="description"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="Description (Optional)"
								fullWidth
								multiline
								rows={3}
								placeholder="Brief summary of what this guide covers..."
								size="small"
								variant="outlined"
							/>
						)}
					/>

					<div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
						<div>
							<div className="text-sm font-medium text-slate-800 dark:text-slate-200">
								Publish Status
							</div>
							<div className="text-xs text-slate-500">
								When published, users can view this module and its guides.
							</div>
						</div>
						<Controller
							name="isPublished"
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={
										<Switch
											checked={field.value}
											onChange={(e) => field.onChange(e.target.checked)}
											color="primary"
										/>
									}
									label=""
									className="m-0"
								/>
							)}
						/>
					</div>
				</DialogContent>

				<DialogActions className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
					<Button
						onClick={onClose}
						disabled={isPending}
						className="text-slate-600 hover:bg-slate-100"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={isPending || !userCanSave}
						className="bg-primary-500 hover:bg-primary-600 text-white px-5 shadow-sm"
					>
						{isPending ? (
							<CircularProgress size={18} className="text-white" />
						) : isEditing ? (
							'Save Changes'
						) : (
							'Create Module'
						)}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
