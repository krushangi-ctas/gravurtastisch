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
			{/* Top Preview Bar in Primary Color */}
			<div className="bg-primary-700 text-white px-5 py-3.5 flex items-center justify-between border-b border-primary-800 shadow-sm">
				<div className="flex items-center gap-2.5">
					<div className="h-7 w-7 rounded-lg bg-white/15 text-white flex items-center justify-center">
						<FuseSvgIcon size={18}>heroicons-outline:eye</FuseSvgIcon>
					</div>
					<div>
						<span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
							Live Website Preview
						</span>
						<h3 className="text-sm font-bold text-white truncate max-w-md m-0">
							{blog.blog_title}
						</h3>
					</div>
					<span
						className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${blog.status === 1
								? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
								: 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
							}`}
					>
						{blog.status === 1 ? 'Active' : 'Inactive'}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<IconButton
						onClick={onClose}
						size="small"
						className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
					>
						<FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
					</IconButton>
				</div>
			</div>

			<DialogContent className="p-0 overflow-y-auto">
				{/* ==================================================== */}
				{/* 1. HERO SECTION (DARK NAVY GRADIENT) */}
				{/* ==================================================== */}
				<section className="relative px-6 py-10 sm:px-12 sm:py-14 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-white/10 overflow-hidden">
					<div className="relative max-w-3xl mx-auto text-left">
						{/* Category / Badge */}
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
							<span>Seller Intelligence & SP-API Strategy</span>
						</div>

						{/* Title */}
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white font-display">
							{blog.blog_title}
						</h1>

						{/* Short Summary */}
						{blog.short_description && (
							<p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
								{blog.short_description}
							</p>
						)}

						{/* Metadata Bar */}
						<div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-slate-400">
							<div className="flex items-center gap-3">
								<div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#613EA3] to-[#E89B5C] flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white/10">
									G
								</div>
								<div>
									<div className="font-semibold text-white flex items-center gap-1.5 text-xs sm:text-sm">
										Gravurtastisch Studio
										<FuseSvgIcon size={15} className="text-emerald-400">heroicons-solid:check-badge</FuseSvgIcon>
										<span className="text-emerald-400 text-xs">Verified</span>
									</div>
									<div className="text-[11px] text-slate-400">
										Engraving &amp; Custom Order Studio
									</div>
								</div>
							</div>

							<div className="flex items-center gap-4 text-xs text-slate-300">
								<div className="flex items-center gap-1.5">
									<FuseSvgIcon size={15} className="text-blue-400">heroicons-outline:calendar</FuseSvgIcon>
									<span>{formattedDate}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<FuseSvgIcon size={15} className="text-cyan-400">heroicons-outline:clock</FuseSvgIcon>
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

								{/* Bottom CTA Banner */}
								<div className="mt-10 pt-6 border-t border-slate-100">
									<div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
										<div>
											<h4 className="font-bold text-slate-900 text-sm">
												Ready to place a custom order?
											</h4>
											<p className="text-xs text-slate-500 mt-0.5">
												Gravurtastisch helps you manage custom engraving and personalisation orders end to end.
											</p>
										</div>
										<Button
											variant="contained"
											size="small"
											className="bg-[#613EA3] hover:bg-[#452B78] text-white normal-case font-semibold text-xs px-4 py-2 rounded-lg"
										>
											Place Custom Order
										</Button>
									</div>
								</div>
							</article>
						</div>

						{/* Sidebar Column */}
						<div className="lg:col-span-4 space-y-6">
							{/* Amazon TOS Compliant Card */}
							<div className="rounded-2xl p-6 bg-gradient-to-b from-[#2A1848] to-[#452B78] text-white border border-white/10 shadow-lg">
								<div className="h-10 w-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-4">
									<FuseSvgIcon size={20}>heroicons-outline:sparkles</FuseSvgIcon>
								</div>
								<h3 className="text-lg font-bold font-display text-white">
									Proof before production
								</h3>
								<p className="mt-2 text-xs text-slate-300 leading-relaxed">
									Custom orders in Gravurtastisch are tracked from digital mockup to craft and delivery —
									photo cups, engraved kitchenware, apparel, and keepsakes.
								</p>

								<ul className="mt-4 space-y-2.5 text-xs text-slate-300">
									<li className="flex items-center gap-2">
										<FuseSvgIcon size={14} className="text-cyan-400 shrink-0">heroicons-solid:check-circle</FuseSvgIcon>
										<span>Strict 5-30 day window adherence</span>
									</li>
									<li className="flex items-center gap-2">
										<FuseSvgIcon size={14} className="text-cyan-400 shrink-0">heroicons-solid:check-circle</FuseSvgIcon>
										<span>Zero web scraping or credential risk</span>
									</li>
									<li className="flex items-center gap-2">
										<FuseSvgIcon size={14} className="text-cyan-400 shrink-0">heroicons-solid:check-circle</FuseSvgIcon>
										<span>Multi-marketplace support (US, UK, DE, IN, JP)</span>
									</li>
								</ul>

								<div className="mt-6 pt-4 border-t border-white/10">
									<button className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5">
										<span>REGISTER AS SELLER</span>
										<FuseSvgIcon size={14}>heroicons-outline:arrow-right</FuseSvgIcon>
									</button>
								</div>
							</div>

							{/* Related Articles Box */}
							<div className="rounded-2xl p-6 bg-white border border-slate-200/80 shadow-sm">
								<div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-4">
									<FuseSvgIcon size={16} className="text-blue-600">
										heroicons-outline:book-open
									</FuseSvgIcon>
									<span>Seller Insights</span>
								</div>

								<div className="space-y-3">
									<div className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
										<h5 className="text-xs font-semibold text-slate-800 line-clamp-2">
											Amazon TOS Compliance Checklist 2026: Safe Review Automation Without Account Risk
										</h5>
										<span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
											Read article <FuseSvgIcon size={12}>heroicons-outline:arrow-right</FuseSvgIcon>
										</span>
									</div>
									<div className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
										<h5 className="text-xs font-semibold text-slate-800 line-clamp-2">
											The Buy Box Flywheel: How Organic 5-Star Reviews Lower PPC ACoS
										</h5>
										<span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
											Read article <FuseSvgIcon size={12}>heroicons-outline:arrow-right</FuseSvgIcon>
										</span>
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
