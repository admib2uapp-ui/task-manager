"use client";

import { FileText, File, Download } from "lucide-react";
import type { ChatAttachment } from "@/types/domain";

interface FilePreviewProps {
  attachment: ChatAttachment;
}

export function FilePreview({ attachment }: FilePreviewProps) {
  const isImage = attachment.mimeType.startsWith("image/");
  const isPdf = attachment.mimeType === "application/pdf";

  return (
    <div className="group relative">
      {isImage ? (
        <div className="relative">
          <img
            src={attachment.fileUrl}
            alt={attachment.fileName}
            className="max-h-80 rounded-xl object-contain"
            loading="lazy"
          />
        </div>
      ) : isPdf ? (
        <a
          href={attachment.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-muted hover:bg-muted/80 flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
        >
          <FileText className="text-primary size-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{attachment.fileName}</p>
            <p className="text-muted-foreground text-xs">PDF — {(attachment.sizeBytes / 1024).toFixed(0)} KB</p>
          </div>
          <Download className="text-muted-foreground size-4 shrink-0" />
        </a>
      ) : (
        <a
          href={attachment.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-muted hover:bg-muted/80 flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
        >
          <File className="text-primary size-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{attachment.fileName}</p>
            <p className="text-muted-foreground text-xs">
              {(attachment.sizeBytes / 1024).toFixed(0)} KB
            </p>
          </div>
          <Download className="text-muted-foreground size-4 shrink-0" />
        </a>
      )}
    </div>
  );
}
