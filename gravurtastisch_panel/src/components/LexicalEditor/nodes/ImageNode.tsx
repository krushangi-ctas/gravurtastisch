import React, { Suspense } from 'react';
import type {
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	NodeKey,
	SerializedLexicalNode,
	Spread
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { $getNodeByKey } from 'lexical';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { IconButton, Tooltip } from '@mui/material';

export interface ImagePayload {
	altText?: string;
	caption?: string;
	height?: number | string;
	key?: NodeKey;
	maxWidth?: number;
	src: string;
	width?: number | string;
	relativePath?: string;
}

export type SerializedImageNode = Spread<
	{
		altText: string;
		caption?: string;
		height?: number | string;
		maxWidth?: number;
		src: string;
		width?: number | string;
		relativePath?: string;
	},
	SerializedLexicalNode
>;

function ImageComponent({
	src,
	altText,
	nodeKey,
	relativePath
}: {
	src: string;
	altText: string;
	nodeKey: NodeKey;
	relativePath?: string;
}) {
	const [editor] = useLexicalComposerContext();
	const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (node) {
				node.remove();
			}
		});
	};

	return (
		<div
			className={`group relative my-4 inline-block max-w-full rounded-xl border transition-all ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-xs'
				}`}
			onClick={(e) => {
				e.stopPropagation();
				clearSelection();
				setSelected(true);
			}}
		>
			<img
				src={src}
				alt={altText || 'Blog image'}
				className="max-h-[450px] w-auto max-w-full rounded-xl object-contain block mx-auto bg-gray-50"
				draggable="false"
			/>

			{/* Delete floating button */}
			<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs rounded-full shadow-md p-0.5">
				<Tooltip title="Remove image">
					<IconButton
						size="small"
						onClick={handleDelete}
						className="text-gray-600 hover:text-red-600 p-1"
					>
						<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
					</IconButton>
				</Tooltip>
			</div>

			{altText && (
				<div className="text-center text-xs text-gray-500 py-1.5 px-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
					{altText}
				</div>
			)}
		</div>
	);
}

export class ImageNode extends DecoratorNode<React.ReactElement> {
	__src: string;
	__altText: string;
	__maxWidth: number;
	__width: number | string;
	__height: number | string;
	__caption?: string;
	__relativePath?: string;

	static getType(): string {
		return 'image';
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(
			node.__src,
			node.__altText,
			node.__maxWidth,
			node.__width,
			node.__height,
			node.__caption,
			node.__relativePath,
			node.__key
		);
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		const { altText, height, width, maxWidth, caption, src, relativePath } = serializedNode;
		const node = $createImageNode({
			altText,
			height,
			maxWidth,
			caption,
			src,
			width,
			relativePath
		});
		return node;
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('img');
		element.setAttribute('src', this.__src);
		element.setAttribute('alt', this.__altText);
		if (this.__width) {
			element.setAttribute('width', String(this.__width));
		}
		if (this.__height) {
			element.setAttribute('height', String(this.__height));
		}
		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: (_node: Node) => ({
				conversion: convertImageElement,
				priority: 0
			})
		};
	}

	constructor(
		src: string,
		altText?: string,
		maxWidth?: number,
		width?: number | string,
		height?: number | string,
		caption?: string,
		relativePath?: string,
		key?: NodeKey
	) {
		super(key);
		this.__src = src;
		this.__altText = altText || 'Blog image';
		this.__maxWidth = maxWidth || 600;
		this.__width = width || 'auto';
		this.__height = height || 'auto';
		this.__caption = caption;
		this.__relativePath = relativePath;
	}

	exportJSON(): SerializedImageNode {
		return {
			altText: this.getAltText(),
			caption: this.__caption,
			height: this.__height,
			maxWidth: this.__maxWidth,
			relativePath: this.__relativePath,
			src: this.getSrc(),
			type: 'image',
			version: 1,
			width: this.__width
		};
	}

	getSrc(): string {
		return this.__src;
	}

	getAltText(): string {
		return this.__altText;
	}

	getRelativePath(): string | undefined {
		return this.__relativePath;
	}

	setSrc(src: string): void {
		const writable = this.getWritable();
		writable.__src = src;
	}

	setRelativePath(path: string): void {
		const writable = this.getWritable();
		writable.__relativePath = path;
	}

	createDOM(config: EditorConfig): HTMLElement {
		const span = document.createElement('span');
		const theme = config.theme;
		const className = theme.image;
		if (className !== undefined) {
			span.className = className;
		}
		return span;
	}

	updateDOM(): false {
		return false;
	}

	decorate(): React.ReactElement {
		return (
			<Suspense fallback={null}>
				<ImageComponent
					src={this.__src}
					altText={this.__altText}
					nodeKey={this.getKey()}
					relativePath={this.__relativePath}
				/>
			</Suspense>
		);
	}
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
	if (domNode instanceof HTMLImageElement) {
		const { alt: altText, src, width, height } = domNode;
		const node = $createImageNode({ altText, height, src, width });
		return { node };
	}
	return null;
}

export function $createImageNode({
	altText,
	height,
	maxWidth = 600,
	caption,
	src,
	width,
	relativePath,
	key
}: ImagePayload): ImageNode {
	return $applyNodeReplacement(
		new ImageNode(src, altText, maxWidth, width, height, caption, relativePath, key)
	);
}


