import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderItem, OrderStatus } from "@/types/order";

export interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon?: LucideIcon;
}

export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  { value: "processing", label: "Processing", color: "bg-purple-100 text-purple-800", icon: Package },
  { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800", icon: PackageCheck },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
];

export const PAYMENT_STATUS_OPTIONS: StatusOption[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800", icon: XCircle },
  { value: "refunded", label: "Refunded", color: "bg-gray-100 text-gray-800", icon: Ban },
  { value: "expired", label: "Expired", color: "bg-orange-100 text-orange-800", icon: Ban },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
];

export function StatusBadge({
  value,
  options,
  className,
}: {
  value: string;
  options: StatusOption[];
  className?: string;
}) {
  const config = options.find((o) => o.value === value);
  const color = config?.color ?? "bg-slate-100 text-slate-600";
  const label = config?.label ?? value;
  const Icon = config?.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-black/5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide",
        color,
        className
      )}
    >
      {Icon ? <Icon className="size-3" strokeWidth={2.5} /> : <span className="size-1.5 rounded-full bg-current opacity-60" />}
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
    timeZone: "Asia/Kathmandu",
  });
}

export function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  });
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kathmandu",
  });
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  khalti: "Khalti",
  cod: "Cash on Delivery",
  stripe: "Stripe",
};

export function paymentMethodLabel(method?: string | null) {
  if (!method) return "Not specified";
  return PAYMENT_METHOD_LABELS[method] ?? method.toUpperCase();
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

export function SectionCard({
  icon: Icon,
  title,
  badge,
  action,
  children,
  className,
  bodyClassName,
}: {
  icon: LucideIcon;
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primarymain/10 text-primarymain">
            <Icon className="size-4" strokeWidth={2.5} />
          </span>
          <h3 className="truncate text-xs font-black uppercase tracking-[0.15em] text-slate-600">
            {title}
          </h3>
          {badge}
        </div>
        {action}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  dark = false,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  dark?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-colors",
        dark ? "border-slate-900 bg-slate-900" : "border-slate-200/80 bg-white"
      )}
    >
      {dark && (
        <>
          <div className="absolute -right-10 -top-12 size-36 rounded-full bg-primarymain/50 blur-3xl" />
          <div className="absolute -bottom-14 -left-8 size-32 rounded-full bg-indigo-500/30 blur-3xl" />
        </>
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.18em]",
              dark ? "text-indigo-200/70" : "text-slate-400"
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "break-words font-black tracking-tight",
              dark ? "text-white" : "text-slate-900",
              valueClassName ?? "text-xl"
            )}
          >
            {value}
          </p>
          {sub && (
            <div className={cn("text-xs font-medium", dark ? "text-indigo-100/70" : "text-slate-500")}>
              {sub}
            </div>
          )}
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            dark ? "bg-white/10 text-indigo-200" : "bg-primarymain/10 text-primarymain"
          )}
        >
          <Icon className="size-4" strokeWidth={2.5} />
        </span>
      </div>
    </div>
  );
}

const FLOW_STEPS: { value: OrderStatus; label: string; icon: LucideIcon }[] = [
  { value: "pending", label: "Pending", icon: Clock },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { value: "processing", label: "Processing", icon: Package },
  { value: "shipped", label: "Shipped", icon: Truck },
  { value: "delivered", label: "Delivered", icon: PackageCheck },
];

export function OrderProgress({ status }: { status: OrderStatus }) {
  const cancelled = status === "cancelled";
  const currentIndex = cancelled ? -1 : FLOW_STEPS.findIndex((s) => s.value === status);

  return (
    <div className="space-y-4">
      {cancelled && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <Ban className="size-4 shrink-0" />
          This order has been cancelled
        </div>
      )}

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[520px] items-start">
          {FLOW_STEPS.map((step, i) => {
            const state = cancelled
              ? "cancelled"
              : i < currentIndex
                ? "done"
                : i === currentIndex
                  ? "current"
                  : "todo";
            const StepIcon = step.icon;

            return (
              <Fragment key={step.value}>
                {i > 0 && (
                  <span
                    className={cn(
                      "mt-[17px] h-0.5 min-w-4 flex-1 rounded-full",
                      !cancelled && i <= currentIndex ? "bg-primarymain" : "bg-slate-200"
                    )}
                  />
                )}
                <span className="flex w-[86px] shrink-0 flex-col items-center gap-2 text-center">
                  <span
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-full border-2 transition-colors",
                      state === "done" && "border-primarymain bg-primarymain text-white",
                      state === "current" &&
                        "border-primarymain bg-white text-primarymain ring-4 ring-primarymain/15",
                      state === "todo" && "border-slate-200 bg-white text-slate-300",
                      state === "cancelled" && "border-red-200 bg-red-50 text-red-400"
                    )}
                  >
                    <StepIcon className="size-4" strokeWidth={2.5} />
                    {state === "current" && (
                      <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse rounded-full bg-primarymain ring-2 ring-white" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      state === "todo"
                        ? "text-slate-400"
                        : state === "cancelled"
                          ? "text-red-400"
                          : "text-slate-800"
                    )}
                  >
                    {step.label}
                  </span>
                </span>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AddressField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">{value || "N/A"}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
      <Package className="size-6 text-slate-300" />
      <p className="text-xs font-medium text-slate-400">{message}</p>
    </div>
  );
}

export function OrderItemCard({ item }: { item: OrderItem }) {
  const productHref = item.product?.slug ? `/products/${item.product.slug}` : null;

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-primarymain/40 sm:p-4">
      <div className="flex gap-3.5 sm:gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:size-20">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.productName}
              fill
              sizes="80px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Package className="size-7" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0 space-y-0.5">
            {productHref ? (
              <Link
                href={productHref}
                target="_blank"
                className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-primarymain"
              >
                <span className="truncate">{item.productName}</span>
                <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
              </Link>
            ) : (
              <p className="truncate text-sm font-bold text-slate-900">{item.productName}</p>
            )}
            {item.variantName && (
              <p className="truncate text-xs font-medium text-slate-500">{item.variantName}</p>
            )}
          </div>

          {item.attributes && item.attributes.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {item.attributes.map((attr, idx) => (
                <span
                  key={`${attr.attributeName}-${idx}`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                >
                  <span className="text-slate-400">{attr.attributeName}:</span>{" "}
                  {attr.attributeValue}
                </span>
              ))}
            </div>
          )}

          {item.sku && (
            <p className="mt-2 font-mono text-[11px] font-semibold text-slate-500">
              SKU: {item.sku}
            </p>
          )}
        </div>
      </div>

      {/* Price breakdown: unit price / quantity / line total */}
      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Unit price
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {formatCurrency(item.unitPrice)}
          </p>
        </div>

        <div className="border-x border-slate-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Quantity
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">{item.quantity}</p>
        </div>

        <div className="bg-primarymain/5 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-primarymain">
            Line total
          </p>
          <p className="mt-1 text-sm font-black text-primarymain">
            {formatCurrency(item.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
