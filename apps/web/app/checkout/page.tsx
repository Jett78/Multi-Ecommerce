"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Truck, ShieldCheck, MapPin, User, Mail, Phone, FileText, ChevronDown } from "lucide-react";
import { createOrderFromCart } from "@/actions/order-action";
import { useCartStore } from "@/stores/cart-store";
import { showSuccess, showError } from "@/lib/toast-helper";
import { provinces } from "@/data/nepal-geography";
import type { PaymentMethod } from "@/types/order";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.itemCount());
  const clearCart = useCartStore((s) => s.clearCart);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [step, setStep] = React.useState(1);

  const [formData, setFormData] = React.useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    province: "",
    district: "",
    localLevel: "",
    landmark: "",
    streetAddress: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cod");

  const selectedProvince = provinces.find((p) => p.id === Number(formData.province));
  const selectedDistrict = selectedProvince?.districts.find((d) => d.name === formData.district);
  const availableDistricts = selectedProvince?.districts || [];
  const availableLocalLevels = selectedDistrict?.localLevels || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "province") {
        next.district = "";
        next.localLevel = "";
      }
      if (name === "district") {
        next.localLevel = "";
      }
      return next;
    });
  };

  const fullAddress = [formData.streetAddress, formData.localLevel, formData.district, formData.province ? `Province ${formData.province}` : "", "Nepal"]
    .filter(Boolean)
    .join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      showError("Please fill in all required fields");
      return;
    }

    if (!formData.province || !formData.district || !formData.localLevel || !formData.streetAddress) {
      showError("Please fill in your complete address");
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
        customerPhone: formData.customerPhone,
        shippingAddress: fullAddress,
        billingAddress: fullAddress,
        landmark: formData.landmark || undefined,
        notes: formData.notes || undefined,
      });

      showSuccess("Order placed successfully!");
      clearCart();
      router.push(`/order/confirmation/${order.id}`);
    } catch (error: any) {
      const message = error?.message || "Failed to place order. Please try again.";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #faf5ff 100%)" }}>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-3xl border border-indigo-100 bg-white/80 backdrop-blur-sm py-16 text-center shadow-xl shadow-indigo-100/20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mb-4">
              <Truck className="h-8 w-8 text-primarymain" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-500">Add some items to get started.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #faf5ff 100%)" }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Checkout
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Complete your order in just a few steps
          </p>

          {/* Progress Steps */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {[
              { num: 1, label: "Contact" },
              { num: 2, label: "Shipping" },
              { num: 3, label: "Payment" },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => setStep(s.num)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    step === s.num
                      ? "bg-primarymain text-white shadow-lg shadow-primarymain/30"
                      : step > s.num
                      ? "bg-primarymain/10 text-primarymain"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step === s.num ? "bg-white/20" : step > s.num ? "bg-primarymain/20" : "bg-gray-200"
                  }`}>
                    {step > s.num ? "✓" : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < 2 && (
                  <div className={`h-0.5 w-8 sm:w-16 rounded-full transition-colors duration-300 ${
                    step > s.num ? "bg-primarymain" : "bg-gray-200"
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left: Forms */}
            <div className="lg:col-span-3 space-y-6">
              {/* Step 1: Contact Information */}
              <div className={`rounded-3xl border bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-indigo-100/10 transition-all duration-500 ${
                step === 1 ? "border-indigo-200 ring-2 ring-indigo-100" : "border-gray-100"
              }`}>
                <div className="mb-6 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    step >= 1 ? "bg-primarymain text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
                    <p className="text-xs text-gray-400">How can we reach you?</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <input
                        type="email"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        required
                        placeholder="you@example.com"
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <input
                        type="tel"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        required
                        placeholder="+977 98XXXXXXXX"
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-6 w-full rounded-xl bg-primarymain py-3 text-sm font-semibold text-white transition-all hover:bg-primarymain/90 hover:shadow-lg hover:shadow-primarymain/25 active:scale-[0.98]"
                >
                  Continue to Shipping
                </button>
              </div>

              {/* Step 2: Shipping Address */}
              <div className={`rounded-3xl border bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-indigo-100/10 transition-all duration-500 ${
                step === 2 ? "border-indigo-200 ring-2 ring-indigo-100" : "border-gray-100"
              }`}>
                <div className="mb-6 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    step >= 2 ? "bg-primarymain text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                    <p className="text-xs text-gray-400">Where should we deliver?</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Province */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Province <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        required
                        className="block w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pr-10 text-sm text-gray-900 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
                      >
                        <option value="">Select Province</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            Province {p.id} - {p.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    </div>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      District <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.province}
                        className="block w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pr-10 text-sm text-gray-900 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <option value="">
                          {formData.province ? "Select District" : "Select Province first"}
                        </option>
                        {availableDistricts.map((d) => (
                          <option key={d.name} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    </div>
                  </div>

                  {/* Local Level */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Municipality / Rural Municipality <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="localLevel"
                        value={formData.localLevel}
                        onChange={handleInputChange}
                        required
                        disabled={!formData.district}
                        className="block w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pr-10 text-sm text-gray-900 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <option value="">
                          {formData.district ? "Select Local Level" : "Select District first"}
                        </option>
                        {availableLocalLevels.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    </div>
                  </div>

                  {/* Landmark */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Landmark
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        placeholder="Near temple, school, etc."
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Street Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                      <textarea
                        name="streetAddress"
                        value={formData.streetAddress}
                        onChange={handleInputChange}
                        required
                        rows={2}
                        placeholder="Ward number, street name, house number..."
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Order Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      Order Notes (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="Any special delivery instructions..."
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-all focus:border-primarymain focus:bg-white focus:ring-2 focus:ring-primarymain/10 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="mt-6 w-full rounded-xl bg-primarymain py-3 text-sm font-semibold text-white transition-all hover:bg-primarymain/90 hover:shadow-lg hover:shadow-primarymain/25 active:scale-[0.98]"
                >
                  Continue to Payment
                </button>
              </div>

              {/* Step 3: Payment Method */}
              <div className={`rounded-3xl border bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-indigo-100/10 transition-all duration-500 ${
                step === 3 ? "border-indigo-200 ring-2 ring-indigo-100" : "border-gray-100"
              }`}>
                <div className="mb-6 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    step >= 3 ? "bg-primarymain text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                    <p className="text-xs text-gray-400">How would you like to pay?</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "cod" as PaymentMethod, label: "Cash on Delivery", desc: "Pay when you receive your order", icon: "💵" },
                    { id: "khalti" as PaymentMethod, label: "Khalti", desc: "Pay via Khalti digital wallet", icon: "📱" },
                    { id: "stripe" as PaymentMethod, label: "Credit/Debit Card", desc: "Pay via Stripe (Visa, Mastercard)", icon: "💳" },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200 ${
                        paymentMethod === method.id
                          ? "border-primarymain bg-primarymain/5 shadow-md shadow-primarymain/10"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
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
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                        <p className="text-xs text-gray-400">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-3xl border border-indigo-100 bg-white/80 backdrop-blur-sm p-6 shadow-xl shadow-indigo-100/20">
                <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                <p className="text-xs text-gray-400 mt-1">{itemCount} {itemCount === 1 ? "item" : "items"} in your cart</p>

                <div className="mt-6 max-h-72 space-y-4 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex items-center gap-3">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] font-medium text-gray-300">
                            IMG
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {item.productName}
                        </p>
                        {item.attributes && item.attributes.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {item.attributes.map((a) => a.attributeValue).join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        Rs. {(item.priceAtAdd * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-700">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-primarymain">
                        Rs. {subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mt-6 flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <p className="text-xs font-medium text-green-700">
                    Your payment is secure and encrypted
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || step !== 3}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primarymain px-6 py-4 text-sm font-bold text-white transition-all hover:bg-primarymain/90 hover:shadow-lg hover:shadow-primarymain/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Place Order — Rs. {subtotal.toLocaleString()}
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
