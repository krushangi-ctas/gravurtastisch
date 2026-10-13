import React, { useState, useMemo } from 'react';
import {
	Dialog,
	DialogContent,
	IconButton,
	Button
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import moment from 'moment';
import { getImageUrl } from '@/configs/env';
import { Blog } from '../../api/services/blogsApiService';

interface BlogPreviewDialogProps {
	open: boolean;
	onClose: () => void;
	blog: Blog | null;
}

interface LexicalNode {
	type: string;
	text?: string;
	format?: number;
	tag?: string;
	url?: string;
	src?: string;
	altText?: string;
	listType?: string;
	children?: LexicalNode[];
	[key: string]: any;
}

function LexicalImage({ src, altText }: { src: string; altText?: string }) {
	const [hasError, setHasError] = React.useState(false);
	if (hasError || !src) return null;

	return (
		<div className="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg bg-slate-900/5">
			<img
				src={src}
				alt={altText || 'Article visual'}
				className="w-full max-h-[480px] object-contain block mx-auto"
				loading="lazy"
				onError={() => setHasError(true)}
			/>
			{altText && (
				<p className="text-center text-xs text-slate-500 py-2 px-4 bg-slate-100 border-t border-slate-200">
					{altText}
				</p>
			)}
		</div>
	);
}

function renderTextNode(node: LexicalNode, key: number | string) {
	let content: React.ReactNode = node.text || '';
	const format = node.format || 0;

	if (format & 1) content = <strong key="b" className="font-bold text-slate-900">{content}</strong>;
	if (format & 2) content = <em key="i" className="italic">{content}</em>;
	if (format & 8) content = <u key="u" className="underline underline-offset-2">{content}</u>;
	if (format & 4) content = <s key="s" className="line-through">{content}</s>;

	return <React.Fragment key={key}>{content}</React.Fragment>;
}

function renderChildren(children?: LexicalNode[]): React.ReactNode {
	if (!children || !Array.isArray(children)) return null;

	return children.map((child, index) => {
		if (!child) return null;

		if (child.type === 'text') {
			return renderTextNode(child, index);
		}

		if (child.type === 'link' || child.type === 'autolink') {
			return (
				<a
					key={index}
					href={child.url || '#'}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
				>
					{renderChildren(child.children)}
				</a>
			);
		}

		if (child.type === 'image') {
			return <LexicalImage key={index} src={child.src || ''} altText={child.altText} />;
		}

		return renderChildren(child.children);
	});
}

function renderBlockNode(node: LexicalNode, index: number) {
	if (!node) return null;

	switch (node.type) {
		case 'heading': {
			const tag = node.tag || 'h2';
			const classes =
				tag === 'h1'
					? 'text-2xl sm:text-3xl font-extrabold text-slate-900 mt-8 mb-3 tracking-tight'
					: tag === 'h2'
						? 'text-xl sm:text-2xl font-bold text-slate-900 mt-6 mb-3 tracking-tight'
						: 'text-lg sm:text-xl font-semibold text-slate-900 mt-5 mb-2.5 tracking-tight';

			if (tag === 'h1') return <h1 key={index} className={classes}>{renderChildren(node.children)}</h1>;
			if (tag === 'h3') return <h3 key={index} className={classes}>{renderChildren(node.children)}</h3>;
			if (tag === 'h4') return <h4 key={index} className={classes}>{renderChildren(node.children)}</h4>;
			if (tag === 'h5') return <h5 key={index} className={classes}>{renderChildren(node.children)}</h5>;
			if (tag === 'h6') return <h6 key={index} className={classes}>{renderChildren(node.children)}</h6>;
			return <h2 key={index} className={classes}>{renderChildren(node.children)}</h2>;
		}

		case 'paragraph': {
			const firstChild = node.children?.[0];
			if (node.children?.length === 1 && firstChild?.type === 'image') {
				return renderChildren(node.children);
			}
			return (
				<p key={index} className="mb-4 text-base leading-relaxed text-slate-600">
					{renderChildren(node.children)}
				</p>
			);
		}

		case 'quote':
			return (
				<blockquote
					key={index}
					className="border-l-4 border-blue-500 pl-4 py-2.5 my-5 text-slate-700 bg-blue-50/50 rounded-r-xl italic text-base"
				>
					{renderChildren(node.children)}
				</blockquote>
			);

		case 'list': {
			const isOrdered = node.listType === 'number' || node.tag === 'ol';
			const ListTag = isOrdered ? 'ol' : 'ul';
			const listClasses = isOrdered
				? 'list-decimal pl-6 space-y-2 mb-5 text-base text-slate-600'
				: 'list-disc pl-6 space-y-2 mb-5 text-base text-slate-600';

			return (
				<ListTag key={index} className={listClasses}>
					{node.children?.map((item: any, itemIdx: number) => (
						<li key={itemIdx} className="leading-relaxed">
							{renderChildren(item.children)}
						</li>
					))}
				</ListTag>
			);
		}

		case 'image':
			return <LexicalImage key={index} src={node.src || ''} altText={node.altText} />;

		default:
			return (
				<div key={index} className="mb-4">
					{renderChildren(node.children)}
				</div>
			);
	}
}

function PreviewContentRenderer({ content }: { content?: any }) {
	if (!content) {
		return <p className="text-slate-400 italic">No content available.</p>;
	}

	let parsedContent = content;
	if (typeof content === 'string') {
		try {
			parsedContent = JSON.parse(content);
		} catch {
			parsedContent = null;
		}
	}

	if (parsedContent?.root?.children && Array.isArray(parsedContent.root.children)) {
		return (
			<div className="prose-content max-w-none">
				{parsedContent.root.children.map((childNode: LexicalNode, i: number) =>
					renderBlockNode(childNode, i)
				)}
			</div>
		);
	}

	if (typeof content === 'string') {
		const isHtml = /<[a-z][\s\S]*>/i.test(content);
		if (isHtml) {
			return (
				<div
					className="prose max-w-none leading-relaxed"
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			);
		}

		return <div className="whitespace-pre-line text-slate-600 leading-relaxed">{content}</div>;
	}

	return <p className="text-slate-400 italic">Unable to display content format.</p>;
}

export default function BlogPreviewDialog({ open, onClose, blog }: BlogPreviewDialogProps) {
	const [activeImageIndex, setActiveImageIndex] = useState(0);
	const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

	// Extract full image URLs
	const articleImages = useMemo(() => {
		if (!blog) return [];
		const list: string[] = [];

		if (blog.full_image_urls && Array.isArray(blog.full_image_urls)) {
			blog.full_image_urls.forEach((url) => {
				if (url && typeof url === 'string') {
					const resolved = getImageUrl(url);
					if (resolved && !list.includes(resolved)) list.push(resolved);
				}
			});
		}
		if (blog.description_images && Array.isArray(blog.description_images)) {
			blog.description_images.forEach((img) => {
				if (img) {
					const resolved = getImageUrl(img);
					if (resolved && !list.includes(resolved)) list.push(resolved);
				}
			});
		}
		return list;
	}, [blog]);

	const validImages = useMemo(() => {
		return articleImages.filter((url) => !failedImages[url]);
	}, [articleImages, failedImages]);

	React.useEffect(() => {
		if (open) {
			setActiveImageIndex(0);
			setFailedImages({});
		}
	}, [open, blog]);

	if (!blog) return null;

	const wordCount = (
		(blog.short_description || '') +
		' ' +
		(typeof blog.description === 'string' ? blog.description : JSON.stringify(blog.description || ''))
	)
		.trim()
		.split(/\s+/).length;
	const readingTime = Math.max(2, Math.ceil(wordCount / 180));
	const formattedDate = blog.createdAt
		? moment(blog.createdAt).format('MMMM DD, YYYY')
		: 'Recently Published';

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			scroll="paper"
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: 'hidden',
					maxHeight: '92vh',
					bgcolor: '#f8fafc'
				}
			}}
		>
			{/* Top Preview Bar in Secondary Tan */}
			<div className="bg-secondary-500 text-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-secondary-600 shadow-sm">
				<div className="flex items-center gap-2.5">
					<div className="h-7 w-7 rounded-lg bg-black/10 text-slate-900 flex items-center justify-center">
						<FuseSvgIcon size={18} className="text-slate-900">heroicons-outline:eye</FuseSvgIcon>
					</div>
					<div>
						<span className="text-[11px] uppercase tracking-wider text-slate-800 font-semibold">
							Live Website Preview
						</span>
						<h3 className="text-sm font-bold text-slate-900 truncate max-w-md m-0">
							{blog.blog_title}
						</h3>
					</div>
					<span
						className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${blog.status === 1
								? 'bg-emerald-600/20 text-emerald-900 border border-emerald-600/40'
								: 'bg-rose-600/20 text-rose-900 border border-rose-600/40'
							}`}
					>
						{blog.status === 1 ? 'Active' : 'Inactive'}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<IconButton
						onClick={onClose}
						size="small"
						className="text-slate-900 hover:bg-black/10 transition-colors"
					>
						<FuseSvgIcon size={20} className="text-slate-900">heroicons-outline:x-mark</FuseSvgIcon>
					</IconButton>
				</div>
			</div>

			<DialogContent className="p-0 overflow-y-auto">
				{/* ==================================================== */}
				{/* 1. HERO SECTION (MATCHING WEBSITE BLOG DESIGN) */}
				{/* ==================================================== */}
				<section className="relative px-6 py-10 sm:px-12 sm:py-14 bg-gradient-to-b from-[#101726] via-[#162035] to-[#1c2840] text-white border-b border-white/10 overflow-hidden">
					<div className="absolute -top-24 right-1/4 w-80 h-80 bg-[#D2B48C]/20 rounded-full blur-[120px] pointer-events-none" />
					<div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />

					<div className="relative max-w-4xl mx-auto text-left">
						{/* Navigation back simulation */}
						<div className="mb-6">
							<span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
								<FuseSvgIcon size={14} className="text-[#DECAA8]">heroicons-outline:arrow-left</FuseSvgIcon>
								Back to all articles
							</span>
						</div>

						{/* Category / Badge */}
						<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D2B48C]/20 border border-[#D2B48C]/40 text-[#DECAA8] text-xs font-semibold uppercase tracking-wider mb-5 backdrop-blur-md">
							<FuseSvgIcon size={14}>heroicons-outline:sparkles</FuseSvgIcon>
							<span>Studio craft &amp; personalization</span>
						</div>

						{/* Title */}
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white font-display">
							{blog.blog_title}
						</h1>

						{/* Short Summary */}
						{blog.short_description && (
							<p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
								{blog.short_description}
							</p>
						)}

						{/* Metadata Bar */}
						<div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-6 text-sm text-slate-400">
							<div className="flex items-center gap-4">
								<div className="relative h-11 w-11 rounded-2xl bg-[#282828] border border-white/20 flex items-center justify-center p-2 shadow-md shrink-0">
									<span className="font-extrabold text-base text-[#D2B48C]">G</span>
								</div>
								<div>
									<div className="font-semibold text-white flex items-center gap-1.5 text-sm">
										Gravurtastisch Editorial Team
										<FuseSvgIcon size={16} className="text-[#DECAA8]">heroicons-solid:check-badge</FuseSvgIcon>
									</div>
									<div className="text-xs text-slate-400">
										Custom engraving &amp; order fulfillment
									</div>
								</div>
							</div>

							<div className="flex items-center gap-6 text-xs sm:text-sm text-slate-300">
								<div className="flex items-center gap-2">
									<FuseSvgIcon size={16} className="text-[#DECAA8]">heroicons-outline:calendar</FuseSvgIcon>
									<span>{formattedDate}</span>
								</div>
								<div className="flex items-center gap-2">
									<FuseSvgIcon size={16} className="text-amber-400">heroicons-outline:clock</FuseSvgIcon>
									<span>{readingTime} min read</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* ==================================================== */}
				{/* 2. ARTICLE BODY + SIDEBAR */}
				{/* ==================================================== */}
				<section className="py-8 px-4 sm:px-8 max-w-5xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
						{/* Main Content Column */}
						<div className="lg:col-span-8">
							<article className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
								{/* Blog Image(s) / Carousel Gallery */}
								{validImages.length > 0 && (
									<div className="mb-8 select-none">
										{validImages.length === 1 ? (
											<div className="rounded-xl overflow-hidden border border-slate-200 shadow-md bg-slate-900/5">
												<img
													src={validImages[0]}
													alt={blog.blog_title}
													className="w-full max-h-[480px] object-contain block mx-auto"
													loading="lazy"
													onError={() => {
														setFailedImages((prev) => ({ ...prev, [validImages[0]]: true }));
													}}
												/>
											</div>
										) : (
											<div className="space-y-3">
												<div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-slate-900/5 group">
													{(() => {
														const safeIndex = Math.min(
															activeImageIndex,
															validImages.length - 1
														);
														const currentImg = validImages[safeIndex] || validImages[0];
														return (
															<div className="flex items-center justify-center min-h-[260px] max-h-[480px] w-full bg-slate-950/10">
																<img
																	src={currentImg}
																	alt={`${blog.blog_title} - visual ${safeIndex + 1}`}
																	className="w-full max-h-[480px] object-contain block mx-auto transition-opacity duration-300"
																	loading="lazy"
																	onError={() => {
																		setFailedImages((prev) => ({
																			...prev,
																			[currentImg]: true
																		}));
																	}}
																/>
															</div>
														);
													})()}

													{/* Prev Arrow */}
													<button
														type="button"
														onClick={() =>
															setActiveImageIndex((prev) =>
																prev > 0 ? prev - 1 : validImages.length - 1
															)
														}
														className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
														aria-label="Previous"
													>
														<FuseSvgIcon size={18}>heroicons-outline:chevron-left</FuseSvgIcon>
													</button>

													{/* Next Arrow */}
													<button
														type="button"
														onClick={() =>
															setActiveImageIndex((prev) =>
																prev < validImages.length - 1 ? prev + 1 : 0
															)
														}
														className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
														aria-label="Next"
													>
														<FuseSvgIcon size={18}>heroicons-outline:chevron-right</FuseSvgIcon>
													</button>

													{/* Counter */}
													<div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-semibold">
														{Math.min(activeImageIndex, validImages.length - 1) + 1} /{' '}
														{validImages.length}
													</div>
												</div>

												{/* Thumbnail strip */}
												<div className="flex items-center gap-2 overflow-x-auto py-1">
													{validImages.map((imgSrc: string, idx: number) => (
														<button
															key={imgSrc}
															type="button"
															onClick={() => setActiveImageIndex(idx)}
															className={`relative shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${Math.min(activeImageIndex, validImages.length - 1) === idx
																	? 'border-blue-600 shadow-sm ring-2 ring-blue-400/40 scale-105'
																	: 'border-slate-200 opacity-60 hover:opacity-100'
																}`}
														>
															<img
																src={imgSrc}
																alt={`Thumbnail ${idx + 1}`}
																className="w-full h-full object-cover"
																onError={() => {
																	setFailedImages((prev) => ({ ...prev, [imgSrc]: true }));
																}}
															/>
														</button>
													))}
												</div>
											</div>
										)}
									</div>
								)}

								{/* Render Rich Lexical / HTML Content */}
								<div className="article-body">
									<PreviewContentRenderer content={blog.description} />
								</div>

								{/* Bottom CTA Banner (Matching Website) */}
								<div className="mt-12 pt-8 border-t border-slate-100">
									<div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
										<div>
											<h4 className="font-bold text-slate-900 text-base">
												Ready to put custom orders on a clear studio path?
											</h4>
											<p className="text-xs sm:text-sm text-slate-500 mt-1">
												Gravurtastisch connects intake, proofs, and production so every mug and engraved piece ships as promised.
											</p>
										</div>
										<span className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-500 hover:bg-secondary-light text-slate-900 text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-secondary/20 cursor-pointer">
											<span>Start a custom order</span>
											<FuseSvgIcon size={14}>heroicons-outline:arrow-right</FuseSvgIcon>
										</span>
									</div>
								</div>
							</article>
						</div>

						{/* Sidebar Column (Matching Website Blog Sidebar) */}
						<div className="lg:col-span-4 space-y-6">
							{/* Studio Craft Workflow Card */}
							<div className="p-6 rounded-3xl bg-gradient-to-br from-[#101726] via-[#162035] to-[#D2B48C]/30 text-white border border-[#D2B48C]/30 shadow-xl relative overflow-hidden">
								<div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D2B48C]/30 rounded-full blur-2xl pointer-events-none" />
								<div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
								<div className="h-10 w-10 rounded-xl bg-[#D2B48C]/25 flex items-center justify-center mb-4 text-[#DECAA8] border border-[#D2B48C]/40 shadow-sm">
									<FuseSvgIcon size={20}>heroicons-solid:shield-check</FuseSvgIcon>
								</div>
								<h3 className="text-lg font-bold font-display text-white">
									Craft-quality workflow
								</h3>
								<p className="mt-2 text-xs leading-relaxed text-slate-300">
									Every personalized job flows through Gravurtastisch with proof approval, encrypted artwork storage, and scheduled bench time — no guesswork on the shop floor.
								</p>

								<ul className="mt-4 space-y-2 text-xs text-slate-300">
									<li className="flex items-center gap-2">
										<FuseSvgIcon size={14} className="text-[#DECAA8] shrink-0">heroicons-solid:bolt</FuseSvgIcon>
										<span>Proof-before-production on every SKU</span>
									</li>
									<li className="flex items-center gap-2">
										<FuseSvgIcon size={14} className="text-[#DECAA8] shrink-0">heroicons-solid:bolt</FuseSvgIcon>
										<span>Encrypted uploads &amp; scoped shop tokens</span>
									</li>
									<li className="flex items-center gap-2">
										<FuseSvgIcon size={14} className="text-[#DECAA8] shrink-0">heroicons-solid:bolt</FuseSvgIcon>
										<span>Webshop, wholesale &amp; counter orders</span>
									</li>
								</ul>

								<div className="mt-6 pt-4 border-t border-white/10">
									<div className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
										<span>Start a custom order</span>
										<FuseSvgIcon size={14}>heroicons-outline:arrow-right</FuseSvgIcon>
									</div>
								</div>
							</div>

							{/* More Studio Reads */}
							<div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-lg">
								<h3 className="text-base font-bold font-display text-slate-900 mb-4 flex items-center gap-2">
									<FuseSvgIcon size={18} className="text-secondary-dark">heroicons-outline:book-open</FuseSvgIcon>
									<span>More studio reads</span>
								</h3>

								<div className="space-y-3">
									<div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
										<h5 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
											Care Guide: Preserving Laser-Engraved Acacia Wood Boards
										</h5>
										<div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
											<span>Studio Guide</span>
											<span>•</span>
											<span className="text-secondary-dark font-medium flex items-center gap-0.5 group-hover:underline">
												Read <FuseSvgIcon size={10}>heroicons-outline:arrow-right</FuseSvgIcon>
											</span>
										</div>
									</div>
									<div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
										<h5 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
											Designing Monograms &amp; Vector Proofs for Stainless Steel Tumblers
										</h5>
										<div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
											<span>Studio Guide</span>
											<span>•</span>
											<span className="text-secondary-dark font-medium flex items-center gap-0.5 group-hover:underline">
												Read <FuseSvgIcon size={10}>heroicons-outline:arrow-right</FuseSvgIcon>
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</DialogContent>
		</Dialog>
	);
}
