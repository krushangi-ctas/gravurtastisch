import React from "react";

interface LexicalTextNode {
  type: "text";
  text: string;
  format?: number; // 1 = bold, 2 = italic, 4 = strikethrough, 8 = underline, 9 = bold+underline, etc.
  style?: string;
}

interface LexicalLinkNode {
  type: "link" | "autolink";
  url?: string;
  children?: LexicalNode[];
}

interface LexicalListItemNode {
  type: "listitem";
  children?: LexicalNode[];
}

interface LexicalListNode {
  type: "list";
  tag: "ul" | "ol";
  listType?: "bullet" | "number";
  children?: LexicalListItemNode[];
}

interface LexicalHeadingNode {
  type: "heading";
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children?: LexicalNode[];
}

interface LexicalQuoteNode {
  type: "quote";
  children?: LexicalNode[];
}

interface LexicalParagraphNode {
  type: "paragraph";
  children?: LexicalNode[];
}

interface LexicalImageNode {
  type: "image";
  src: string;
  altText?: string;
  width?: number | string;
  height?: number | string;
}

type LexicalNode =
  | LexicalTextNode
  | LexicalLinkNode
  | LexicalHeadingNode
  | LexicalParagraphNode
  | LexicalQuoteNode
  | LexicalListNode
  | LexicalListItemNode
  | LexicalImageNode
  | any;

function renderTextNode(node: LexicalTextNode, key: number | string) {
  let content: React.ReactNode = node.text || "";
  const format = node.format || 0;

  const isBold = (format & 1) !== 0;
  const isItalic = (format & 2) !== 0;
  const isStrikethrough = (format & 4) !== 0;
  const isUnderline = (format & 8) !== 0;

  if (isBold) {
    content = <strong key="b" className="font-bold text-navy-deep dark:text-white">{content}</strong>;
  }
  if (isItalic) {
    content = <em key="i" className="italic">{content}</em>;
  }
  if (isUnderline) {
    content = <u key="u" className="underline underline-offset-2">{content}</u>;
  }
  if (isStrikethrough) {
    content = <s key="s" className="line-through">{content}</s>;
  }

  return <React.Fragment key={key}>{content}</React.Fragment>;
}

function LexicalImage({ src, altText, key }: { src: string; altText?: string; key?: number | string }) {
  const [hasError, setHasError] = React.useState(false);

  if (hasError || !src) return null;

  return (
    <div
      key={key}
      className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg bg-slate-900/5 dark:bg-slate-900/40"
    >
      <img
        src={src}
        alt={altText || "Article visual"}
        className="w-full max-h-[500px] object-contain block mx-auto"
        loading="lazy"
        onError={() => setHasError(true)}
      />
      {altText && !hasError && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-2.5 px-4 bg-slate-100 dark:bg-slate-950/50 border-t border-slate-200 dark:border-white/5">
          {altText}
        </p>
      )}
    </div>
  );
}

function renderChildren(children?: LexicalNode[]): React.ReactNode {
  if (!children || !Array.isArray(children)) return null;

  return children.map((child, index) => {
    if (!child) return null;

    if (child.type === "text") {
      return renderTextNode(child, index);
    }

    if (child.type === "link" || child.type === "autolink") {
      return (
        <a
          key={index}
          href={child.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-brand-bright underline font-medium transition-colors"
        >
          {renderChildren(child.children)}
        </a>
      );
    }

    if (child.type === "image") {
      return <LexicalImage key={index} src={child.src} altText={child.altText} />;
    }

    return renderChildren(child.children);
  });
}

function renderBlockNode(node: LexicalNode, index: number) {
  if (!node) return null;

  switch (node.type) {
    case "heading": {
      const tag = node.tag || "h2";
      const headingClasses =
        tag === "h1"
          ? "text-3xl sm:text-4xl font-extrabold text-navy-deep dark:text-white mt-10 mb-4 tracking-tight"
          : tag === "h2"
          ? "text-2xl sm:text-3xl font-bold text-navy-deep dark:text-white mt-8 mb-3.5 tracking-tight"
          : "text-xl sm:text-2xl font-semibold text-navy-deep dark:text-white mt-6 mb-3 tracking-tight";

      if (tag === "h1") return <h1 key={index} className={headingClasses}>{renderChildren(node.children)}</h1>;
      if (tag === "h3") return <h3 key={index} className={headingClasses}>{renderChildren(node.children)}</h3>;
      if (tag === "h4") return <h4 key={index} className={headingClasses}>{renderChildren(node.children)}</h4>;
      if (tag === "h5") return <h5 key={index} className={headingClasses}>{renderChildren(node.children)}</h5>;
      if (tag === "h6") return <h6 key={index} className={headingClasses}>{renderChildren(node.children)}</h6>;
      return <h2 key={index} className={headingClasses}>{renderChildren(node.children)}</h2>;
    }

    case "paragraph": {
      // Check if paragraph contains only an image
      const firstChild = node.children?.[0];
      if (node.children?.length === 1 && firstChild?.type === "image") {
        return renderChildren(node.children);
      }
      return (
        <p
          key={index}
          className="mb-4 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300"
        >
          {renderChildren(node.children)}
        </p>
      );
    }

    case "quote":
      return (
        <blockquote
          key={index}
          className="border-l-4 border-brand pl-5 py-3 my-6 text-slate-700 dark:text-slate-200 bg-brand/5 dark:bg-brand/10 rounded-r-xl italic text-base sm:text-lg"
        >
          {renderChildren(node.children)}
        </blockquote>
      );

    case "list": {
      const isOrdered = node.listType === "number" || node.tag === "ol";
      const ListTag = isOrdered ? "ol" : "ul";
      const listClasses = isOrdered
        ? "list-decimal pl-6 space-y-2 mb-6 text-base sm:text-lg text-slate-600 dark:text-slate-300"
        : "list-disc pl-6 space-y-2 mb-6 text-base sm:text-lg text-slate-600 dark:text-slate-300";

      return (
        <ListTag key={index} className={listClasses}>
          {node.children?.map((item: LexicalListItemNode, itemIdx: number) => (
            <li key={itemIdx} className="leading-relaxed">
              {renderChildren(item.children)}
            </li>
          ))}
        </ListTag>
      );
    }

    case "image":
      return <LexicalImage key={index} src={node.src} altText={node.altText} />;

    default:
      return (
        <div key={index} className="mb-4">
          {renderChildren(node.children)}
        </div>
      );
  }
}

export function LexicalViewer({
  content,
  className = "",
}: {
  content?: any;
  className?: string;
}) {
  if (!content) {
    return <p className="text-muted-foreground italic">No content available.</p>;
  }

  // Parse if string
  let parsedContent = content;
  if (typeof content === "string") {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      parsedContent = null;
    }
  }

  // If valid Lexical state with root.children
  if (parsedContent?.root?.children && Array.isArray(parsedContent.root.children)) {
    return (
      <div className={`prose-content max-w-none ${className}`}>
        {parsedContent.root.children.map((childNode: LexicalNode, i: number) =>
          renderBlockNode(childNode, i)
        )}
      </div>
    );
  }

  // If content is string with HTML tags
  if (typeof content === "string") {
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    if (isHtml) {
      return (
        <div
          className={`prose dark:prose-invert max-w-none leading-relaxed article-html-content ${className}`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    return (
      <div className={`whitespace-pre-line text-slate-600 dark:text-slate-300 leading-relaxed ${className}`}>
        {content}
      </div>
    );
  }

  return <p className="text-muted-foreground italic">Unable to display content format.</p>;
}
