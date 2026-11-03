"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentMethod } from "@/types/order";

interface POSTransaction {
  id: string;
  items: any[];
  total: number;
  customerName?: string;
  customerPhone?: string;
  timestamp: number;
}

interface CustomerInfo {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

interface POSModeStore {
  isPOSMode: boolean;
  parkedTransactions: POSTransaction[];
  customerInfo: CustomerInfo;
  
  togglePOSMode: () => void;
  setPOSMode: (enabled: boolean) => void;
  
  parkTransaction: (transaction: POSTransaction) => void;
  recallTransaction: (id: string) => POSTransaction | undefined;
  removeParkedTransaction: (id: string) => void;
  clearParkedTransactions: () => void;
  
  setCustomerInfo: (info: Partial<CustomerInfo>) => void;
  clearCustomerInfo: () => void;
}

export const usePOSModeStore = create<POSModeStore>()(
  persist(
    (set, get) => ({
      isPOSMode: false,
      parkedTransactions: [],
      customerInfo: {
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        paymentMethod: "cash" as PaymentMethod,
        notes: "",
      },

      togglePOSMode: () => set((state) => ({ isPOSMode: !state.isPOSMode })),
      
      setPOSMode: (enabled) => set({ isPOSMode: enabled }),

      parkTransaction: (transaction) =>
        set((state) => ({
          parkedTransactions: [...state.parkedTransactions, transaction],
        })),

      recallTransaction: (id) => {
        const transaction = get().parkedTransactions.find((t) => t.id === id);
        if (transaction) {
          get().removeParkedTransaction(id);
        }
        return transaction;
      },

      removeParkedTransaction: (id) =>
        set((state) => ({
          parkedTransactions: state.parkedTransactions.filter((t) => t.id !== id),
        })),

      clearParkedTransactions: () => set({ parkedTransactions: [] }),

      setCustomerInfo: (info) =>
        set((state) => ({
          customerInfo: { ...state.customerInfo, ...info },
        })),

      clearCustomerInfo: () =>
        set({
          customerInfo: {
            customerName: "",
            customerEmail: "",
            customerPhone: "",
            paymentMethod: "cash" as PaymentMethod,
            notes: "",
          },
        }),
    }),
    {
      name: "pos-mode-store",
    }
  )
);
