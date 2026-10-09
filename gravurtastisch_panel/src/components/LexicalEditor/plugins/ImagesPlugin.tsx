import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$createParagraphNode,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_HIGH,
	PASTE_COMMAND,
	createCommand,
	LexicalCommand
} from 'lexical';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { $createImageNode, ImageNode, ImagePayload } from '../nodes/ImageNode';

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand(
	'INSERT_IMAGE_COMMAND'
);

export default function ImagesPlugin({
	onUploadImage
}: {
	onUploadImage?: (file: File) => Promise<{ relativePath: string; url: string }>;
}): null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!editor.hasNodes([ImageNode])) {
			throw new Error('ImagesPlugin: ImageNode not registered on editor');
		}

		// Handle INSERT_IMAGE_COMMAND
		const unregisterInsertImage = editor.registerCommand<ImagePayload>(
			INSERT_IMAGE_COMMAND,
			(payload) => {
				const imageNode = $createImageNode(payload);
				$insertNodeToNearestRoot(imageNode);

				// Insert a trailing empty paragraph after the image so user can continue writing below it
				const paragraphNode = $createParagraphNode();
				imageNode.insertAfter(paragraphNode);
				paragraphNode.select();

				return true;
			},
			COMMAND_PRIORITY_EDITOR
		);

		// Handle Clipboard Paste of Images (Ctrl+V / Cmd+V)
		const unregisterPaste = editor.registerCommand(
			PASTE_COMMAND,
			(event: ClipboardEvent) => {
				const { clipboardData } = event;
				if (!clipboardData) return false;

				const items = clipboardData.items;
				let imageFile: File | null = null;

				for (const item of items) {
					if (item.type.indexOf('image') !== -1) {
						imageFile = item.getAsFile();
						break;
					}
				}

				if (imageFile) {
					event.preventDefault();

					if (onUploadImage) {
						// Read temporary local preview while uploading
						const reader = new FileReader();
						reader.onload = () => {
							const tempUrl = reader.result as string;
							// Insert local preview immediately or wait for upload
							onUploadImage(imageFile!)
								.then((res) => {
									editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
										src: res.url,
										relativePath: res.relativePath,
										altText: imageFile?.name || 'Pasted image'
									});
								})
								.catch((err) => {
									console.error('Failed to upload pasted image:', err);
									// Fallback to data URL if backend upload fails
									editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
										src: tempUrl,
										altText: imageFile?.name || 'Pasted image'
									});
								});
						};
						reader.readAsDataURL(imageFile);
					} else {
						// If no upload handler provided, insert as Data URL
						const reader = new FileReader();
						reader.onload = () => {
							const src = reader.result as string;
							editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
								src,
								altText: imageFile?.name || 'Pasted image'
							});
						};
						reader.readAsDataURL(imageFile);
					}

					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_HIGH
		);

		return () => {
			unregisterInsertImage();
			unregisterPaste();
		};
	}, [editor, onUploadImage]);

	return null;
}
