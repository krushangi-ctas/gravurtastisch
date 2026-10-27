import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import {
	TextField,
	Button,
	Box,
	Typography,
	IconButton,
	CircularProgress,
	Tooltip,
	Paper,
	Chip,
	Dialog,
	DialogContent,
	Divider
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import LexicalEditor from '@/components/LexicalEditor/LexicalEditor';
import { getImageUrl } from '@/configs/env';
import { useCreateBlog, useUpdateBlog, useUploadBlogImage, useBlogDetails } from '../../api/hooks/useBlogs';
import { Blog } from '../../api/services/blogsApiService';
import { getErrorMessage } from '@/utils/errorMessage';
import usePermissions from '@/hooks/usePermissions';
import AccessDeniedView from '@/components/AccessDeniedView';

interface ImageItem {
	id: string;
	relativePath: string;
	previewUrl: string;
	isUploading?: boolean;
}

export default function BlogFormView() {
	const { blogId } = useParams<{ blogId?: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();
	const { canCreate, canUpdate } = usePermissions();

	const isEdit = Boolean(blogId);

	const hasAccess = isEdit ? canUpdate('blogs') : canCreate('blogs');

	const passedBlog = (location.state as any)?.blog as Blog | undefined;
	const { data: blogDetailResponse, isLoading: isFetchingBlog } = useBlogDetails(isEdit && !passedBlog ? blogId : undefined);

	const activeBlog = passedBlog || blogDetailResponse?.data;

	const createMutation = useCreateBlog();
	const updateMutation = useUpdateBlog();
	const uploadMutation = useUploadBlogImage();

	const [blogTitle, setBlogTitle] = useState('');
	const [shortDescription, setShortDescription] = useState('');
	const [descriptionJson, setDescriptionJson] = useState<any>(null);
	const [images, setImages] = useState<ImageItem[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
	const [previewModalTitle, setPreviewModalTitle] = useState<string>('');
	const [errors, setErrors] = useState<{ blogTitle?: string; shortDescription?: string }>({});
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

	// Patch values when blog data arrives
	useEffect(() => {
		if (activeBlog) {
			setBlogTitle(activeBlog.blog_title || '');
			setShortDescription(activeBlog.short_description || '');
			setDescriptionJson(activeBlog.description || null);

			const initialImages: ImageItem[] = (activeBlog.description_images || []).map((relPath, index) => {
				const backendUrl =
					activeBlog.full_image_urls && activeBlog.full_image_urls[index]
						? activeBlog.full_image_urls[index]
						: null;
				const fullUrl = getImageUrl(backendUrl || relPath);
				return {
					id: `existing-${index}-${Date.now()}`,
					relativePath: relPath,
					previewUrl: fullUrl,
					isUploading: false
				};
			});
			setImages(initialImages);
		}
	}, [activeBlog]);

	// Add an empty image upload row
	const handleAddImageRow = () => {
		const newId = `img-row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
		setImages((prev) => [
			...prev,
			{
				id: newId,
				relativePath: '',
				previewUrl: '',
				isUploading: false
			}
		]);
	};

	// Handle file selection and immediate backend upload
	const handleFileChange = async (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setImages((prev) =>
			prev.map((item) => (item.id === rowId ? { ...item, isUploading: true } : item))
		);

		try {
			const res = await uploadMutation.mutateAsync(file);
			if (res.data) {
				const fullUrl = getImageUrl(res.data.url || res.data.relativePath);
				setImages((prev) =>
					prev.map((item) =>
						item.id === rowId
							? {
								...item,
								relativePath: res.data.relativePath,
								previewUrl: fullUrl,
								isUploading: false
							}
							: item
					)
				);
				enqueueSnackbar('Image uploaded successfully.', { variant: 'success', autoHideDuration: 2000 });
			}
		} catch (error: any) {
			const errMsg = error?.message || 'Failed to upload image';
			enqueueSnackbar(errMsg, { variant: 'error' });
			setImages((prev) =>
				prev.map((item) => (item.id === rowId ? { ...item, isUploading: false } : item))
			);
		}
	};

	// Handle image upload from within Lexical Editor
	const handleEditorUploadImage = async (file: File) => {
		const res = await uploadMutation.mutateAsync(file);
		if (res?.data) {
			const fullUrl = getImageUrl(res.data.url || res.data.relativePath);
			return {
				url: fullUrl,
				relativePath: res.data.relativePath
			};
		}
		throw new Error('Upload response missing data');
	};

	const handleRemoveImageRow = (rowId: string) => {
		setImages((prev) => prev.filter((item) => item.id !== rowId));
	};

	const validateForm = () => {
		const newErrors: { blogTitle?: string; shortDescription?: string } = {};

		const trimmedTitle = blogTitle.trim();
		if (!trimmedTitle) {
			newErrors.blogTitle = 'Blog Title is required!';
		} else if (trimmedTitle.length < 3) {
			newErrors.blogTitle = 'Title must be at least 3 characters long';
		} else if (trimmedTitle.length > 50) {
			newErrors.blogTitle = 'Blog Title must not exceed 50 characters';
		}

		const trimmedShortDesc = shortDescription.trim();
		if (trimmedShortDesc && trimmedShortDesc.length > 200) {
			newErrors.shortDescription = 'Short Description must not exceed 200 characters';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();

		if (!validateForm()) {
			enqueueSnackbar('Please fix the highlighted errors before saving.', { variant: 'error' });
			return;
		}

		const uploadedRelativePaths = images
			.map((img) => img.relativePath)
			.filter((path) => Boolean(path && path.trim()));

		const isStillUploading = images.some((img) => img.isUploading);
		if (isStillUploading) {
			enqueueSnackbar('Please wait for all images to finish uploading.', { variant: 'warning' });
			return;
		}

		setIsSubmitting(true);

		const payload = {
			blog_title: blogTitle.trim(),
			short_description: shortDescription.trim(),
			description: descriptionJson,
			description_images: uploadedRelativePaths
		};

		try {
			if (isEdit && blogId) {
				await updateMutation.mutateAsync({
					blogId,
					payload
				});
				enqueueSnackbar('Blog updated successfully.', { variant: 'success', autoHideDuration: 2500 });
			} else {
				await createMutation.mutateAsync(payload);
				enqueueSnackbar('Blog published successfully.', { variant: 'success', autoHideDuration: 2500 });
			}
			navigate('/blogs');
		} catch (err: unknown) {
			const errMsg = getErrorMessage(err, isEdit ? 'Failed to update blog' : 'Failed to create blog');
			enqueueSnackbar(errMsg, { variant: 'error' });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!hasAccess) {
		return <AccessDeniedView sectionTitle="Blog Management" />;
	}

	if (isEdit && isFetchingBlog && !activeBlog) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[450px] p-8">
				<CircularProgress size={44} className="text-primary mb-4" />
				<Typography className="text-slate-600 dark:text-slate-300 font-medium text-base">
					Loading blog details...
				</Typography>
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col min-h-screen bg-white dark:bg-slate-900">
			{/* Consistent Sticky Top Header (offset by top-12 to stick directly below the 48px top toolbar) */}
			<div className="sticky top-12 z-20 w-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white px-4 sm:px-6 md:px-8 lg:px-10 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
				<div className="flex items-center gap-2.5 sm:gap-3">
					<IconButton
						onClick={() => navigate('/blogs')}
						className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 shrink-0"
						size="small"
						title="Back to Blogs"
						aria-label="Back to Blogs"
					>
						<FuseSvgIcon size={20}>heroicons-outline:arrow-left</FuseSvgIcon>
					</IconButton>

					<div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
						<FuseSvgIcon size={20} className="text-primary">
							heroicons-outline:document-text
						</FuseSvgIcon>
					</div>

					<div className="flex flex-col min-w-0">
						<h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight flex items-center gap-2 truncate">
							<span>{isEdit ? 'Edit Blog' : 'Add Blog'}</span>
							{isEdit && blogTitle && (
								<span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-xs">
									{blogTitle}
								</span>
							)}
						</h1>
						<p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 m-0 font-medium leading-tight mt-1 truncate">
							{isEdit
								? 'Manage blog article content, rich formatting, images, and publish settings.'
								: 'Write and publish a new blog post for the marketplace website.'}
						</p>
					</div>
				</div>

				{isEdit && (
					<div className="hidden sm:flex items-center">
						<Chip
							label="Published Article"
							color="success"
							size="small"
							className="font-semibold text-xs"
						/>
					</div>
				)}
			</div>

			{/* Main Full-Width Scrollable Content */}
			<div className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">
				<form id="blog-form" onSubmit={handleSubmit} noValidate>
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
						{/* Main Column (8 Cols): Article Title, Teaser & Lexical Rich Content */}
						<div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
							{/* Card 1: Article Header & Teaser */}
							<Paper className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
								<div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
									<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
										<FuseSvgIcon size={22}>heroicons-outline:document-text</FuseSvgIcon>
									</div>
									<div>
										<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0">
											Article Headline & Overview
										</h2>
										<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0 mt-0.5">
											Catchy headline and brief synopsis displayed on the blog card and search results.
										</p>
									</div>
								</div>

								<div className="flex flex-col gap-6">
									<div>
										<div className="flex items-center justify-between mb-1.5">
											<label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
												Blog Title <span className="text-red-500 font-bold ml-0.5">*</span>
											</label>
											<span className="text-xs text-slate-400 font-mono">{blogTitle.length}/50</span>
										</div>
										<TextField
											fullWidth
											placeholder="e.g. How to Automate Amazon Product Review Requests in 2026"
											value={blogTitle}
											inputProps={{ maxLength: 50 }}
											onChange={(e) => {
												setBlogTitle(e.target.value);
												if (errors.blogTitle) setErrors((prev) => ({ ...prev, blogTitle: undefined }));
											}}
											error={Boolean(errors.blogTitle)}
											helperText={errors.blogTitle}
										/>
									</div>

									<div>
										<div className="flex items-center justify-between mb-1.5">
											<label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
												Short Description / Teaser
											</label>
											<span className="text-xs text-slate-400 font-mono">{shortDescription.length}/200</span>
										</div>
										<TextField
											fullWidth
											multiline
											rows={3}
											placeholder="A compelling 2-3 sentence overview of this article..."
											value={shortDescription}
											inputProps={{ maxLength: 200 }}
											onChange={(e) => {
												setShortDescription(e.target.value);
												if (errors.shortDescription) {
													setErrors((prev) => ({ ...prev, shortDescription: undefined }));
												}
											}}
											error={Boolean(errors.shortDescription)}
											helperText={errors.shortDescription || 'Shown as snippet preview on social media and blog index'}
										/>
									</div>
								</div>
							</Paper>

							{/* Card 2: Full Rich Text Editor */}
							<Paper className="p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
								<div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
											<FuseSvgIcon size={22}>heroicons-outline:pencil-square</FuseSvgIcon>
										</div>
										<div>
											<h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0">
												Full Article Content
											</h2>
											<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0 mt-0.5">
												Use rich typography, formatting, quotes, code, and inline illustrations.
											</p>
										</div>
									</div>
									<Tooltip title="Supports headings, lists, links, inline pictures, and rich formatting">
										<span className="text-xs font-medium text-slate-400 hover:text-slate-600 cursor-help flex items-center gap-1">
											<FuseSvgIcon size={16}>heroicons-outline:information-circle</FuseSvgIcon>
											Editor Guide
										</span>
									</Tooltip>
								</div>

								<div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner bg-slate-50/30 dark:bg-slate-950/30">
									<LexicalEditor
										key={activeBlog ? (activeBlog._id || activeBlog.id) : 'new-blog-editor'}
										value={descriptionJson}
										onChange={(json) => {
											setDescriptionJson(json);
										}}
										onUploadImage={handleEditorUploadImage}
										placeholder="Start drafting your article here... Type headings, bullet points, or paste text and images freely."
										minHeight={360}
									/>
								</div>
							</Paper>
						</div>

						{/* Sidebar Column (4 Cols): Cover Media & Article Settings */}
						<div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">
							{/* Card 3: Media Gallery */}
							<Paper className="p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
								<div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
									<div className="flex items-center gap-2.5">
										<div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
											<FuseSvgIcon size={22}>heroicons-outline:photo</FuseSvgIcon>
										</div>
										<div>
											<h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
												Cover & Media
											</h3>
											<p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
												Primary banner and article gallery
											</p>
										</div>
									</div>
									<span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
										{images.length} {images.length === 1 ? 'image' : 'images'}
									</span>
								</div>

								<p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
									The first image serves as the primary article card cover banner on the website.
								</p>

								{/* Images List */}
								<div className="flex flex-col gap-3">
									{images.length === 0 ? (
										<div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/40">
											<FuseSvgIcon size={32} className="text-slate-400 mb-2">
												heroicons-outline:photo
											</FuseSvgIcon>
											<p className="text-xs font-medium text-slate-600 dark:text-slate-400 m-0">
												No cover images added yet
											</p>
											<p className="text-[11px] text-slate-400 mt-1 mb-3">
												Upload an image to make this post visually striking
											</p>
											<Button
												size="small"
												variant="outlined"
												color="primary"
												startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
												onClick={handleAddImageRow}
												className="normal-case text-xs"
											>
												Add Cover Image
											</Button>
										</div>
									) : (
										<>
											{images.map((item, index) => (
												<div
													key={item.id}
													className="relative flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 group hover:border-primary/50 transition-all"
												>
													{/* Thumbnail or Upload Trigger */}
													<div
														onClick={() => {
															if (item.previewUrl) {
																setPreviewModalUrl(item.previewUrl);
																setPreviewModalTitle(`Image #${index + 1}`);
															} else {
																fileInputRefs.current[item.id]?.click();
															}
														}}
														className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer border border-slate-300/60 dark:border-slate-600 relative group/thumb"
													>
														{item.isUploading ? (
															<CircularProgress size={20} className="text-primary" />
														) : item.previewUrl ? (
															<>
																<img
																	src={item.previewUrl}
																	alt={`Media ${index + 1}`}
																	className="w-full h-full object-cover"
																/>
																<div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
																	<FuseSvgIcon size={16}>heroicons-outline:arrows-pointing-out</FuseSvgIcon>
																</div>
															</>
														) : (
															<FuseSvgIcon size={22} className="text-slate-400">
																heroicons-outline:arrow-up-tray
															</FuseSvgIcon>
														)}
													</div>

													{/* Details & Actions */}
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-1.5">
															<span className="text-xs font-bold text-slate-800 dark:text-slate-200">
																{index === 0 ? 'Primary Cover' : `Media #${index + 1}`}
															</span>
															{index === 0 && (
																<Chip
																	label="COVER"
																	size="small"
																	color="primary"
																	className="text-[9px] font-bold h-4 px-1"
																/>
															)}
														</div>
														<p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 mb-1.5">
															{item.relativePath ? item.relativePath.split('/').pop() : 'No file selected yet'}
														</p>

														<Button
															size="small"
															variant="text"
															color="primary"
															onClick={() => fileInputRefs.current[item.id]?.click()}
															disabled={item.isUploading}
															className="normal-case text-[11px] p-0 h-auto min-h-0 font-semibold"
														>
															{item.previewUrl ? 'Replace Image' : 'Select File'}
														</Button>
													</div>

													{/* Remove button */}
													<IconButton
														size="small"
														onClick={() => handleRemoveImageRow(item.id)}
														className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
														title="Delete image"
													>
														<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
													</IconButton>

													<input
														ref={(el) => {
															fileInputRefs.current[item.id] = el;
														}}
														type="file"
														accept="image/*"
														className="hidden"
														onChange={(e) => handleFileChange(item.id, e)}
													/>
												</div>
											))}

											<Button
												variant="outlined"
												color="inherit"
												size="small"
												startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
												onClick={handleAddImageRow}
												className="mt-2 normal-case text-xs border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
											>
												Add Another Image
											</Button>
										</>
									)}
								</div>
							</Paper>

							{/* Card 4: Article Metadata Card */}
							<Paper className="p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
								<div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
									<div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
										<FuseSvgIcon size={22}>heroicons-outline:sparkles</FuseSvgIcon>
									</div>
									<div>
										<h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
											Publishing Status
										</h3>
										<p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
											Live visibility and editorial stats
										</p>
									</div>
								</div>

								<div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-400">
									<div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
										<span>Status:</span>
										<Chip
											size="small"
											label={isEdit ? 'PUBLISHED' : 'DRAFT'}
											color={isEdit ? 'success' : 'default'}
											className="text-[10px] font-bold h-5"
										/>
									</div>
									<div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
										<span>Total Character Count:</span>
										<span className="font-semibold text-slate-800 dark:text-slate-200">
											{blogTitle.length + shortDescription.length}
										</span>
									</div>
									<div className="flex items-center justify-between py-2">
										<span>Target Audience:</span>
										<span className="font-semibold text-slate-800 dark:text-slate-200">Amazon Sellers</span>
									</div>
								</div>
							</Paper>
						</div>
					</div>
				</form>
			</div>

			{/* Sticky Bottom Actions Bar */}
			<div className="sticky bottom-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 md:px-8 lg:px-10 py-3.5 shadow-lg">
				<div className="w-full flex items-center justify-between gap-4">
					<div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
						<FuseSvgIcon size={16} className="text-slate-400">
							heroicons-outline:information-circle
						</FuseSvgIcon>
						<span>
							{isEdit ? 'Published updates will instantly reflect on the public website.' : 'Your article will be published to the blog marketplace index.'}
						</span>
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto justify-end">
						<Button
							variant="outlined"
							color="inherit"
							onClick={() => navigate('/blogs')}
							disabled={isSubmitting}
							className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 normal-case px-5 py-2 font-medium"
						>
							Cancel
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={() => handleSubmit()}
							disabled={isSubmitting}
							startIcon={
								isSubmitting ? (
									<CircularProgress size={16} color="inherit" />
								) : (
									<FuseSvgIcon size={18}>
										{isEdit ? 'heroicons-outline:check' : 'heroicons-outline:arrow-up-tray'}
									</FuseSvgIcon>
								)
							}
							className="normal-case px-6 py-2 font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30"
						>
							{isSubmitting ? (isEdit ? 'Updating Article...' : 'Publishing Article...') : isEdit ? 'Update Article' : 'Publish Article'}
						</Button>
					</div>
				</div>
			</div>

			{/* Fullscreen Image Preview Dialog */}
			<Dialog
				open={Boolean(previewModalUrl)}
				onClose={() => setPreviewModalUrl(null)}
				maxWidth="md"
				fullWidth
			>
				<div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
					<span className="font-bold text-sm text-slate-800 dark:text-slate-200">{previewModalTitle}</span>
					<IconButton size="small" onClick={() => setPreviewModalUrl(null)}>
						<FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
					</IconButton>
				</div>
				<DialogContent className="p-4 flex items-center justify-center bg-slate-900">
					{previewModalUrl && (
						<img
							src={previewModalUrl}
							alt="Preview"
							className="max-h-[70vh] max-w-full object-contain rounded-lg"
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
