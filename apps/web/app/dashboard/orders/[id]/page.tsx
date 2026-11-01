import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CreditCard,
  Hash,
  Landmark,
  Mail,
  MapPin,
  Package,
  Phone,
  StickyNote,
  Timer,
  Truck,
  User,
} from "lucide-react";
import BreadCrumbs from "@/components/ui/bread-crumbs";
import NoData from "@/components/no-data";
import { getOrderByIdServer } from "@/actions/order-action";
import OrderActions from "../order-actions";
import DownloadInvoiceButton from "@/components/invoices/download-invoice-button";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  StatusBadge,
  SectionCard,
  StatTile,
  OrderProgress,
  EmptyState,
  formatCurrency,
  formatDate,
  formatShortDate,
  formatTime,
  paymentMethodLabel,
  parseShippingAddress,
  AddressField,
  OrderItemCard,
} from "../order-detail-ui";
import type { Order, OrderItem } from "@/types/order";

type OrderDetail = Order & { items: OrderItem[] };

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = (await getOrderByIdServer(id)) as OrderDetail | null;

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
          <h2 className="text-lg font-black tracking-tight text-primarymain">Order Details</h2>
          <BreadCrumbs path="orders" page="Details" />
        </div>
        <NoData title="Order" />
      </div>
    );
  }

  const items = order.items || [];
  const parsed = parseShippingAddress(order.shippingAddress);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const couponCode = order.orderCoupons?.[0]?.couponCode;
  const hasBillingDiff =
    !!order.billingAddress &&
    !!order.shippingAddress &&
    order.billingAddress.trim() !== order.shippingAddress.trim();

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="flex items-start gap-3">
            <Link
              href="/dashboard/orders"
              aria-label="Back to orders"
              className="group mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primarymain/30 hover:text-primarymain"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Link href="/dashboard/orders" className="transition-colors hover:text-primarymain">
                  Orders
                </Link>
                <span>/</span>
                <span className="text-slate-500">Details</span>
              </div>
              <h1 className="mt-1.5 flex flex-wrap items-center gap-2.5 text-2xl font-black tracking-tight text-slate-900">
                Order
                <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-sm font-bold text-white">
                  #{order.orderId.slice(-8)}
                </span>
              </h1>
              <p className="mt-1.5 text-xs font-medium text-slate-500">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="hidden sm:block">
            <BreadCrumbs path="orders" page="Details" />
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

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DownloadInvoiceButton order={order} />
          </div>
        </div>
      </header>

      {/* Key figures */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          dark
          icon={Banknote}
          label="Order Total"
          value={formatCurrency(order.totalAmount)}
          sub={`${items.length} item${items.length === 1 ? "" : "s"} · ${totalUnits} unit${totalUnits === 1 ? "" : "s"}`}
        />
        <StatTile
          icon={CreditCard}
          label="Payment"
          value={paymentMethodLabel(order.paymentMethod)}
          valueClassName="text-lg"
          sub={<StatusBadge value={order.paymentStatus} options={PAYMENT_STATUS_OPTIONS} />}
        />
        <StatTile
          icon={Package}
          label="Delivery Charge"
          value={order.deliveryCharge > 0 ? formatCurrency(order.deliveryCharge) : "Free"}
          valueClassName={order.deliveryCharge > 0 ? "text-lg" : "text-lg text-emerald-600"}
          sub={
            order.discountAmount > 0
              ? `${formatCurrency(order.discountAmount)} saved with coupon`
              : "No discount applied"
          }
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
        className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-100"
        badge={
          <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
            {order.status}
          </span>
        }
      >
        <OrderProgress status={order.status} />
      </SectionCard>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
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
                {items.map((item) => (
                  <OrderItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </SectionCard>

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
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Paid via
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">
                    {paymentMethodLabel(order.paymentMethod)}
                  </p>
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

          <SectionCard icon={User} title="Customer">
            <div className="flex items-center gap-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primarymain to-indigo-700 text-base font-black text-white ring-4 ring-primarymain/10">
                {getInitials(order.customerName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {order.customerName || "N/A"}
                </p>
                <p className="truncate text-xs font-medium text-slate-500">
                  {order.customerEmail || "No email provided"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {order.customerEmail ? (
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-primarymain/30 hover:text-primarymain"
                >
                  <Mail className="size-4 shrink-0 text-slate-400" />
                  <span className="truncate">{order.customerEmail}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-400">
                  <Mail className="size-4 shrink-0" />
                  No email provided
                </div>
              )}

              {order.customerPhone ? (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-primarymain/30 hover:text-primarymain"
                >
                  <Phone className="size-4 shrink-0 text-slate-400" />
                  <span className="truncate">{order.customerPhone}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-400">
                  <Phone className="size-4 shrink-0" />
                  No phone provided
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={MapPin} title="Shipping Address">
            {parsed || order.landmark ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <AddressField label="Province" value={parsed?.province} />
                  <AddressField label="District" value={parsed?.district} />
                  <AddressField label="Local Level" value={parsed?.localLevel} />
                  <AddressField label="Address" value={parsed?.address} />
                  <AddressField label="Landmark" value={order.landmark} />
                  {parsed?.country && <AddressField label="Country" value={parsed.country} />}
                </div>

                {hasBillingDiff && (
                  <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      <Landmark className="size-3" />
                      Billing Address
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700">
                      {order.billingAddress}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="No shipping address was provided for this order." />
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6 h-fit lg:sticky lg:top-6 lg:z-20">
          <div >
            <OrderActions
              orderId={order.id}
              initialStatus={order.status}
              initialPaymentStatus={order.paymentStatus}
              courierProvider={order.courierProvider}
              courierConsignmentId={order.courierConsignmentId}
              courierTrackingUrl={order.courierTrackingUrl}
              district={order.district}
            />
          </div>

          {(order.courierProvider ||
            order.courierConsignmentId ||
            order.courierTrackingUrl) && (
            <SectionCard icon={Truck} title="Courier">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <AddressField label="Provider" value={order.courierProvider} />
                  <AddressField label="Status" value={order.courierStatus} />
                </div>
                {order.courierConsignmentId && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
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
                    Track shipment
                  </a>
                )}
              </div>
            </SectionCard>
          )}

          {order.notes && (
            <SectionCard icon={StickyNote} title="Order Notes">
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3">
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-amber-900">
                  {order.notes}
                </p>
              </div>
            </SectionCard>
          )}

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
        </div>
      </div>
    </div>
  );
}
