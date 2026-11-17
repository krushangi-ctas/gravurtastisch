'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import {
	TextField,
	Button,
	IconButton,
	CircularProgress,
	Tooltip,
	Paper,
	Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { SimpleEditor } from '@/components/tiptap/tiptap-templates/simple/simple-editor';
import { getImageUrl } from '@/configs/env';
import {
	useModuleDetails,
	useCreateStep,
	useUpdateStep,
	useUploadScreenshot
} from '../../api/hooks/useGuideDocuments';
import { GuideModule, GuideStep } from '../../api/types';
import ImageLightboxDialog from '../dialogs/ImageLightboxDialog';
import usePermissions from '@/hooks/usePermissions';
import AccessDeniedView from '@/components/AccessDeniedView';

export default function GuideStepFormView() {
	const { moduleId, stepId } = useParams<{ moduleId: string; stepId?: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();
	const { canView, canCreate, canUpdate } = usePermissions();

	const isEdit = Boolean(stepId);
	const hasViewPermission = canView('guide-document');
	const hasActionPermission = isEdit ? canUpdate('guide-document') : canCreate('guide-document');

	// Retrieve passed state if navigated from GuideDocumentsView
	const locationState = location.state as
		| { step?: GuideStep; childModule?: GuideModule; parentModule?: GuideModule }
		| undefined;

	const passedStep = locationState?.step;
	const passedChild = locationState?.childModule;
	const passedParent = locationState?.parentModule;

	// Fetch module details if not fully available in state
	const { data: moduleDetailResponse, isLoading: isFetchingModule } = useModuleDetails(
		moduleId,
		Boolean(moduleId && (!passedChild || !passedChild.steps))
	);

	const fetchedData = moduleDetailResponse?.data;
	const moduleDoc = passedChild || fetchedData?.module;
	const existingSteps: GuideStep[] = (passedChild?.steps || fetchedData?.steps || []).slice().sort(
		(a, b) => (a.stepOrder || 0) - (b.stepOrder || 0)
	);

	const activeStep = isEdit && stepId
		? passedStep || existingSteps.find((s) => (s._id && s._id === stepId) || (s.id && s.id === stepId))
		: null;

	// Mutations
	const createStepMutation = useCreateStep();
	const updateStepMutation = useUpdateStep();
	const uploadScreenshotMutation = useUploadScreenshot();

	// Form State
	const [title, setTitle] = useState('');
	const [titleError, setTitleError] = useState<string | null>(null);
	const [description, setDescription] = useState('');
	const [screenshotUrl, setScreenshotUrl] = useState('');
	const [stepOrder, setStepOrder] = useState<number>(1);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// Populate form on mount or when activeStep is resolved
	useEffect(() => {
		if (isEdit && activeStep) {
			setTitle(activeStep.title || '');
			setDescription(activeStep.description || '');
			setScreenshotUrl(activeStep.screenshotUrl || '');
			setStepOrder(activeStep.stepOrder || 1);
		} else if (!isEdit) {
			setTitle('');
			setDescription('');
			setScreenshotUrl('');
			setStepOrder((existingSteps.length || 0) + 1);
		}
	}, [isEdit, activeStep, existingSteps.length]);

	// Handle screenshot file upload
	const handleScreenshotPicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!hasActionPermission) {
			enqueueSnackbar('You do not have permission to perform this action.', { variant: 'error' });
			return;
		}

		const file = event.target.files?.[0];
		if (!file) return;

		setIsUploadingImage(true);
		try {
			const res = await uploadScreenshotMutation.mutateAsync(file);
			const url = res.data?.url || res.data?.screenshotUrl;
			if (url) {
				setScreenshotUrl(url);
				enqueueSnackbar('Screenshot uploaded successfully', { variant: 'success' });
			} else {
				enqueueSnackbar('Failed to get uploaded screenshot URL', { variant: 'error' });
			}
		} catch (error: any) {
			enqueueSnackbar(error?.message || 'Error uploading screenshot', { variant: 'error' });
		} finally {
			setIsUploadingImage(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	// Handle inline image upload for rich editor
	const handleEditorUploadImage = async (file: File): Promise<string> => {
		if (!hasActionPermission) {
			enqueueSnackbar('You do not have permission to upload images.', { variant: 'error' });
			throw new Error('Permission denied');
		}

		const res = await uploadScreenshotMutation.mutateAsync(file);
		const url = res.data?.url || res.data?.screenshotUrl;
		if (url) {
			return getImageUrl(url);
		}
		throw new Error('Failed to get uploaded image URL');
	};

	// Save or Update step
	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!hasActionPermission) {
			enqueueSnackbar('You do not have permission to perform this action.', { variant: 'error' });
			return;
		}

		if (!moduleId) {
			enqueueSnackbar('Missing module ID', { variant: 'error' });
			return;
		}

		if (!title.trim()) {
			setTitleError('Title is required.');
			enqueueSnackbar('Title is required.', { variant: 'warning' });
			return;
		}

		setIsSubmitting(true);
		try {
			if (isEdit && stepId) {
				await updateStepMutation.mutateAsync({
					stepId,
					payload: {
						title: title.trim(),
						description,
						screenshotUrl: screenshotUrl.trim(),
						stepOrder: Number(stepOrder) || 1
					}
				});
				enqueueSnackbar('Step updated successfully.', { variant: 'success' });
			} else {
				await createStepMutation.mutateAsync({
					moduleId,
					payload: {
						title: title.trim(),
						description,
						screenshotUrl: screenshotUrl.trim(),
						stepOrder: Number(stepOrder) || (existingSteps.length + 1)
					}
				});
				enqueueSnackbar('Step added successfully.', { variant: 'success' });
			}

			// Navigate back to guide documents preserving selected child
			navigate(moduleId ? `/guide-document?child=${moduleId}` : '/guide-document');
		} catch (error: any) {
			enqueueSnackbar(error?.message || 'Failed to save step', { variant: 'error' });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!hasViewPermission || !hasActionPermission) {
		return <AccessDeniedView sectionTitle="Guide Documents" />;
	}

	const parentTitle =
		passedParent?.title || (moduleDoc?.parentId as any)?.title || 'Category';
	const moduleTitle = moduleDoc?.title || 'Guide Document';

	if (isFetchingModule && !moduleDoc) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[450px] p-8 gap-3">
				<CircularProgress size={36} className="text-primary-500" />
				<p className="text-xs text-slate-500 font-medium">Loading guide details...</p>
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
			{/* Sticky Top Header */}
			<div className="sticky top-12 z-20 w-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white px-4 sm:px-5 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-2xs backdrop-blur-md">
				<div className="flex items-center gap-3">
					<IconButton
						onClick={() => navigate(moduleId ? `/guide-document?child=${moduleId}` : '/guide-document')}
						className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 shrink-0 rounded-lg"
						size="small"
						title="Back to Guides"
						aria-label="Back to Guides"
					>
						<FuseSvgIcon size={18}>lucide:arrow-left</FuseSvgIcon>
					</IconButton>

					<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 shrink-0 shadow-2xs">
						<FuseSvgIcon size={18}>lucide:list-ordered</FuseSvgIcon>
					</div>

					<div className="flex flex-col min-w-0">
						<div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
							<span className="truncate max-w-[120px]">{parentTitle}</span>
							<span>/</span>
							<span className="truncate max-w-[140px] text-primary-600 dark:text-primary-400">
								{moduleTitle}
							</span>
							<span>/</span>
							<span>{isEdit ? 'Edit Step' : 'New Step'}</span>
						</div>
						<h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight truncate">
							{isEdit ? `Edit Step ${stepOrder}` : 'Add New Guide Step'}
						</h1>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outlined"
						size="small"
						onClick={() => navigate(moduleId ? `/guide-document?child=${moduleId}` : '/guide-document')}
						className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 normal-case"
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						size="small"
						onClick={() => handleSubmit()}
						disabled={isSubmitting || isUploadingImage || !hasActionPermission}
						startIcon={
							isSubmitting ? (
								<CircularProgress size={14} color="inherit" />
							) : (
								<FuseSvgIcon size={16}>lucide:check</FuseSvgIcon>
							)
						}
						className="bg-primary-500 hover:bg-primary-600 text-white shadow-xs rounded-lg text-xs normal-case"
					>
						{isEdit ? 'Update Step' : 'Save Step'}
					</Button>
				</div>
			</div>

			{/* Main Form Content */}
			<div className="flex-1 w-full px-3 sm:px-4 py-3 sm:py-3.5">
				<form onSubmit={handleSubmit} noValidate className="w-full">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start w-full">
						{/* Left Column (8 cols): Title & Rich Text Editor */}
						<div className="lg:col-span-8 space-y-3">
							{/* Step Title Card */}
							<Paper className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
								<div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
									<div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
										<FuseSvgIcon size={16}>lucide:type</FuseSvgIcon>
									</div>
									<div>
										<h2 className="text-sm font-bold text-slate-900 dark:text-white">
											Step Title
										</h2>
										<p className="text-[11px] text-slate-500">
											Give a clear, concise instruction or milestone title
										</p>
									</div>
								</div>

								<TextField
									label="Step Title *"
									placeholder="e.g. Navigate to Settings & configure API Credentials"
									value={title}
									onChange={(e) => {
										setTitle(e.target.value);
										if (titleError && e.target.value.trim().length > 0) {
											setTitleError(null);
										}
									}}
									onBlur={() => {
										if (!title.trim()) {
											setTitleError('Title is required.');
										}
									}}
									error={Boolean(titleError)}
									helperText={titleError}
									fullWidth
									size="small"
									variant="outlined"
									InputLabelProps={{ shrink: true }}
									className="bg-slate-50/50 dark:bg-slate-800/40"
								/>
							</Paper>

							{/* Step Instructions Card (Rich Text Editor) */}
							<Paper className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
								<div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
									<div className="flex items-center gap-2.5">
										<div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
											<FuseSvgIcon size={16}>lucide:file-pen</FuseSvgIcon>
										</div>
										<div>
											<h2 className="text-sm font-bold text-slate-900 dark:text-white">
												Step Instructions & Description
											</h2>
											<p className="text-[11px] text-slate-500">
												Rich formatted guide walkthrough just like in saas_panel
											</p>
										</div>
									</div>

									<Chip
										size="small"
										label="Rich Text"
										className="bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold text-[10px]"
									/>
								</div>

								<div className="w-full">
									<SimpleEditor
										value={description}
										onChange={(val) => setDescription(val)}
										onUploadImage={handleEditorUploadImage}
										className="min-h-[260px] border border-slate-200 dark:border-slate-700 rounded-xl"
									/>
								</div>
							</Paper>
						</div>

						{/* Right Column (4 cols): Screenshot & Settings */}
						<div className="lg:col-span-4 space-y-3">
							{/* Screenshot Upload Card */}
							<Paper className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
								<div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
									<div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
										<FuseSvgIcon size={16}>lucide:image</FuseSvgIcon>
									</div>
									<div>
										<h2 className="text-sm font-bold text-slate-900 dark:text-white">
											Screenshot Walkthrough
										</h2>
										<p className="text-[11px] text-slate-500">
											Visual illustration for this guide step
										</p>
									</div>
								</div>

								{/* Hidden file input */}
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleScreenshotPicked}
								/>

								{/* Screenshot Preview or Upload Box */}
								{screenshotUrl ? (
									<div className="space-y-3">
										<div
											onClick={() =>
												setLightboxImage({
													url: getImageUrl(screenshotUrl),
													title: title || 'Screenshot Preview'
												})
											}
											className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 cursor-zoom-in"
										>
											<img
												src={getImageUrl(screenshotUrl)}
												alt="Screenshot"
												className="w-full max-h-48 object-contain"
											/>
											<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-2xs">
												<FuseSvgIcon size={16}>lucide:maximize-2</FuseSvgIcon>
												<span>Zoom</span>
											</div>
										</div>

										<div className="flex items-center justify-between gap-2">
											<Button
												size="small"
												variant="outlined"
												onClick={() => fileInputRef.current?.click()}
												disabled={isUploadingImage}
												startIcon={<FuseSvgIcon size={14}>lucide:refresh-cw</FuseSvgIcon>}
												className="text-xs normal-case"
											>
												Replace
											</Button>
											<Button
												size="small"
												color="error"
												variant="outlined"
												onClick={() => setScreenshotUrl('')}
												startIcon={<FuseSvgIcon size={14}>lucide:trash-2</FuseSvgIcon>}
												className="text-xs normal-case"
											>
												Remove
											</Button>
										</div>
									</div>
								) : (
									<div
										onClick={() => fileInputRef.current?.click()}
										className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20"
									>
										{isUploadingImage ? (
											<div className="flex flex-col items-center justify-center py-4 gap-2">
												<CircularProgress size={24} className="text-primary-500" />
												<span className="text-xs text-slate-500">Uploading screenshot...</span>
											</div>
										) : (
											<div className="space-y-1.5">
												<div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto">
													<FuseSvgIcon size={20}>lucide:cloud-upload</FuseSvgIcon>
												</div>
												<p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
													Click to upload screenshot
												</p>
												<p className="text-[11px] text-slate-400">
													PNG, JPG, or WEBP up to 5MB
												</p>
											</div>
										)}
									</div>
								)}

								{/* Optional Manual URL */}
								<div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
									<TextField
										label="Screenshot URL"
										placeholder="https://... or uploaded image path"
										value={screenshotUrl}
										onChange={(e) => setScreenshotUrl(e.target.value)}
										fullWidth
										size="small"
										variant="outlined"
										InputLabelProps={{ shrink: true }}
										className="bg-slate-50/50 dark:bg-slate-800/40 text-xs"
									/>
								</div>
							</Paper>

							{/* Step Settings Card */}
							<Paper className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 space-y-3">
								<div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
									<div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
										<FuseSvgIcon size={16}>lucide:settings-2</FuseSvgIcon>
									</div>
									<div>
										<h2 className="text-sm font-bold text-slate-900 dark:text-white">
											Step Settings
										</h2>
										<p className="text-[11px] text-slate-500">
											Sequence & contextual details
										</p>
									</div>
								</div>

								<TextField
									label="Step Sequence / Order"
									type="number"
									value={stepOrder}
									onChange={(e) => setStepOrder(Math.max(1, parseInt(e.target.value, 10) || 1))}
									fullWidth
									size="small"
									variant="outlined"
									InputLabelProps={{ shrink: true }}
									className="bg-slate-50/50 dark:bg-slate-800/40"
								/>

								<div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
									<div className="flex items-center justify-between">
										<span className="text-slate-500">Parent Category:</span>
										<span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
											{parentTitle}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-slate-500">Child Guide:</span>
										<span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
											{moduleTitle}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-slate-500">Section Scope:</span>
										<Chip
											size="small"
											label={moduleDoc?.isAdminSection ? 'Admin' : 'Seller'}
											className="font-bold text-[10px] h-5 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
										/>
									</div>
								</div>

								{/* Primary Submit */}
								<div className="pt-2">
									<Button
										variant="contained"
										fullWidth
										onClick={() => handleSubmit()}
										disabled={isSubmitting || isUploadingImage || !hasActionPermission}
										startIcon={
											isSubmitting ? (
												<CircularProgress size={16} color="inherit" />
											) : (
												<FuseSvgIcon size={16}>lucide:save</FuseSvgIcon>
											)
										}
										className="bg-primary-500 hover:bg-primary-600 text-white shadow-xs rounded-xl py-2.5 text-xs font-semibold normal-case"
									>
										{isEdit ? 'Update Step' : 'Save Step'}
									</Button>
								</div>
							</Paper>
						</div>
					</div>
				</form>
			</div>

			{/* Lightbox for zooming screenshot preview */}
			<ImageLightboxDialog
				open={Boolean(lightboxImage)}
				onClose={() => setLightboxImage(null)}
				imageUrl={lightboxImage?.url || null}
				title={lightboxImage?.title || 'Screenshot'}
			/>
		</div>
	);
}
