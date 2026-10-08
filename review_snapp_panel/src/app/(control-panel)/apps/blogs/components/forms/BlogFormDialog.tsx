import React, { useState, useEffect, useRef } from 'react';
import {
	Dialog,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Typography,
	IconButton,
	CircularProgress,
	Tooltip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import LexicalEditor from '@/components/LexicalEditor/LexicalEditor';
import { getImageUrl } from '@/configs/env';
import { useCreateBlog, useUpdateBlog, useUploadBlogImage } from '../../api/hooks/useBlogs';
import { Blog } from '../../api/services/blogsApiService';

interface ImageItem {
	id: string;
	relativePath: string;
	previewUrl: string;
	isUploading?: boolean;
}

interface BlogFormDialogProps {
	open: boolean;
	onClose: () => void;
	blog?: Blog | null;
}

export default function BlogFormDialog({ open, onClose, blog }: BlogFormDialogProps) {
	const { enqueueSnackbar } = useSnackbar();
	const createMutation = useCreateBlog();
	const updateMutation = useUpdateBlog();
	const uploadMutation = useUploadBlogImage();

	const isEdit = Boolean(blog);

	const [blogTitle, setBlogTitle] = useState('');
	const [shortDescription, setShortDescription] = useState('');
	const [descriptionJson, setDescriptionJson] = useState<any>(null);
	const [images, setImages] = useState<ImageItem[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
	const [previewModalTitle, setPreviewModalTitle] = useState<string>('');
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

	// Populate form state when editing or resetting
	useEffect(() => {
		if (open) {
			if (blog) {
				setBlogTitle(blog.blog_title || '');
				setShortDescription(blog.short_description || '');
				setDescriptionJson(blog.description || null);

				// Prepare existing images using getImageUrl for full URL resolution
				const initialImages: ImageItem[] = (blog.description_images || []).map((relPath, index) => {
					const backendUrl =
						blog.full_image_urls && blog.full_image_urls[index]
							? blog.full_image_urls[index]
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
			} else {
				// Reset form for create
				setBlogTitle('');
				setShortDescription('');
				setDescriptionJson(null);
				setImages([]);
			}
		}
	}, [open, blog]);

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
				enqueueSnackbar('Image uploaded successfully', { variant: 'success', autoHideDuration: 2000 });
			}
		} catch (error: any) {
			const errMsg = error?.message || 'Failed to upload image';
			enqueueSnackbar(errMsg, { variant: 'error' });
			setImages((prev) =>
				prev.map((item) => (item.id === rowId ? { ...item, isUploading: false } : item))
			);
		}
	};

	// Handle image upload from within Lexical Editor (paste or toolbar insert)
	const handleEditorUploadImage = async (file: File) => {
		const res = await uploadMutation.mutateAsync(file);
		if (res?.data) {
			const fullUrl = getImageUrl(res.data.url || res.data.relativePath);
			setImages((prev) => {
				if (prev.some((img) => img.relativePath === res.data.relativePath)) {
					return prev;
				}
				return [
					...prev,
					{
						id: `editor-img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
						relativePath: res.data.relativePath,
						previewUrl: fullUrl,
						isUploading: false
					}
				];
			});
			return {
				relativePath: res.data.relativePath,
				url: fullUrl
			};
		}
		throw new Error('Failed to get uploaded image response');
	};

	// Remove image row
	const handleRemoveImageRow = (rowId: string) => {
		setImages((prev) => prev.filter((item) => item.id !== rowId));
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!blogTitle.trim()) {
			enqueueSnackbar('Blog title is required', { variant: 'error' });
			return;
		}

		const relativeImagePaths = images
			.filter((img) => img.relativePath && !img.isUploading)
			.map((img) => img.relativePath);

		setIsSubmitting(true);

		try {
			if (isEdit && (blog?._id || blog?.id)) {
				const blogId = (blog._id || blog.id) as string;
				await updateMutation.mutateAsync({
					blogId,
					payload: {
						blog_title: blogTitle.trim(),
						short_description: shortDescription.trim(),
						description: descriptionJson,
						description_images: relativeImagePaths
					}
				});
				enqueueSnackbar('Blog updated successfully', { variant: 'success', autoHideDuration: 2000 });
			} else {
				await createMutation.mutateAsync({
					blog_title: blogTitle.trim(),
					short_description: shortDescription.trim(),
					description: descriptionJson,
					description_images: relativeImagePaths,
					status: 1
				});
				enqueueSnackbar('Blog created successfully', { variant: 'success', autoHideDuration: 2000 });
			}
			onClose();
		} catch (err: any) {
			const errMsg = err?.message || (isEdit ? 'Failed to update blog' : 'Failed to create blog');
			enqueueSnackbar(errMsg, { variant: 'error' });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: 'hidden',
					p: 0,
					maxHeight: 'calc(100vh - 48px)',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					m: { xs: 1.5, sm: 2 }
				}
			}}
		>
			<form
				onSubmit={handleSubmit}
				className="flex flex-col h-full min-h-0 overflow-hidden"
				style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}
			>
				{/* Top Deep Navy Banner Header */}
				<div className="bg-primary-700 text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="flex items-center justify-center w-7 h-7 rounded bg-white/20 shrink-0">
							<FuseSvgIcon size={18} className="text-white">
								heroicons-outline:newspaper
							</FuseSvgIcon>
						</div>
						<h1 className="text-base sm:text-lg font-bold text-white m-0 truncate">
							{isEdit ? 'Edit Blog' : 'Create Blog'}
						</h1>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md border border-white/20 transition-colors cursor-pointer shrink-0"
					>
						<FuseSvgIcon size={14}>heroicons-outline:arrow-left</FuseSvgIcon>
						<span>Back to Blogs</span>
					</button>
				</div>

				<DialogContent
					className="p-4 sm:p-6 flex flex-col gap-5 bg-gray-50/50"
					sx={{
						flex: '1 1 auto',
						overflowY: 'auto',
						overflowX: 'auto',
						minHeight: 0
					}}
				>
					{/* Card 1: Basic Information */}
					<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
						<div className="flex items-center gap-2 mb-4 text-xs font-bold text-primary-700 uppercase tracking-wider">
							<FuseSvgIcon size={18} className="text-primary-700">
								heroicons-outline:information-circle
							</FuseSvgIcon>
							<span>Basic Information</span>
						</div>

						<div className="flex flex-col gap-4">
							<div>
								<Typography className="text-xs font-semibold text-gray-700 mb-1">
									Blog Title <span className="text-red-500">*</span>
								</Typography>
								<TextField
									fullWidth
									required
									placeholder="Enter compelling blog headline..."
									value={blogTitle}
									onChange={(e) => setBlogTitle(e.target.value)}
									variant="outlined"
									size="small"
								/>
							</div>

							<div>
								<Typography className="text-xs font-semibold text-gray-700 mb-1">
									Short Description (Excerpt)
								</Typography>
								<TextField
									fullWidth
									multiline
									rows={2}
									placeholder="Brief summary for blog cards and preview lists..."
									value={shortDescription}
									onChange={(e) => setShortDescription(e.target.value)}
									variant="outlined"
									size="small"
								/>
							</div>
						</div>
					</div>

					{/* Card 2: Blog Content (Rich Text) */}
					<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
						<div className="flex items-center gap-2 mb-4 text-xs font-bold text-primary-700 uppercase tracking-wider">
							<FuseSvgIcon size={18} className="text-primary-700">
								heroicons-outline:document-text
							</FuseSvgIcon>
							<span>Article Content</span>
						</div>

						<LexicalEditor
							key={blog ? (blog._id || blog.id) : 'new-blog-editor'}
							value={descriptionJson}
							onChange={(json) => setDescriptionJson(json)}
							onUploadImage={handleEditorUploadImage}
							placeholder="Write your comprehensive blog article here or paste images directly (Ctrl+V)..."
							minHeight={260}
						/>
					</div>

					{/* Card 3: Media & Images */}
					<div className="bg-white border border-gray-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
								<FuseSvgIcon size={18} className="text-primary-700">
									heroicons-outline:photo
								</FuseSvgIcon>
								<span>Supporting Images & Media</span>
							</div>

							<button
								type="button"
								onClick={handleAddImageRow}
								className="flex items-center gap-1 px-3 py-1 bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold rounded-md border-0 transition-colors shadow-xs cursor-pointer"
							>
								<FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>
								<span>Add Image</span>
							</button>
						</div>

						{images.length === 0 ? (
							<div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center bg-gray-50">
								<Typography className="text-xs text-gray-400">
									No images added yet. Click &quot;Add Image&quot; to upload screenshots, banners, or illustrations.
								</Typography>
							</div>
						) : (
							<div className="flex flex-col gap-2.5">
								{images.map((item, idx) => (
									<div
										key={item.id}
										className="flex items-center gap-3 bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
									>
										<span className="text-xs font-bold text-gray-400 w-5 text-center">
											#{idx + 1}
										</span>

										{item.previewUrl ? (
											<Tooltip title="Click to view large preview" arrow>
												<div
													onClick={() => {
														setPreviewModalUrl(item.previewUrl);
														setPreviewModalTitle(item.relativePath || `Image #${idx + 1}`);
													}}
													className="group relative h-12 w-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary-700 transition-all"
												>
													<img
														src={item.previewUrl}
														alt={`Uploaded ${idx + 1}`}
														className="h-full w-full object-cover"
													/>
													<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
														<FuseSvgIcon size={16} className="text-white">
															heroicons-outline:magnifying-glass-plus
														</FuseSvgIcon>
													</div>
												</div>
											</Tooltip>
										) : (
											<div className="h-12 w-16 rounded-md border border-dashed border-gray-300 flex items-center justify-center bg-white shrink-0">
												{item.isUploading ? (
													<CircularProgress size={16} />
												) : (
													<FuseSvgIcon size={18} className="text-gray-400">
														heroicons-outline:photo
													</FuseSvgIcon>
												)}
											</div>
										)}

										<div className="flex-1 min-w-0">
											{item.relativePath ? (
												<div>
													<Typography className="text-xs font-medium text-gray-800 truncate">
														{item.relativePath}
													</Typography>
													<span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
														<FuseSvgIcon size={12} className="text-emerald-600">heroicons-solid:check</FuseSvgIcon>
														Uploaded
													</span>
												</div>
											) : (
												<div>
													<input
														type="file"
														accept="image/*"
														ref={(el) => {
															fileInputRefs.current[item.id] = el;
														}}
														onChange={(e) => handleFileChange(item.id, e)}
														className="hidden"
														id={`file-input-${item.id}`}
													/>
													<label htmlFor={`file-input-${item.id}`}>
														<Button
															component="span"
															variant="outlined"
															size="small"
															disabled={item.isUploading}
															startIcon={
																item.isUploading ? (
																	<CircularProgress size={14} />
																) : (
																	<FuseSvgIcon size={16}>heroicons-outline:arrow-up-tray</FuseSvgIcon>
																)
															}
															className="text-xs capitalize rounded-md"
														>
															{item.isUploading ? 'Uploading...' : 'Choose Image'}
														</Button>
													</label>
												</div>
											)}
										</div>

										<Tooltip title="Remove image">
											<IconButton
												size="small"
												onClick={() => handleRemoveImageRow(item.id)}
												className="text-gray-400 hover:text-red-600"
											>
												<FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
											</IconButton>
										</Tooltip>
									</div>
								))}
							</div>
						)}
					</div>
				</DialogContent>

				{/* Bottom Action Footer */}
				<DialogActions
					className="px-4 sm:px-6 py-3 bg-slate-50/90 border-t border-slate-200 flex justify-end gap-3 shrink-0"
					sx={{
						flexShrink: 0,
						borderTop: '1px solid #e2e8f0',
						bgcolor: '#f8fafc',
						px: { xs: 2, sm: 3 },
						py: 1.5
					}}
				>
					<Button
						onClick={onClose}
						disabled={isSubmitting}
						className="capitalize text-slate-700 hover:bg-slate-100 rounded-xl px-4 sm:px-5 py-2 border border-slate-300 font-semibold text-xs sm:text-sm"
						sx={{
							borderRadius: '12px',
							textTransform: 'capitalize'
						}}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={isSubmitting}
						className="bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-xl px-5 sm:px-7 py-2 shadow-sm transition-all capitalize text-xs sm:text-sm disabled:opacity-50"
						startIcon={
							isSubmitting ? (
								<CircularProgress size={16} color="inherit" />
							) : (
								<FuseSvgIcon size={18}>lucide:save</FuseSvgIcon>
							)
						}
						sx={{
							bgcolor: 'primary.main',
							'&:hover': { bgcolor: 'primary.dark' },
							borderRadius: '12px',
							textTransform: 'capitalize',
							px: { xs: 2.5, sm: 3.5 },
							py: 1
						}}
					>
						{isSubmitting ? 'Saving...' : isEdit ? 'Update Blog' : 'Create Blog'}
					</Button>
				</DialogActions>
			</form>

			{/* Full Size Image Preview Dialog */}
			<Dialog
				open={Boolean(previewModalUrl)}
				onClose={() => setPreviewModalUrl(null)}
				maxWidth="lg"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 3,
						overflow: 'hidden',
						bgcolor: 'background.paper',
						p: 0
					}
				}}
			>
				<Box className="flex items-center justify-between px-5 py-3.5 bg-primary-700 text-white">
					<div className="flex items-center gap-2.5 max-w-[80%]">
						<FuseSvgIcon size={18} className="text-white">
							heroicons-outline:photo
						</FuseSvgIcon>
						<Typography className="text-sm font-bold text-white truncate">
							{previewModalTitle || 'Image Preview'}
						</Typography>
					</div>
					<IconButton
						size="small"
						onClick={() => setPreviewModalUrl(null)}
						className="text-white/80 hover:text-white"
					>
						<FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
					</IconButton>
				</Box>
				<DialogContent className="p-4 sm:p-6 flex items-center justify-center bg-gray-50 min-h-[320px] max-h-[80vh] overflow-auto">
					{previewModalUrl && (
						<img
							src={previewModalUrl}
							alt={previewModalTitle || 'Blog Image'}
							className="max-h-[74vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-gray-200"
						/>
					)}
				</DialogContent>
			</Dialog>
		</Dialog>
	);
}

