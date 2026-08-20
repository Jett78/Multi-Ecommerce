import Image from "next/image";
import { Package } from "lucide-react";
import type { OrderItem, OrderStatus, PaymentStatus } from "@/types/order";

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { value: "processing", label: "Processing", color: "bg-purple-100 text-purple-800" },
  { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
  { value: "refunded", label: "Refunded", color: "bg-gray-100 text-gray-800" },
  { value: "expired", label: "Expired", color: "bg-orange-100 text-orange-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export function StatusBadge({ value, options }: { value: string; options: { value: string; label: string; color: string }[] }) {
  const config = options.find((o) => o.value === value);
  const color = config?.color ?? "bg-gray-100 text-gray-800";
  const label = config?.label ?? value;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

export function formatCurrency(amount: number) {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface ParsedAddress {
  address: string;
  localLevel: string;
  district: string;
  province: string;
  country: string;
}

export function parseShippingAddress(address?: string | null): ParsedAddress | null {
  if (!address) return null;
  const parts = address
    .split(", ")
    .map((p) => p.trim())
    .filter(Boolean);
  const [street, localLevel, district, province, country] = parts;
  return {
    address: street || "",
    localLevel: localLevel || "",
    district: district || "",
    province: province || "",
    country: country || "",
  };
}

export function AddressField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || "N/A"}</p>
    </div>
  );
}

export function OrderItemCard({ item }: { item: OrderItem }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:border-slate-300">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Package className="size-8" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{item.productName}</p>
            {item.variantName && (
              <p className="truncate text-xs text-slate-500">{item.variantName}</p>
            )}
          </div>
          <p className="shrink-0 font-bold text-slate-900">
            {formatCurrency(item.totalAmount)}
          </p>
        </div>

        {item.attributes && item.attributes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.attributes.map((attr, idx) => (
              <span
                key={`${attr.attributeName}-${idx}`}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
              >
                <span className="text-slate-400">{attr.attributeName}:</span>{" "}
                {attr.attributeValue}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2 text-sm text-slate-500">
          <span>
            {item.quantity} × {formatCurrency(item.unitPrice)}
          </span>
          {item.sku && <span className="text-xs text-slate-400">SKU: {item.sku}</span>}
        </div>
      </div>
    </div>
  );
}

