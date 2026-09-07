"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { uploadSingleImage, uploadFromUrl } from "@/actions/upload-action";
import { showError, showSuccess } from "@/lib/toast-helper";
import { Link } from "lucide-react";
import type { FileUploadProps } from "@/types/components";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB


export default function FileUpload({
  onSuccess,
  defaultImage,
  className,
  returnType = "url",
  accept = "image/*",
  folder = "uploads",
}: FileUploadProps) {
  const [isUploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultImage) {
      setPreviewUrl(defaultImage);
    }
  }, [defaultImage]);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleAddUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      showError("Please enter a valid URL");
      return;
    }

    setUploading(true);
    setPreviewUrl(trimmed);

    const res = await uploadFromUrl(trimmed, folder);

    setUploading(false);

    if (res.success && res.data) {
      const s3Url = res.data.urls.original;
      const s3Key = res.data.keys.original;

      setPreviewUrl(s3Url);
      onSuccess?.({ key: s3Key, url: s3Url });
      setUrlInput("");
      showSuccess("Image uploaded to S3");
    } else {
      setPreviewUrl(null);
      showError(res.error || "Failed to upload image");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showError("File size must be under 2MB");
      e.target.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    setUploading(true);

    const res = await uploadSingleImage(formData);

    setUploading(false);

    if (res.success && res.data) {
      const originalUrl = res.data.urls.original;
      const originalKey = res.data.keys.original;

      setPreviewUrl(originalUrl);

      onSuccess?.({ key: originalKey, url: originalUrl });
    } else {
      setPreviewUrl(null);
    }

    e.target.value = "";
  };

  return (
    <div className="w-full space-y-3">
      {/* URL Input - Top */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
            placeholder="Paste image URL and press Enter"
            className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add URL
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-400">or upload file</span>
        </div>
      </div>

      {/* Upload Area */}
      <div className="relative h-60 w-full">
        <div
          onClick={openFilePicker}
          className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className={`${className} h-full w-full rounded-md object-contain`}
            />
          ) : (
            <div className="flex flex-col items-center text-sm text-zinc-600">
              <svg
                className="mb-3 h-8 w-8"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 16v-8m0 0 2 2m-2-2-2 2M4 16a4 4 0 004 4h8a4 4 0 000-8h-.26A6 6 0 104 16z"
                />
              </svg>
              <p className="font-medium">Click to upload</p>
              <p className="text-xs text-zinc-400">PNG, JPG, WEBP, GIF | Max 2MB</p>
            </div>
          )}

          {previewUrl && !isUploading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              className="absolute right-3 bottom-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white hover:bg-black/80"
            >
              Change image
            </button>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <svg
                className="h-6 w-6 animate-spin text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          )}
        </div>

        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
