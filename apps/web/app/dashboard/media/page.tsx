"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ROUTES } from "@/config/api-routes";
import { apiClient } from "@/lib/api-client";
import { uploadSingleImage } from "@/actions/upload-action";
import DashboardHeading from "@/components/dashboard/dashboard-heading";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import { PluginModal } from "@/components/dashboard/plugin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Upload, Copy, Trash2, FolderOpen, Image, File, Check } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helper";
import type { MediaFile, MediaFolder } from "@/types/media";

const PAGE_SIZE = 24;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileExtension(key: string): string {
  return key.split(".").pop()?.toLowerCase() || "";
}

function isImageFile(key: string): boolean {
  const ext = getFileExtension(key);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
}

export default function MediaPage() {
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [tokenMap, setTokenMap] = useState<Map<number, string | undefined>>(new Map([[1, undefined]]));
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("uploads");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const prefix = selectedFolder ? `${selectedFolder}/` : undefined;
  const continuationToken = tokenMap.get(page);

  const { data: folders } = useQuery({
    queryKey: ["media-folders"],
    queryFn: async () => {
      const res = await apiClient<any>(`${API_ROUTES.UPLOAD}/folders`);
      return (res?.data || []) as MediaFolder[];
    },
  });

  const { data: mediaData, isLoading } = useQuery({
    queryKey: ["media-files", prefix, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (prefix) params.set("prefix", prefix);
      if (search) params.set("search", search);
      if (continuationToken) params.set("continuationToken", continuationToken);
      params.set("maxKeys", String(PAGE_SIZE));

      const res = await apiClient<any>(`${API_ROUTES.UPLOAD}/list?${params.toString()}`);
      const items = (res?.data || []) as MediaFile[];
      const nextToken = res?.nextContinuationToken as string | undefined;
      const truncated = res?.isTruncated as boolean;

      return {
        items,
        isTruncated: truncated,
        totalCount: res?.totalCount as number,
        nextToken,
      };
    },
  });

  const files = mediaData?.items || [];
  const isTruncated = mediaData?.isTruncated || false;
  const totalPages = page + (isTruncated ? 1 : 0);
  const allFilesCount = folders?.reduce((sum, f) => sum + f.count, 0) || 0;

  useEffect(() => {
    if (mediaData?.nextToken && mediaData?.isTruncated) {
      setTokenMap((prev) => {
        if (prev.has(page + 1)) return prev;
        return new Map(prev).set(page + 1, mediaData.nextToken);
      });
    }
  }, [mediaData, page]);

  useEffect(() => {
    setPage(1);
    setTokenMap(new Map([[1, undefined]]));
  }, [selectedFolder, search]);

  const handleCopyUrl = useCallback(async (url: string, key: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedKey(key);
    showSuccess("URL copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteKey) return;
    try {
      const res = await apiClient<any>(`${API_ROUTES.UPLOAD}/${encodeURIComponent(deleteKey)}`, {
        method: "DELETE",
      });
      if (res?.success) {
        showSuccess("File deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["media-files"] });
        queryClient.invalidateQueries({ queryKey: ["media-folders"] });
      }
    } catch (error: any) {
      showError(error.message || "Failed to delete file");
    } finally {
      setDeleteKey(null);
    }
  }, [deleteKey, queryClient]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showError("File size must be under 2MB");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", uploadFolder);

      const result = await uploadSingleImage(formData);
      if (result.success) {
        showSuccess("File uploaded successfully");
        queryClient.invalidateQueries({ queryKey: ["media-files"] });
        queryClient.invalidateQueries({ queryKey: ["media-folders"] });
        setUploadOpen(false);
      } else {
        showError(result.error || "Upload failed");
      }
    } catch {
      showError("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }, [uploadFolder, queryClient]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DashboardHeading
        title="Media"
        description="Manage your uploaded files and images"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Folder Sidebar */}
        <div className="w-full lg:w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Folders</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFolder === null
                    ? "bg-primarymain/10 text-primarymain"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                <span>All Files</span>
                <span className="ml-auto text-xs text-slate-400">{allFilesCount}</span>
              </button>
              {folders?.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => setSelectedFolder(folder.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFolder === folder.name
                      ? "bg-primarymain/10 text-primarymain"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="truncate">{folder.name}</span>
                  <span className="ml-auto text-xs text-slate-400">{folder.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search files..."
                className="pl-10 h-11 bg-white border-slate-200 rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                setUploadFolder(selectedFolder || "uploads");
                setUploadOpen(true);
              }}
              className="h-11 px-5 bg-primarymain hover:bg-primarymain/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>

          {/* File Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-slate-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Image className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No files found</h3>
              <p className="text-xs text-slate-500">
                {search ? "Try a different search term" : "Upload your first file to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {files.map((file) => (
                <div
                  key={file.key}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
                >
                  <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden relative">
                    {isImageFile(file.key) ? (
                      <img
                        src={file.url}
                        alt={file.key}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <File className="h-10 w-10 text-slate-300" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleCopyUrl(file.url, file.key)}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-slate-50 transition-colors"
                        title="Copy URL"
                      >
                        {copiedKey === file.key ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-slate-600" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteKey(file.key)}
                        className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-slate-700 truncate" title={file.key}>
                      {file.key.split("/").pop()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <DashboardPagination page={page} setPage={setPage} totalPages={totalPages} />
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <PluginModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload File"
        icon={<Upload className="h-5 w-5 text-primarymain" />}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Folder</label>
            <Input
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              placeholder="e.g. blogs, products, uploads"
              className="h-11"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Use existing folder or type a new one
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">File</label>
            <div className="relative">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,video/mp4,video/webm"
                onChange={handleUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl hover:border-primarymain/50 transition-colors">
                {isUploading ? (
                  <div className="text-center">
                    <div className="h-8 w-8 border-2 border-primarymain border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Uploading...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500">Click to select a file</p>
                    <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, GIF, WEBP, SVG, PDF | Max 2MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PluginModal>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKey} onOpenChange={() => setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
