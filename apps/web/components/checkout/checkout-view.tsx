"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Truck, ShieldCheck, User, Mail, Phone, FileText, Lock, Loader2 } from "lucide-react";
import { createOrderFromCart } from "@/actions/order-action";
import { useCartStore } from "@/stores/cart-store";
import { showSuccess, showError } from "@/lib/toast-helper";
import { useSession, signIn } from "@/lib/auth-client";
import { API_ROUTES } from "@/config/api-routes";
import PrimaryButton from "@/components/ui/primary-button";
import { SavedAddressSelector } from "@/components/address/saved-address-selector";
import type { PaymentMethod } from "@/types/order";
import type { ShippingAddress } from "@/types/address";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function CheckoutView({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.itemCount());
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: session, isPending } = useSession() as any;
  const isAuthenticated = !!session?.user;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cod");

  // Login modal state (shown only when the user tries to place the order)
  const [showLogin, setShowLogin] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | undefined>(undefined);
  const [selectedAddress, setSelectedAddress] = React.useState<ShippingAddress | null>(null);

  const applyAddress = (addr: ShippingAddress) => {
    setSelectedAddress(addr);
    setSelectedAddressId(addr.id);
  };

  // Prefill contact details from the authenticated session
  React.useEffect(() => {
    if (isAuthenticated && session?.user) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || session.user.name || "",
        customerEmail: prev.customerEmail || session.user.email || "",
      }));
    }
  }, [isAuthenticated, session?.user]);

  // Fetch profile to prefill phone (session user object may not include phone)
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    fetch(API_ROUTES.AUTH_PROFILE, { credentials: "include", signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        const phone = d?.data?.phone;
        if (phone) {
          setFormData((prev) => ({ ...prev, customerPhone: prev.customerPhone || phone }));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isAuthenticated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fullAddress = selectedAddress
    ? [selectedAddress.streetAddress, selectedAddress.municipality, selectedAddress.district, `Province ${selectedAddress.provinceId}`, "Nepal"]
        .filter(Boolean)
        .join(", ")
    : "";

  const placeOrder = async () => {
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
        landmark: selectedAddress?.landmark || undefined,
        notes: formData.notes || undefined,
      });

      showSuccess("Order placed successfully!");
      clearCart();
      if (onClose) onClose();
      router.push("/profile/user");
    } catch (error: any) {
      const message = error?.message || "Failed to place order. Please try again.";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      showError("Please fill in all required fields");
      return;
    }

    if (!selectedAddressId) {
      showError("Please select a delivery address");
      return;
    }

    if (items.length === 0) {
      showError("Your cart is empty");
      return;
    }

    // Only now, after the form is fully filled, ask the user to log in
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    await placeOrder();
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const { error } = await signIn.email({ email: loginEmail, password: loginPassword });
      if (error) {
        setLoginError(error.message || "Login failed. Please try again.");
        return;
      }
      // Keep the navbar/role cookie consistent with the rest of the app
      try {
        const res = await fetch(`${API_URL}/auth/profile`, { credentials: "include" });
        const data = await res.json();
        const role = data?.data?.role || "customer";
        document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`;
      } catch {
        /* non-fatal */
      }
      // Session updated → continue placing the order
      setShowLogin(false);
      await placeOrder();
    } catch {
      setLoginError("An error occurred. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #faf5ff 100%)" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primarymain border-t-transparent" />
      </div>
    );
  }

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
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Checkout</h1>
          <p className="mt-3 text-base text-gray-500">Complete your order</p>
        </div>

        {/* Saved address selector — OUTSIDE the form to avoid nested <form> (invalid HTML) */}
        {isAuthenticated && (
          <div className="mb-6">
            <SavedAddressSelector selectedId={selectedAddressId} onApply={applyAddress} />
          </div>
        )}

        {!isAuthenticated && (
          <div className="mb-6 rounded-3xl border border-primarymain/30 bg-primarymain/5 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primarymain/10 text-primarymain">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">Please log in to checkout</h2>
                <p className="mt-1 text-sm text-gray-500">
                  You need to be signed in to place your order. Your details will be prefilled after you log in.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-primarymain px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primarymain/90 active:scale-[0.98]"
                >
                  Login to continue
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left: Forms */}
            <div className="lg:col-span-3 space-y-6">

              {/* Contact Information */}
              <div className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-indigo-100/10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primarymain text-white">
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
              </div>

              {/* Order Notes */}
              <div className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-indigo-100/10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primarymain text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Order Notes</h2>
                    <p className="text-xs text-gray-400">Any special delivery instructions?</p>
                  </div>
                </div>

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

              {/* Payment Method */}
              <div className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-indigo-100/10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primarymain text-white">
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

                <div className="mt-6 flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <p className="text-xs font-medium text-green-700">
                    Your payment is secure and encrypted
                  </p>
                </div>

                {!isAuthenticated && (
                  <p className="mt-3 text-center text-xs text-gray-500">
                    You&apos;ll be asked to sign in when you place your order.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primarymain px-6 py-4 text-sm font-bold text-white transition-all hover:bg-primarymain/90 hover:shadow-lg hover:shadow-primarymain/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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

      {/* Login modal — only shown after the user fills the form and clicks Place Order */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primarymain/10 mb-3">
                <Lock className="h-6 w-6 text-primarymain" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Login to checkout</h2>
              <p className="mt-1 text-sm text-gray-500">Sign in to place your order</p>
            </div>

            <form onSubmit={handleInlineLogin} className="space-y-4">
              {loginError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 text-center">
                  {loginError}
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 disabled:opacity-50"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-primarymain focus:ring-2 focus:ring-primarymain/20 disabled:opacity-50"
                />
              </div>

              <PrimaryButton
                text={isLoggingIn ? "Signing in..." : "Sign In & Place Order"}
                type="submit"
                disabled={isLoggingIn}
                className="w-full !py-3.5"
              />
            </form>

            <div className="mt-5 flex items-center justify-between text-sm">
              <Link
                href={`/login?redirect=${encodeURIComponent("/checkout")}`}
                className="font-medium text-primarymain hover:underline"
              >
                Full login page
              </Link>
              <Link href="/register" className="font-medium text-primarymain hover:underline">
                Create account
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
