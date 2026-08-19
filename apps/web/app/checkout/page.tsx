"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Truck, ShieldCheck } from "lucide-react";
import { createOrderFromCart } from "@/actions/order-action";
import { useCartStore } from "@/stores/cart-store";
import { showSuccess, showError } from "@/lib/toast-helper";
import type { PaymentMethod } from "@/types/order";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.itemCount());
  const clearCart = useCartStore((s) => s.clearCart);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cod");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
      showError("Please fill in all required fields");
      return;
    }

    if (items.length === 0) {
      showError("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrderFromCart({
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          priceAtAdd: i.priceAtAdd,
        })),
        paymentMethod,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || undefined,
        shippingAddress: formData.shippingAddress,
        notes: formData.notes || undefined,
      });

      if (order) {
        showSuccess("Order placed successfully!");
        clearCart();
        router.push(`/order/confirmation/${order.id}`);
      } else {
        showError("Failed to place order");
      }
    } catch (error) {
      showError("Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">No items to checkout</h2>
            <p className="mt-2 text-sm text-gray-500">
              Add some items to your cart first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primarymain" />
                  <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Shipping Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="mb-6 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primarymain" />
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "cod" as PaymentMethod, label: "Cash on Delivery", desc: "Pay when you receive your order" },
                    { id: "khalti" as PaymentMethod, label: "Khalti", desc: "Pay via Khalti digital wallet" },
                    { id: "stripe" as PaymentMethod, label: "Credit/Debit Card", desc: "Pay via Stripe (Visa, Mastercard)" },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                        paymentMethod === method.id
                          ? "border-primarymain bg-primarymain/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="h-4 w-4 text-primarymain focus:ring-primarymain/20"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                            IMG
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium text-gray-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-900">
                        Rs. {(item.priceAtAdd * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <div className="flex justify-between">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-base font-bold text-primarymain">
                        Rs. {subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primarymain px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primarymain/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
