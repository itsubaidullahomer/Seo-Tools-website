"use client";

import { useCallback, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

export interface FileDropzoneProps {
  /** Called with the accepted files. */
  onFiles: (files: File[]) => void;
  /** Accept attribute, e.g. "image/*" or ".json,.csv". */
  accept?: string;
  multiple?: boolean;
  /** Maximum size per file in bytes; larger files are rejected with a message. */
  maxSize?: number;
  title?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Drag-and-drop file picker. Files never leave the browser – the component only
 * hands File objects to the tool.
 */
export function FileDropzone({ onFiles, accept, multiple, maxSize, title, description, disabled, className }: FileDropzoneProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const files = Array.from(list);
      const tooBig = maxSize ? files.filter((f) => f.size > maxSize) : [];
      if (tooBig.length) {
        setError(`${tooBig[0].name} is ${formatBytes(tooBig[0].size)} – the limit is ${formatBytes(maxSize!)}.`);
        return;
      }
      setError(null);
      onFiles(multiple ? files : files.slice(0, 1));
    },
    [maxSize, multiple, onFiles],
  );

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handle(e.dataTransfer.files);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary-soft" : "border-border-strong bg-surface-2 hover:border-primary/60 hover:bg-surface-3/60",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary shadow-sm">
          <Upload className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-sm font-medium text-fg">{title ?? (multiple ? "Drop files here or click to browse" : "Drop a file here or click to browse")}</span>
        <span className="text-xs text-muted">
          {description ?? (
            <>
              {accept ? `Accepted: ${accept.replace(/,/g, ", ")}` : "Any file type"}
              {maxSize ? ` · up to ${formatBytes(maxSize, 0)}` : ""} · processed on your device
            </>
          )}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
