"use client";

import { Check, Printer, X } from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";

interface POSReceiptProps {
  order: any;
  onNewSale: () => void;
  onClose: () => void;
}

export function POSReceipt({ order, onNewSale, onClose }: POSReceiptProps) {
  const { getAll } = useCrud({
    endpoint: API_ROUTES.COMPANY_PROFILE,
    queryKey: "company-profile",
  });

  const { data: companyData, isLoading: companyLoading } = getAll();
  const company = (Array.isArray(companyData) ? companyData[0] : companyData) || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="size-5 text-green-600" />
          </div>
          <h2 className="font-bold text-lg">Sale Complete</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 print:p-0">
        <div id="receipt" className="max-w-sm mx-auto bg-white p-6 print:p-8 print:max-w-full">
          <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-slate-300">
            <h1 className="text-2xl font-bold mb-1">
              {companyLoading ? "Loading..." : (company.companyName || "Your Company")}
            </h1>
            {company.address && (
              <p className="text-sm text-slate-600">{company.address}</p>
            )}
            {company.phoneNumber && (
              <p className="text-sm text-slate-600">{company.phoneNumber}</p>
            )}
            {company.email && (
              <p className="text-sm text-slate-600">{company.email}</p>
            )}
          </div>

          <div className="mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">Order ID:</span>
              <span className="font-mono font-bold">{order.order?.orderId || order.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date:</span>
              <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Customer:</span>
              <span>{order.order?.customerName || order.customerName}</span>
            </div>
            {(order.order?.customerPhone || order.customerPhone) && (
              <div className="flex justify-between">
                <span className="text-slate-600">Phone:</span>
                <span>{order.order?.customerPhone || order.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Payment:</span>
              <span className="uppercase font-medium">
                {order.order?.paymentMethod || order.paymentMethod}
              </span>
            </div>
          </div>

          <div className="mb-4 pb-4 border-b-2 border-dashed border-slate-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.order?.items || order.items || []).map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-2">
                      <div className="font-medium">{item.productName}</div>
                      {item.variantName && (
                        <div className="text-xs text-slate-500">{item.variantName}</div>
                      )}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                    <td className="text-right font-medium">
                      Rs. {item.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span>Rs. {(order.order?.subtotal || order.subtotal).toLocaleString()}</span>
            </div>
            {(order.order?.discountAmount || order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>- Rs. {(order.order?.discountAmount || order.discountAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Delivery:</span>
              <span>Rs. {(order.order?.deliveryCharge || order.deliveryCharge || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-slate-300">
              <span>Total:</span>
              <span>Rs. {(order.order?.totalAmount || order.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center text-sm text-slate-600 border-t-2 border-dashed border-slate-300 pt-4">
            <p>Thank you for your purchase!</p>
            <p className="mt-2">Powered by POS System</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4 space-y-2 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Printer className="size-5" />
          Print Receipt
        </button>
        <button
          onClick={onNewSale}
          className="w-full bg-primarymain text-white py-3 rounded-lg font-bold hover:bg-primarymain/90 transition-colors"
        >
          New Sale
        </button>
      </div>
    </div>
  );
}
