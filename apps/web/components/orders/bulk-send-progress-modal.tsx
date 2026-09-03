"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Loader2, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderSendStatus = "pending" | "sending" | "success" | "failed";

export interface OrderSendItem {
  id: string;
  orderId: string;
  status: OrderSendStatus;
  error?: string;
}

interface BulkSendProgressModalProps {
  open: boolean;
  onClose: () => void;
  items: OrderSendItem[];
  title?: string;
}

export default function BulkSendProgressModal({
  open,
  onClose,
  items,
  title = "Sending to Courier",
}: BulkSendProgressModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const completed = items.filter((i) => i.status === "success" || i.status === "failed").length;
  const total = items.length;
  const allDone = total > 0 && completed === total;

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTop = el.scrollHeight;
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && allDone) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, allDone, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={allDone ? onClose : undefined} />
      <div className="relative z-50 flex w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              allDone ? "bg-green-100" : "bg-primary/10"
            )}>
              {allDone ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : (
                <Truck className="size-5 text-primary animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500">
                {allDone
                  ? `Completed — ${items.filter((i) => i.status === "success").length} sent, ${items.filter((i) => i.status === "failed").length} failed`
                  : `${completed} of ${total} processed`}
              </p>
            </div>
          </div>
          {allDone && (
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className={cn(
              "h-full transition-all duration-300",
              allDone && items.some((i) => i.status === "failed")
                ? "bg-amber-500"
                : allDone
                ? "bg-green-500"
                : "bg-primary"
            )}
            style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
          />
        </div>

        {/* Order list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5 max-h-[50vh]">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                item.status === "pending" && "border-slate-100 bg-slate-50/50",
                item.status === "sending" && "border-primary/20 bg-primary/5",
                item.status === "success" && "border-green-200 bg-green-50/50",
                item.status === "failed" && "border-red-200 bg-red-50/50"
              )}
            >
              <div className="mt-0.5 shrink-0">
                {item.status === "pending" && (
                  <div className="size-4 rounded-full border-2 border-slate-300" />
                )}
                {item.status === "sending" && (
                  <Loader2 className="size-4 text-primary animate-spin" />
                )}
                {item.status === "success" && (
                  <CheckCircle className="size-4 text-green-600" />
                )}
                {item.status === "failed" && (
                  <XCircle className="size-4 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">#{item.orderId}</span>
                  <span className={cn(
                    "text-xs font-medium",
                    item.status === "pending" && "text-slate-400",
                    item.status === "sending" && "text-primary",
                    item.status === "success" && "text-green-600",
                    item.status === "failed" && "text-red-500"
                  )}>
                    {item.status === "pending" && "Waiting..."}
                    {item.status === "sending" && "Sending..."}
                    {item.status === "success" && "Sent successfully"}
                    {item.status === "failed" && (item.error || "Failed")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            disabled={!allDone}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              allDone
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            )}
          >
            {allDone ? "Close" : "Sending..."}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
