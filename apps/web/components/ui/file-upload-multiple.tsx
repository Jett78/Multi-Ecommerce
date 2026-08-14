"use client";

import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { uploadSingleImage } from "@/actions/upload-action";
import type { FileUploadMultipleProps } from "@/types/components";

export default function FileUploadMultiple({
  onSuccess,
  defaultImages = [],
  className,
  accept = "image/*",
  folder = "uploads",
  maxFiles = 10,
  showPreview = true,
}: FileUploadMultipleProps) {
  const [isUploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files).slice(0, maxFiles - defaultImages.length);
    if (filesToUpload.length === 0) return;

    setUploading(true);

    const newImages: { key: string; url: string }[] = [];

    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await uploadSingleImage(formData);

      if (res.success && res.data) {
        newImages.push({
          key: res.data.keys.original,
          url: res.data.urls.original,
        });
      }
    }

    if (newImages.length > 0) {
      onSuccess?.([...defaultImages, ...newImages]);
    }

    setUploading(false);
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const updated = defaultImages.filter((_, i) => i !== index);
    onSuccess?.(updated);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={openFilePicker}
        className="relative flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100"
      >
        {isUploading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <svg className="h-5 w-5 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-sm text-zinc-600">
            <svg className="mb-2 h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-8m0 0 2 2m-2-2-2 2M4 16a4 4 0 004 4h8a4 4 0 000-8h-.26A6 6 0 104 16z" />
            </svg>
            <p className="font-medium">Click to upload images</p>
            <p className="text-xs text-zinc-400">PNG, JPG, WEBP (max {maxFiles} files)</p>
          </div>
        )}
      </div>

      {showPreview && defaultImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {defaultImages.map((img, index) => (
            <div
              key={`${img.key}-${index}`}
              className="relative h-24 w-full overflow-hidden rounded-md border border-slate-200"
            >
              <img
                src={img.url}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
