"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Paperclip, Upload, X, FileText, Image as ImageIcon } from "lucide-react";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface PanelFilesProps {
  files?: AttachedFile[];
  onUpload?: (files: File[]) => void;
  onRemove?: (fileId: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-3 text-blue-400" />;
  return <FileText className="size-3 text-slate-400" />;
}

export function PanelFiles({ files = [], onUpload, onRemove }: PanelFilesProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      if (dropped.length > 0) onUpload?.(dropped);
    },
    [onUpload],
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onUpload?.(Array.from(e.target.files));
        e.target.value = "";
      }
    },
    [onUpload],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Paperclip className="size-3 text-slate-400" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Attachments</span>
        {files.length > 0 && (
          <span className="text-[9px] text-slate-500">({files.length})</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-3 text-center transition ${
          isDragOver
            ? "border-indigo-500/50 bg-indigo-500/10"
            : "border-white/8 bg-white/4 hover:border-white/20"
        }`}
      >
        <Upload className="mx-auto mb-1 size-4 text-slate-500" />
        <p className="text-[9px] text-slate-500">Drop files or click to upload</p>
        <input ref={inputRef} type="file" multiple onChange={handleSelect} className="hidden" />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <motion.div
              key={file.id}
              className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FileIcon mimeType={file.type} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-300 truncate">{file.name}</p>
                <p className="text-[8px] text-slate-500">{formatSize(file.size)}</p>
              </div>
              {onRemove && (
                <button
                  onClick={() => onRemove(file.id)}
                  className="rounded p-0.5 text-slate-500 hover:text-red-400 transition"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
