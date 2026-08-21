"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  User,
  Mail,
  Phone,
  FileText,
  Lock,
  Loader2,
  Check,
  ChevronRight,
  Package,
  Truck,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { createOrderFromCart } from "@/actions/order-action";
import { useCartStore } from "@/stores/cart-store";
import { showSuccess, showError } from "@/lib/toast-helper";
import { useSession, signIn } from "@/lib/auth-client";
import { API_ROUTES } from "@/config/api-routes";
import { SavedAddressSelector } from "@/components/address/saved-address-selector";
import type { PaymentMethod } from "@/types/order";
import type { ShippingAddress } from "@/types/address";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const paymentMethods = [
  {
    id: "cod" as PaymentMethod,
    label: "Cash on Delivery",
    desc: "Pay when you receive your order",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  },
  {
    id: "khalti" as PaymentMethod,
    label: "Khalti",
    desc: "Pay via Khalti digital wallet",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    id: "stripe" as PaymentMethod,
    label: "Credit / Debit Card",
    desc: "Pay via Stripe (Visa, Mastercard)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="3" />
        <path d="M1 10h22" />
      </svg>
    ),
  },
];

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

  React.useEffect(() => {
    if (isAuthenticated && session?.user) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || session.user.name || "",
        customerEmail: prev.customerEmail || session.user.email || "",
      }));
    }
  }, [isAuthenticated, session?.user]);

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
      await createOrderFromCart({
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
      showError(error?.message || "Failed to place order. Please try again.");
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
      try {
        const res = await fetch(`${API_URL}/auth/profile`, { credentials: "include" });
        const data = await res.json();
        const role = data?.data?.role || "customer";
        document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}`;
      } catch {}
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
      <div className="flex min-h-screen items-center justify-center bg-white/90">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-400 tracking-wide">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white/90 pt-24">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 mb-6">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-400">Add some items to get started.</p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              Browse Products
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                Checkout
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Complete your order in just a few steps
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600">Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Contact Information */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <SectionHeader
                  title="Contact Information"
                  subtitle="How can we reach you?"
                  icon={<User className="h-5 w-5" />}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      placeholder="John Doe"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      required
                      placeholder="you@example.com"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="+977 98XXXXXXXX"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {isAuthenticated && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <SavedAddressSelector selectedId={selectedAddressId} onApply={applyAddress} />
                </div>
              )}

              {!isAuthenticated && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold text-gray-900">Sign in to continue</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Sign in to save your address and complete your order faster.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowLogin(true)}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
                      >
                        Sign in
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <SectionHeader
                  title="Order Notes"
                  subtitle="Any special delivery instructions?"
                  icon={<FileText className="h-5 w-5" />}
                />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Apartment number, gate code, preferred delivery time..."
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Payment Method */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <SectionHeader
                  title="Payment Method"
                  subtitle="How would you like to pay?"
                  icon={<CreditCard className="h-5 w-5" />}
                />
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`group flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                        paymentMethod === method.id
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="sr-only"
                      />
                      <div
                        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                          paymentMethod === method.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{method.desc}</p>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                          paymentMethod === method.id
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === method.id && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column — Order Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-28">
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Order Summary</h2>
                        <p className="text-xs text-gray-400">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-72 space-y-4 overflow-y-auto pr-1 mb-5">
                    {items.map((item) => (
                      <div key={item.variantId} className="flex items-center gap-3">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-gray-300">IMG</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{item.productName}</p>
                          {item.attributes && item.attributes.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {item.attributes.map((a) => a.attributeValue).join(", ")}
                            </p>
                          )}
                          <p className="text-xs text-gray-300 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                          Rs. {(item.priceAtAdd * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 border-t border-gray-100 pt-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="font-semibold text-gray-900">Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Shipping</span>
                      <span className="font-semibold text-emerald-600">Free</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-gray-900">Rs. {subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust badge */}
                  <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs font-medium text-emerald-700">
                      Your payment is secure and encrypted. We never store your card details.
                    </p>
                  </div>

                  {!isAuthenticated && (
                    <p className="mt-3 text-center text-xs text-gray-400">
                      You&apos;ll be asked to sign in when you place your order.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order — Rs. {subtotal.toLocaleString()}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {/* Trust icons */}
                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
                    {[
                      { icon: <ShieldCheck className="h-4 w-4" />, label: "Secured", sub: "Checkout" },
                      { icon: <RotateCcw className="h-4 w-4" />, label: "Easy", sub: "Returns" },
                      { icon: <Headphones className="h-4 w-4" />, label: "24/7", sub: "Support" },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 text-center">
                        <div className="text-gray-400">{item.icon}</div>
                        <p className="text-[11px] font-bold text-gray-700">{item.label}</p>
                        <p className="text-[10px] text-gray-400">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Bottom Trust Bar */}
        <div className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-gray-200 bg-white p-5">
          {[
            { icon: <Truck className="h-5 w-5" />, label: "Free Shipping", sub: "On all orders" },
            { icon: <RotateCcw className="h-5 w-5" />, label: "Easy Returns", sub: "Hassle free returns" },
            { icon: <ShieldCheck className="h-5 w-5" />, label: "100% Secure", sub: "Secure payments" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-3">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-400">Sign in to complete your order</p>
            </div>

            <form onSubmit={handleInlineLogin} className="space-y-4">
              {loginError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600 text-center font-medium">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-300 focus:bg-white focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-300 focus:bg-white focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoggingIn ? "Signing in..." : "Sign In & Place Order"}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm border-t border-gray-100 pt-4">
              <Link
                href={`/login?redirect=${encodeURIComponent("/checkout")}`}
                className="font-medium text-gray-400 hover:text-blue-600 transition-colors"
              >
                Full login page
              </Link>
              <Link href="/register" className="font-medium text-gray-400 hover:text-blue-600 transition-colors">
                Create account
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="mt-3 w-full text-center text-sm text-gray-300 hover:text-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <div className="flex-1">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
