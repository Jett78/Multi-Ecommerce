"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Order, OrderItem } from "@/types/order";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Copy,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  Package,
  Phone,
  StickyNote,
  Timer,
  Truck,
  User,
} from "lucide-react";
import { showSuccess } from "@/lib/toast-helper";
import DownloadInvoiceButton from "@/components/invoices/download-invoice-button";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  AddressField,
  EmptyState,
  OrderItemCard,
  OrderProgress,
  SectionCard,
  StatTile,
  StatusBadge,
  formatDate,
  formatCurrency,
  formatShortDate,
  formatTime,
  parseShippingAddress,
  paymentMethodLabel,
} from "@/app/dashboard/orders/order-detail-ui";

export default function ProfileOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const crud = useCrud<Order>({
    endpoint: API_ROUTES.ORDERS,
    queryKey: "my-orders",
    isAuthenticated: true,
  });

  const { data, isLoading, isError } = crud.getOne(orderId);

  const order = React.useMemo(() => {
    if (!data) return null;
    if (typeof data === "object" && "id" in data) return data as Order;
    return null;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-6 w-52 rounded bg-gray-200" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-gray-100 bg-white p-4">
              <div className="h-3 w-20 rounded bg-gray-100" />
              <div className="mt-3 h-5 w-28 rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="h-40 rounded-2xl border border-gray-100 bg-white" />
        <div className="h-72 rounded-2xl border border-gray-100 bg-white" />
        <div className="h-56 rounded-2xl border border-gray-100 bg-white" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gray-50">
          <Package className="size-7 text-gray-300" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">Order not found</h2>
        <p className="mt-1 text-sm text-gray-400">
          This order may have been removed or the link is incorrect.
        </p>
        <Link
          href="/profile/user/orders"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
        >
          <ArrowLeft className="size-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const parsed = parseShippingAddress(order.shippingAddress);
  const hasStructuredAddress = !!(parsed?.province || parsed?.district || parsed?.localLevel);
  const couponCode = order.orderCoupons?.[0]?.couponCode;

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    showSuccess("Order ID copied!");
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex items-start gap-3">
            <Link
              href="/profile/user/orders"
              aria-label="Back to orders"
              className="group mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primarymain/30 hover:text-primarymain"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Link
                  href="/profile/user/orders"
                  className="transition-colors hover:text-primarymain"
                >
                  Orders
                </Link>
                <span>/</span>
                <span className="text-slate-500">Details</span>
              </div>
              <h1 className="mt-1.5 flex flex-wrap items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
                Order
                <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-sm font-bold text-white">
                  #{order.orderId.slice(-8)}
                </span>
                <button
                  type="button"
                  onClick={copyOrderId}
                  title="Copy full order ID"
                  className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-primarymain/30 hover:text-primarymain"
                >
                  <Copy className="size-3.5" />
                </button>
              </h1>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge value={order.status} options={ORDER_STATUS_OPTIONS} />
          <StatusBadge value={order.paymentStatus} options={PAYMENT_STATUS_OPTIONS} />
          {order.courierStatus && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
              <Truck className="size-3" />
              {order.courierStatus}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
            <CreditCard className="size-3" />
            {paymentMethodLabel(order.paymentMethod)}
          </span>

          {order.courierTrackingUrl && (
            <a
              href={order.courierTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primarymain/30 bg-primarymain/5 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primarymain transition-colors hover:bg-primarymain/10"
            >
              Track shipment
            </a>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DownloadInvoiceButton order={{ ...order, items }} />
          </div>
        </div>
      </header>

      {/* Key figures */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          dark
          icon={Banknote}
          label="Order Total"
          value={formatCurrency(order.totalAmount)}
          sub={`${items.length} item${items.length === 1 ? "" : "s"}`}
        />
        <StatTile
          icon={CreditCard}
          label="Payment"
          value={paymentMethodLabel(order.paymentMethod)}
          valueClassName="text-lg"
          sub={<StatusBadge value={order.paymentStatus} options={PAYMENT_STATUS_OPTIONS} />}
        />
        <StatTile
          icon={CalendarDays}
          label="Placed"
          value={formatShortDate(order.createdAt)}
          valueClassName="text-lg"
          sub={`at ${formatTime(order.createdAt)}`}
        />
      </div>

      {/* Fulfillment progress */}
      <SectionCard
        icon={Truck}
        title="Fulfillment Progress"
        badge={
          <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
            {order.status}
          </span>
        }
      >
        <OrderProgress status={order.status} />
      </SectionCard>

      {/* Items */}
      <SectionCard
        icon={Package}
        title="Order Items"
        badge={
          <span className="rounded-full bg-primarymain/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primarymain">
            {items.length}
          </span>
        }
      >
        {items.length === 0 ? (
          <EmptyState message="No items were added to this order." />
        ) : (
          <div className="grid gap-3">
            {items.map((item: OrderItem) => (
              <OrderItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Payment summary */}
      <SectionCard icon={Hash} title="Payment Summary">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-medium">Subtotal</span>
            <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal)}</span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2 font-medium">
                Discount
                {couponCode && (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase text-emerald-700">
                    {couponCode}
                  </span>
                )}
              </span>
              <span className="font-bold text-emerald-600">
                - {formatCurrency(order.discountAmount)}
              </span>
            </div>
          )}

          {order.taxAmount > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Tax</span>
              <span className="font-semibold text-slate-800">{formatCurrency(order.taxAmount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-600">
            <span className="font-medium">Delivery</span>
            <span
              className={
                order.deliveryCharge > 0
                  ? "font-semibold text-slate-800"
                  : "font-bold text-emerald-600"
              }
            >
              {order.deliveryCharge > 0 ? formatCurrency(order.deliveryCharge) : "Free"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Total
            </span>
            <span className="text-lg font-black tracking-tight text-white">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {order.paymentMethod === "khalti" && (
                <Image
                  src="/icons/khalti.png"
                  alt="Khalti"
                  width={28}
                  height={28}
                  className="rounded-md object-contain"
                />
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Paid via
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-800">
                  {paymentMethodLabel(order.paymentMethod)}
                </p>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <StatusBadge value={order.paymentStatus} options={PAYMENT_STATUS_OPTIONS} />
              {order.transactionId && (
                <p className="font-mono text-[11px] text-slate-400">{order.transactionId}</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Address & contact */}
      <div className="grid gap-6 sm:grid-cols-2">
        <SectionCard icon={MapPin} title="Shipping Address">
          {hasStructuredAddress || order.shippingAddress ? (
            <div className="space-y-3">
              {hasStructuredAddress ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <AddressField label="Province" value={parsed?.province} />
                  <AddressField label="District" value={parsed?.district} />
                  <AddressField label="Local Level" value={parsed?.localLevel} />
                  <AddressField label="Address" value={parsed?.address} />
                  <AddressField label="Landmark" value={order.landmark} />
                  {parsed?.country && <AddressField label="Country" value={parsed.country} />}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Address
                  </p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm font-medium leading-relaxed text-slate-700">
                    {order.shippingAddress}
                  </p>
                </div>
              )}

              {!hasStructuredAddress && order.landmark && (
                <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Landmark
                  </p>
                  <p className="mt-0.5 break-words text-sm font-medium text-slate-700">
                    {order.landmark}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState message="No shipping address was provided for this order." />
          )}
        </SectionCard>

        <SectionCard icon={User} title="Contact">
          <div className="space-y-2">
            {order.customerName && (
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-sm font-semibold text-slate-800">
                <User className="size-4 shrink-0 text-slate-400" />
                <span className="truncate">{order.customerName}</span>
              </div>
            )}
            {order.customerEmail ? (
              <a
                href={`mailto:${order.customerEmail}`}
                className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-primarymain/30 hover:text-primarymain"
              >
                <Mail className="size-4 shrink-0 text-slate-400" />
                <span className="truncate">{order.customerEmail}</span>
              </a>
            ) : null}
            {order.customerPhone ? (
              <a
                href={`tel:${order.customerPhone}`}
                className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-primarymain/30 hover:text-primarymain"
              >
                <Phone className="size-4 shrink-0 text-slate-400" />
                <span className="truncate">{order.customerPhone}</span>
              </a>
            ) : null}
            {!order.customerName && !order.customerEmail && !order.customerPhone && (
              <EmptyState message="No contact details were provided." />
            )}
          </div>
        </SectionCard>
      </div>

      {/* Shipment tracking */}
      {(order.courierProvider ||
        order.courierConsignmentId ||
        order.courierTrackingUrl) && (
        <SectionCard icon={Truck} title="Shipment Tracking">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Courier
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-sm font-bold text-slate-800">
                  {order.courierProvider === "pathao" && (
                    <Image
                      src="/icons/pathao.png"
                      alt={order.courierProvider}
                      width={24}
                      height={24}
                      className="rounded object-contain"
                    />
                  )}
                  {order.courierProvider || "N/A"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Status
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-800">
                  {order.courierStatus || "N/A"}
                </p>
              </div>
            </div>

            {order.courierConsignmentId && (
              <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Consignment ID
                </p>
                <p className="mt-0.5 break-all font-mono text-sm font-bold text-slate-800">
                  {order.courierConsignmentId}
                </p>
              </div>
            )}

            {order.courierTrackingUrl && (
              <a
                href={order.courierTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primarymain/30 bg-primarymain/5 px-4 py-2.5 text-sm font-bold text-primarymain transition-colors hover:bg-primarymain/10"
              >
                <Truck className="size-4" />
                Track on courier website
              </a>
            )}
          </div>
        </SectionCard>
      )}

      {/* Notes */}
      {order.notes && (
        <SectionCard icon={StickyNote} title="Order Notes">
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3">
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-amber-900">
              {order.notes}
            </p>
          </div>
        </SectionCard>
      )}

      {/* Timestamps */}
      <SectionCard icon={Timer} title="Timestamps" bodyClassName="p-4">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold uppercase tracking-wider text-slate-400">Created</span>
            <span className="text-right font-semibold text-slate-700">
              {formatDate(order.createdAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold uppercase tracking-wider text-slate-400">Updated</span>
            <span className="text-right font-semibold text-slate-700">
              {formatDate(order.updatedAt)}
            </span>
          </div>
        </div>
      </SectionCard>

      <p className="text-center text-xs font-semibold text-slate-400">
        Need help with this order? Contact support with ID{" "}
        <span className="font-mono text-slate-500">{order.orderId}</span>
      </p>
    </div>
  );
}
