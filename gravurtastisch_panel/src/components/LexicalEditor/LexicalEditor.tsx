import React, { useCallback, useEffect, useState, useRef } from 'react';
import { LexicalComposer, InitialConfigType } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import {
	$getSelection,
	$isRangeSelection,
	$createParagraphNode,
	FORMAT_TEXT_COMMAND,
	UNDO_COMMAND,
	REDO_COMMAND,
	CAN_UNDO_COMMAND,
	CAN_REDO_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	EditorState,
	LexicalEditor as LexicalEditorType
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
	Box,
	IconButton,
	Select,
	MenuItem,
	Tooltip,
	Divider,
	CircularProgress
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { ImageNode } from './nodes/ImageNode';
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from './plugins/ImagesPlugin';

const editorTheme = {
	paragraph: 'mb-2 leading-relaxed text-gray-800 text-sm md:text-base',
	heading: {
		h1: 'text-2xl font-bold mb-3 mt-4 text-gray-900',
		h2: 'text-xl font-bold mb-2 mt-3 text-gray-900',
		h3: 'text-lg font-semibold mb-2 mt-2 text-gray-900'
	},
	list: {
		ul: 'list-disc pl-6 mb-3 space-y-1',
		ol: 'list-decimal pl-6 mb-3 space-y-1',
		listitem: 'text-gray-800 leading-relaxed text-sm md:text-base'
	},
	quote: 'border-l-4 border-indigo-500 pl-4 py-1 italic my-3 text-gray-700 bg-gray-50 rounded-r',
	text: {
		bold: 'font-bold',
		italic: 'italic',
		underline: 'underline',
		strikethrough: 'line-through'
	},
	image: 'editor-image my-3 block'
};

function ToolbarPlugin({
	onUploadImage
}: {
	onUploadImage?: (file: File) => Promise<{ relativePath: string; url: string }>;
}) {
	const [editor] = useLexicalComposerContext();
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [blockType, setBlockType] = useState<string>('paragraph');
	const [isUploading, setIsUploading] = useState(false);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();

		if ($isRangeSelection(selection)) {
			setIsBold(selection.hasFormat('bold'));
			setIsItalic(selection.hasFormat('italic'));
			setIsUnderline(selection.hasFormat('underline'));
			setIsStrikethrough(selection.hasFormat('strikethrough'));
		}
	}, []);

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateToolbar();
			});
		});
	}, [editor, updateToolbar]);

	useEffect(() => {
		return editor.registerCommand(
			CAN_UNDO_COMMAND,
			(payload: boolean) => {
				setCanUndo(payload);
				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);
	}, [editor]);

	useEffect(() => {
		return editor.registerCommand(
			CAN_REDO_COMMAND,
			(payload: boolean) => {
				setCanRedo(payload);
				return false;
			},
			COMMAND_PRIORITY_CRITICAL
		);
	}, [editor]);

	const formatParagraph = () => {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createParagraphNode());
			}
		});
		setBlockType('paragraph');
	};

	const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
		editor.update(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				$setBlocksType(selection, () => $createHeadingNode(headingSize));
			}
		});
		setBlockType(headingSize);
	};

	const formatBulletList = () => {
		if (blockType !== 'bullet') {
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
			setBlockType('bullet');
		} else {
			editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
			setBlockType('paragraph');
		}
	};

	const formatNumberedList = () => {
		if (blockType !== 'number') {
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
			setBlockType('number');
		} else {
			editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
			setBlockType('paragraph');
		}
	};

	const formatQuote = () => {
		if (blockType !== 'quote') {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$setBlocksType(selection, () => $createQuoteNode());
				}
			});
			setBlockType('quote');
		} else {
			formatParagraph();
		}
	};

	const handleToolbarImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			if (onUploadImage) {
				const res = await onUploadImage(file);
				editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
					src: res.url,
					relativePath: res.relativePath,
					altText: file.name
				});
			} else {
				const reader = new FileReader();
				reader.onload = () => {
					editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
						src: reader.result as string,
						altText: file.name
					});
				};
				reader.readAsDataURL(file);
			}
		} catch (e) {
			console.error('Error uploading image via toolbar:', e);
		} finally {
			setIsUploading(false);
			if (imageInputRef.current) {
				imageInputRef.current.value = '';
			}
		}
	};

	return (
		<Box className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50/80 p-1.5 rounded-t-lg">
			<Tooltip title="Undo">
				<span>
					<IconButton
						size="small"
						disabled={!canUndo}
						onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
						className="p-1 text-gray-700 disabled:opacity-30"
					>
						<FuseSvgIcon size={18}>heroicons-outline:arrow-uturn-left</FuseSvgIcon>
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title="Redo">
				<span>
					<IconButton
						size="small"
						disabled={!canRedo}
						onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
						className="p-1 text-gray-700 disabled:opacity-30"
					>
						<FuseSvgIcon size={18}>heroicons-outline:arrow-uturn-right</FuseSvgIcon>
					</IconButton>
				</span>
			</Tooltip>

			<Divider orientation="vertical" flexItem className="mx-1 h-5 my-auto" />

			<Select
				size="small"
				value={blockType}
				onChange={(e) => {
					const val = e.target.value;
					if (val === 'paragraph') formatParagraph();
					else if (val === 'h1' || val === 'h2' || val === 'h3') formatHeading(val);
					else if (val === 'bullet') formatBulletList();
					else if (val === 'number') formatNumberedList();
					else if (val === 'quote') formatQuote();
				}}
				sx={{
					height: 28,
					fontSize: '0.8rem',
					minWidth: 110,
					bgcolor: 'background.paper',
					borderRadius: 1,
					'& .MuiSelect-select': { py: 0.5, px: 1 }
				}}
			>
				<MenuItem value="paragraph" sx={{ fontSize: '0.8rem' }}>Normal Text</MenuItem>
				<MenuItem value="h1" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Heading 1</MenuItem>
				<MenuItem value="h2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Heading 2</MenuItem>
				<MenuItem value="h3" sx={{ fontSize: '0.8rem', fontWeight: '600' }}>Heading 3</MenuItem>
				<MenuItem value="quote" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Quote</MenuItem>
			</Select>

			<Divider orientation="vertical" flexItem className="mx-1 h-5 my-auto" />

			<Tooltip title="Bold (Ctrl+B)">
				<IconButton
					size="small"
					onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
					className={`p-1 rounded ${isBold ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-200'}`}
				>
					<FuseSvgIcon size={18}>heroicons-outline:bold</FuseSvgIcon>
				</IconButton>
			</Tooltip>

			<Tooltip title="Italic (Ctrl+I)">
				<IconButton
					size="small"
					onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
					className={`p-1 rounded ${isItalic ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-200'}`}
				>
					<FuseSvgIcon size={18}>heroicons-outline:italic</FuseSvgIcon>
				</IconButton>
			</Tooltip>

			<Tooltip title="Underline (Ctrl+U)">
				<IconButton
					size="small"
					onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
					className={`p-1 rounded ${isUnderline ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-200'}`}
				>
					<FuseSvgIcon size={18}>heroicons-outline:underline</FuseSvgIcon>
				</IconButton>
			</Tooltip>

			<Tooltip title="Strikethrough">
				<IconButton
					size="small"
					onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
					className={`p-1 rounded ${isStrikethrough ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-200'}`}
				>
					<FuseSvgIcon size={18}>heroicons-outline:strikethrough</FuseSvgIcon>
				</IconButton>
			</Tooltip>

			<Divider orientation="vertical" flexItem className="mx-1 h-5 my-auto" />

			<Tooltip title="Bullet List">
				<IconButton
					size="small"
					onClick={formatBulletList}
					className={`p-1 rounded ${blockType === 'bullet' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-200'}`}
				>
					<FuseSvgIcon size={18}>heroicons-outline:bars-3-bottom-left</FuseSvgIcon>
				</IconButton>
			</Tooltip>

			<Tooltip title="Numbered List">
				<IconButton
					size="small"
					onClick={formatNumberedList}
					className={`p-1 rounded ${blockType === 'number' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-200'}`}
				>
					<FuseSvgIcon size={18}>heroicons-outline:list-bullet</FuseSvgIcon>
				</IconButton>
			</Tooltip>

			<Divider orientation="vertical" flexItem className="mx-1 h-5 my-auto" />

			{/* Insert Image Button */}
			<input
				type="file"
				accept="image/*"
				ref={imageInputRef}
				onChange={handleToolbarImageUpload}
				className="hidden"
				id="lexical-toolbar-image-upload"
			/>
			<Tooltip title="Insert Image (or paste with Ctrl+V)">
				<span>
					<IconButton
						size="small"
						disabled={isUploading}
						onClick={() => imageInputRef.current?.click()}
						className="p-1 rounded text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
					>
						{isUploading ? (
							<CircularProgress size={16} />
						) : (
							<FuseSvgIcon size={18}>heroicons-outline:photo</FuseSvgIcon>
						)}
					</IconButton>
				</span>
			</Tooltip>
		</Box>
	);
}

