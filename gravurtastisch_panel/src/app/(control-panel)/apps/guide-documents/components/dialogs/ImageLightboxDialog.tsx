'use client';

import { Dialog, DialogContent, IconButton } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { getImageUrl } from '@/configs/env';

interface ImageLightboxDialogProps {
	open: boolean;
	imageUrl?: string;
	title?: string;
	onClose: () => void;
}

export default function ImageLightboxDialog({
	open,
	imageUrl,
	title,
	onClose
}: ImageLightboxDialogProps) {
	if (!imageUrl) return null;

	const fullUrl = getImageUrl(imageUrl);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			slotProps={{
				paper: {
					className: 'bg-black/95 text-white overflow-hidden rounded-2xl shadow-2xl border border-white/10 p-0'
				}
			}}
		>
			<div className="relative flex flex-col max-h-[90vh]">
				<div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
					<div className="flex items-center gap-2 min-w-0">
						<FuseSvgIcon size={18} className="text-primary-300">
							lucide:image
						</FuseSvgIcon>
						<span className="text-sm font-medium text-white/90 truncate">
							{title || 'Screenshot Preview'}
						</span>
					</div>
					<IconButton
						onClick={onClose}
						size="small"
						className="text-white/70 hover:text-white hover:bg-white/10 transition-colors"
					>
						<FuseSvgIcon size={18}>lucide:x</FuseSvgIcon>
					</IconButton>
				</div>
				<DialogContent className="p-4 flex items-center justify-center overflow-auto bg-black/40">
					<img
						src={fullUrl}
						alt={title || 'Screenshot'}
						className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg border border-white/10"
					/>
				</DialogContent>
			</div>
		</Dialog>
	);
}
