"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, User, Mail, Phone, Loader2, Banknote, Wallet, CreditCard, Tag, X, Search } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { usePOSModeStore } from "@/stores/pos-mode-store";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import { useForm } from "@/hooks/useForm";
import { showSuccess, showError } from "@/lib/toast-helper";
import { POSReceipt } from "./pos-receipt";
import type { PaymentMethod } from "@/types/order";
import { cn } from "@/lib/utils";

interface POSCheckoutProps {
  onBack: () => void;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: any }[] = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "cod", label: "Card on Delivery", icon: CreditCard },
  { id: "khalti", label: "Khalti", icon: Wallet },
];

export function POSCheckout({ onBack }: POSCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const items = useCartStore((s) => s.items);
  const rawSubtotal = useCartStore((s) => s.subtotal());
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const clearCart = useCartStore((s) => s.clearCart);
  
  const subtotal = appliedCoupon ? Math.max(0, rawSubtotal - appliedCoupon.discountAmount) : rawSubtotal;
  
  const customerInfo = usePOSModeStore((s) => s.customerInfo);
  const setCustomerInfo = usePOSModeStore((s) => s.setCustomerInfo);

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [cashGiven, setCashGiven] = useState("");

  const { create } = useCrud<any>({
    endpoint: API_ROUTES.ORDERS + "/checkout",
    queryKey: "orders",
  });

  const { values: form, setField, handleChange } = useForm({
    customerName: customerInfo.customerName,
    customerEmail: customerInfo.customerEmail,
    customerPhone: customerInfo.customerPhone,
    paymentMethod: customerInfo.paymentMethod,
    notes: customerInfo.notes,
  });

  useEffect(() => {
    setCustomerInfo(form);
  }, [form.customerName, form.customerEmail, form.customerPhone, form.paymentMethod, form.notes]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const response = await fetch(API_ROUTES.DISCOUNT_VALIDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: rawSubtotal,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            priceAtAdd: i.priceAtAdd,
            productId: i.productId,
            categoryId: i.categoryId || "",
            brandId: i.brandId || "",
          })),
        }),
      });
      const result = await response.json();
      if (result?.data?.valid) {
        setCoupon({
          code: result.data.code,
          discountAmount: result.data.discountAmount,
          type: result.data.type,
          description: result.data.description,
        });
        setCouponError("");
        showSuccess(result.data.message);
      } else {
        setCouponError(result?.data?.message || "Invalid coupon code");
      }
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
    setCouponError("");
  };

  const handleSearchCustomer = async () => {
    if (!searchPhone.trim()) {
      showError("Please enter a phone number");
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(`${API_ROUTES.USER}/search?phone=${encodeURIComponent(searchPhone)}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result?.data) {
        setField("customerName", result.data.name || "");
        setField("customerEmail", result.data.email || "");
        setField("customerPhone", result.data.phone || searchPhone);
        showSuccess("Customer found!");
      } else {
        showError("Customer not found. Please enter details manually.");
      }
    } catch {
      showError("Failed to search customer.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.customerName || !form.customerEmail) {
      showError("Customer name and email are required");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
        })),
        paymentMethod: form.paymentMethod,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone || undefined,
        shippingAddress: "In-store pickup",
        billingAddress: "In-store pickup",
        notes: form.notes || undefined,
        deliveryCharge: 0,
        source: "pos",
        couponCode: appliedCoupon?.code || undefined,
      };

      const response: any = await create.mutateAsync(payload);
      
      if (response?.data) {
        setCompletedOrder(response.data);
        setShowReceipt(true);
        showSuccess("Order completed successfully!");
      }
    } catch (error: any) {
      showError(error?.message || "Failed to complete order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    clearCart();
    setCompletedOrder(null);
    setShowReceipt(false);
    removeCoupon();
    setCouponCode("");
    setCouponError("");
    setSearchPhone("");
    setCashGiven("");
    setCustomerInfo({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      paymentMethod: "cash",
      notes: "",
    });
    onBack();
  };

  if (showReceipt && completedOrder) {
    return (
      <POSReceipt
        order={completedOrder}
        onNewSale={handleNewSale}
        onClose={() => setShowReceipt(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="font-bold text-lg">Checkout</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-slate-700">Customer Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search by Phone
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchCustomer()}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter phone number"
                />
              </div>
              <button
                type="button"
                onClick={handleSearchCustomer}
                disabled={searchLoading || !searchPhone.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {searchLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Search
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Search for existing customer or fill manually below</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Customer name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="customer@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="tel"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+977 9800000000"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-slate-700">Payment Method</h3>
          <div className="grid grid-cols-1 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setField("paymentMethod", method.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 border-2 rounded-lg transition-all",
                    form.paymentMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="font-medium">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {form.paymentMethod === "cash" && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              <Banknote className="size-4 text-green-600" />
              Cash Payment Calculator
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount Given by Customer
              </label>
              <input
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder="Enter amount..."
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>
            
            {cashGiven && parseFloat(cashGiven) >= subtotal && (
              <div className="bg-white rounded-lg p-4 space-y-2 border border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Amount:</span>
                  <span className="font-bold text-slate-900">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Cash Given:</span>
                  <span className="font-bold text-slate-900">Rs. {parseFloat(cashGiven).toLocaleString()}</span>
                </div>
                <div className="h-px bg-green-200 my-2"></div>
                <div className="flex justify-between items-center bg-green-100 -m-4 p-4 rounded-b-lg">
                  <span className="font-bold text-green-800">Change to Return:</span>
                  <span className="font-bold text-2xl text-green-600">
                    Rs. {(parseFloat(cashGiven) - subtotal).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            {cashGiven && parseFloat(cashGiven) < subtotal && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">
                  Insufficient amount. Need Rs. {(subtotal - parseFloat(cashGiven)).toLocaleString()} more.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-slate-700">Apply Coupon</h3>
          <div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">{appliedCoupon.code}</p>
                    <p className="text-xs text-green-600">Saved Rs. {appliedCoupon.discountAmount.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <X className="size-4 text-green-700" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {couponLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Tag className="size-4" />
                    )}
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500">{couponError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm text-slate-700 mb-2">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span>Items ({items.length})</span>
            <span className="font-medium">Rs. {rawSubtotal.toLocaleString()}</span>
          </div>
          {appliedCoupon && appliedCoupon.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({appliedCoupon.code})</span>
              <span className="font-medium">- Rs. {appliedCoupon.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">Rs. {subtotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !form.customerName || !form.customerEmail}
          className="w-full bg-primarymain text-white py-3 rounded-lg font-bold text-lg hover:bg-primarymain/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Processing...
            </>
          ) : (
            `Complete Sale - Rs. ${subtotal.toLocaleString()}`
          )}
        </button>
      </div>
    </div>
  );
}
