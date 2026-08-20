import { User, MapPin, Package, CreditCard } from "lucide-react";
import BreadCrumbs from "@/components/ui/bread-crumbs";
import NoData from "@/components/no-data";
import { getOrderByIdServer } from "@/actions/order-action";
import OrderActions from "../order-actions";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  StatusBadge,
  formatCurrency,
  parseShippingAddress,
  AddressField,
  OrderItemCard,
} from "../order-detail-ui";
import type { Order, OrderItem } from "@/types/order";

type OrderDetail = Order & { items: OrderItem[] };

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-wrap justify-between gap-x-8 gap-y-6">
        <h2 className="text-lg font-black tracking-tight text-primarymain">Order Details</h2>
        <BreadCrumbs path="orders" page="Details" />
      </div>

      <OrderActions
        orderId={order.id}
        initialStatus={order.status}
        initialPaymentStatus={order.paymentStatus}
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge value={order.status} options={ORDER_STATUS_OPTIONS} />
        <StatusBadge value={order.paymentStatus} options={PAYMENT_STATUS_OPTIONS} />
        <span className="text-sm text-slate-500">
          Paid via {order.paymentMethod ? order.paymentMethod.toUpperCase() : "N/A"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: products */}
        <div className="space-y-4">
          <div className="space-y-3 p-4 bg-white rounded-xl">
            <div className="flex items-center gap-2 text-slate-700">
              <Package className="size-4" />
              <span className="text-sm font-semibold">Items ({items.length})</span>
            </div>

            <div className="grid gap-3">
              {items.map((item) => (
                <OrderItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>- {formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="space-y-2 p-4 bg-white rounded-xl">
              <div className="flex items-center gap-2 text-slate-700">
                <CreditCard className="size-4" />
                <span className="text-sm font-semibold">Notes</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right: user info */}
        <div className="space-y-4">
          <div className="space-y-3 p-4 bg-white rounded-xl">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="size-4" />
              <span className="text-sm font-semibold">Customer</span>
            </div>
            <div className="text-sm text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">{order.customerName || "N/A"}</p>
              <p>{order.customerEmail || "N/A"}</p>
              <p>{order.customerPhone || "N/A"}</p>
            </div>
          </div>

          {(() => {
            if (!parsed && !order.landmark) return null;
            return (
              <div className="space-y-4 p-4 bg-white rounded-xl">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="size-4" />
                  <span className="text-sm font-semibold">Address Details</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AddressField label="Province" value={parsed?.province} />
                  <AddressField label="District" value={parsed?.district} />
                  <AddressField label="Local Level" value={parsed?.localLevel} />
                  <AddressField label="Address" value={parsed?.address} />
                  <AddressField label="Landmark" value={order.landmark} />
                </div>
              </div>
            );
          })()}

          {order.notes && (
            <div className="space-y-2 p-4 bg-white rounded-xl">
              <div className="flex items-center gap-2 text-slate-700">
                <CreditCard className="size-4" />
                <span className="text-sm font-semibold">Notes</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
