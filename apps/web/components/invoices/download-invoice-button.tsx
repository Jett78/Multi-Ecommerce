"use client";

import React, { useState } from "react";
import { FileText, Receipt, Loader2 } from "lucide-react";
import PreviewModal, { type DocumentType } from "./invoice-preview-modal";
import { getCompanyProfile } from "@/actions/company-profile-action";
import type { Order, OrderItem } from "@/types/order";
import type { InvoiceCompanyProfile } from "@/types/invoice";

interface DownloadInvoiceButtonProps {
  order: Order & { items: OrderItem[] };
}

export default function DownloadInvoiceButton({
  order,
}: DownloadInvoiceButtonProps) {
  const [company, setCompany] = useState<InvoiceCompanyProfile | null>(null);
  const [loadingType, setLoadingType] = useState<DocumentType | null>(null);
  const [activeDocument, setActiveDocument] = useState<DocumentType | null>(
    null
  );

  const fetchCompanyIfNeeded = async (): Promise<InvoiceCompanyProfile> => {
    if (company) return company;
    try {
      const profile = await getCompanyProfile();
      if (profile) {
        const data: InvoiceCompanyProfile = {
          companyName: profile.companyName,
          address: profile.address,
          phoneNumber: profile.phoneNumber,
          email: profile.email,
          logoKey: profile.logoKey,
        };
        setCompany(data);
        return data;
      }
    } catch {
      // fallback
    }
    return { companyName: "Store" };
  };

  const handleOpen = async (type: DocumentType) => {
    setLoadingType(type);
    try {
      await fetchCompanyIfNeeded();
      setActiveDocument(type);
    } finally {
      setLoadingType(null);
    }
  };

  const handleClose = () => setActiveDocument(null);

  const resolvedCompany: InvoiceCompanyProfile = company || {
    companyName: "Store",
  };

  return (
    <>
      <button
        onClick={() => handleOpen("invoice")}
        disabled={loadingType !== null}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingType ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparing...
          </>
        ) : (
          <>
            <FileText className="h-3.5 w-3.5" />
            View Invoice
          </>
        )}
      </button>
      <button
        onClick={() => handleOpen("receipt")}
        disabled={loadingType !== null}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingType ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparing...
          </>
        ) : (
          <>
            <Receipt className="h-3.5 w-3.5" />
            View Receipt
          </>
        )}
      </button>

      {activeDocument && (
        <PreviewModal
          isOpen={!!activeDocument}
          onClose={handleClose}
          data={{ order, company: resolvedCompany }}
          documentType={activeDocument}
        />
      )}
    </>
  );
}
