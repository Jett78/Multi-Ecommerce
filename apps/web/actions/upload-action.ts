"use server";

import { cookies } from "next/headers";
import type { UploadResponse, UploadResult } from "@/types/upload";

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function uploadSingleImage(
  formData: FormData
): Promise<UploadResult> {
  try {
    const cookieStore = await cookies();
    const headers: Record<string, string> = {};
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data: UploadResponse = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.message || "Upload failed" };
    }

    return {
      success: true,
      data: {
        urls: { original: data.data.url },
        keys: { original: data.data.key },
      },
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Upload failed" };
  }
}

export async function uploadMultipleImages(
  formData: FormData
): Promise<{ success: boolean; data?: Array<{ url: string; key: string }>; error?: string }> {
  try {
    const cookieStore = await cookies();
    const headers: Record<string, string> = {};
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.message || "Upload failed" };
    }

    const results = Array.isArray(data.data) ? data.data : [data.data];
    return {
      success: true,
      data: results.map((item: any) => ({
        url: item.url,
        key: item.key,
      })),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Upload failed" };
  }
}

export async function uploadFromUrl(
  url: string,
  folder: string = "uploads"
): Promise<UploadResult> {
  try {
    const cookieStore = await cookies();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const response = await fetch(`${API_BASE_URL}/upload/from-url`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url, folder }),
    });

    const data: UploadResponse = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.message || "Upload failed" };
    }

    return {
      success: true,
      data: {
        urls: { original: data.data.url },
        keys: { original: data.data.key },
      },
    };
  } catch (error) {
    console.error("Upload from URL error:", error);
    return { success: false, error: "Failed to upload image from URL" };
  }
}
