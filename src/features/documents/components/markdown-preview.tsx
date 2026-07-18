"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownPreview({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed",
        "[&_h1]:mt-5 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight",
        "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold",
        "[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_p]:text-foreground/90 [&_p]:my-2.5",
        "[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-1",
        "[&_a]:text-primary [&_a]:underline",
        "[&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-4",
        "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]",
        "[&_pre]:border-border [&_pre]:bg-muted [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:p-4",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
        "[&_th]:border-border [&_th]:bg-muted/50 [&_th]:border [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left",
        "[&_td]:border-border [&_td]:border [&_td]:px-3 [&_td]:py-1.5",
        "[&_hr]:border-border [&_hr]:my-5",
        "[&_input]:mr-1.5",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
