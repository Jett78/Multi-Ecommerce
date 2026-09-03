"use client";

import React from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { X, Download, Printer, Loader2 } from "lucide-react";
import InvoiceDocument from "./invoice-document";
import ReceiptDocument from "./receipt-document";
import type { InvoiceData } from "@/types/invoice";

export type DocumentType = "invoice" | "receipt";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData;
  documentType: DocumentType;
}

function getDocumentComponent(
  documentType: DocumentType,
  data: InvoiceData
) {
  if (documentType === "receipt") {
    return <ReceiptDocument order={data.order} company={data.company} />;
  }
  return <InvoiceDocument order={data.order} company={data.company} />;
}

function getFileName(documentType: DocumentType, orderId: string) {
  return `${documentType}-${orderId}.pdf`;
}

export default function PreviewModal({
  isOpen,
  onClose,
  data,
  documentType,
}: PreviewModalProps) {
  if (!isOpen) return null;

  const title = documentType === "receipt" ? "Receipt Preview" : "Invoice Preview";
  const accentColor =
    documentType === "receipt"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-indigo-600 hover:bg-indigo-700";

  const handlePrint = () => {
    // PDFViewer renders in an iframe, we can access it for printing
    const iframe = document.querySelector(
      "[data-testid='pdf-viewer'] iframe, iframe[src*='blob:']"
    ) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[90vh] w-[90vw] max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              {data.order.orderId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PDFDownloadLink
              document={getDocumentComponent(documentType, data)}
              fileName={getFileName(documentType, data.order.orderId)}
            >
              {({ loading }) =>
                loading ? (
                  <button
                    disabled
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white opacity-70 cursor-not-allowed ${accentColor}`}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing...
                  </button>
                ) : (
                  <button
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${accentColor}`}
                  >
                    <Download className="h-4 w-4" />
                    Download {documentType === "receipt" ? "Receipt" : "PDF"}
                  </button>
                )
              }
            </PDFDownloadLink>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            width="100%"
            height="100%"
            showToolbar={false}
            style={{ border: "none" }}
          >
            {getDocumentComponent(documentType, data)}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
