import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | undefined | null): string {
  if (price == null) return "Rs. 0";
  return `Rs. ${price.toLocaleString("en-NP", { maximumFractionDigits: 0 })}`;
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function toInputDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0] ?? "";
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getImageUrl(imageKey: string | undefined | null): string {
  if (!imageKey) return "";
  if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
    return imageKey;
  }
  const bucketName = process.env.S3_BUCKET_NAME || process.env.NEXT_PUBLIC_S3_BUCKET || "";
  const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_S3_REGION || "ap-south-1";
  const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL || process.env.NEXT_PUBLIC_CLOUDFRONT_URL || "";

  if (cloudfrontUrl) {
    return `https://${cloudfrontUrl}/${imageKey}`;
  }
  if (bucketName) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${imageKey}`;
  }
  return "";
}
