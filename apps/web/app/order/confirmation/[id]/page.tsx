"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { getOrderById } from "@/actions/order-action";
import type { Order, OrderItem } from "@/types/order";

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOrder = async () => {
      try {
        const result = await getOrderById(orderId);
        setOrder(result);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondarymain border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Order not found</h2>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-secondarymain hover:underline"
            >
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Thank you for your order. We&apos;ll send you a confirmation email shortly.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="text-lg font-bold text-gray-900">{order.orderId}</p>
          </div>

          <div className="mt-6 text-left">
            <h2 className="text-sm font-semibold text-gray-900">Order Details</h2>
            <div className="mt-3 space-y-2">
              {order.items?.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {item.productName} x {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    Rs. {item.totalAmount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-secondarymain">
                  Rs. {order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 justify-center text-sm text-gray-600">
            <Package className="h-4 w-4" />
            <span>Payment: {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/orders"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondarymain px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondarymain/90"
            >
              View My Orders
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