// Initial state loader plugin
function InitialStatePlugin({ value }: { value: any }) {
	const [editor] = useLexicalComposerContext();
	const isLoadedRef = React.useRef(false);

	useEffect(() => {
		if (value && !isLoadedRef.current) {
			try {
				let parsedState = value;
				if (typeof value === 'string') {
					parsedState = JSON.parse(value);
				}
				if (parsedState && typeof parsedState === 'object') {
					const initialEditorState = editor.parseEditorState(parsedState);
					editor.setEditorState(initialEditorState);
					isLoadedRef.current = true;
				}
			} catch (e) {
				// console.warn('Failed to parse initial Lexical state:', e);
			}
		}
	}, [editor, value]);

	return null;
}

export interface LexicalEditorProps {
	value?: any;
	onChange?: (jsonState: any) => void;
	placeholder?: string;
	minHeight?: number | string;
	onUploadImage?: (file: File) => Promise<{ relativePath: string; url: string }>;
}

export default function LexicalEditor({
	value,
	onChange,
	placeholder = 'Write your blog content here or paste images (Ctrl+V)...',
	minHeight = 220,
	onUploadImage
}: LexicalEditorProps) {
	const initialConfig: InitialConfigType = {
		namespace: 'BlogLexicalEditor',
		theme: editorTheme,
		nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageNode],
		onError: (error: Error) => {
			console.error('Lexical Error:', error);
		}
	};

	const handleChange = (editorState: EditorState, _editor: LexicalEditorType) => {
		if (onChange) {
			const json = editorState.toJSON();
			onChange(json);
		}
	};

	return (
		<Box className="w-full rounded-lg border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all bg-white overflow-hidden shadow-xs">
			<LexicalComposer initialConfig={initialConfig}>
				<ToolbarPlugin onUploadImage={onUploadImage} />
				<InitialStatePlugin value={value} />
				<ImagesPlugin onUploadImage={onUploadImage} />
				<Box className="relative p-3" sx={{ minHeight }}>
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								className="outline-none w-full min-h-[180px] max-h-[550px] overflow-y-auto prose max-w-none text-gray-800"
								style={{ minHeight }}
							/>
						}
						placeholder={
							<div className="absolute top-3 left-3 text-gray-400 pointer-events-none text-sm select-none">
								{placeholder}
							</div>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<ListPlugin />
					<LinkPlugin />
					<OnChangePlugin onChange={handleChange} />
				</Box>
			</LexicalComposer>
		</Box>
	);
}
