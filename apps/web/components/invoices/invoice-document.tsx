"use client";

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceData } from "@/types/invoice";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  companyDetails: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },
  invoiceTitleSection: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    textTransform: "uppercase",
  },
  orderId: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 20,
  },
  infoBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRow_ALT: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  colNum: { width: 30 },
  colItem: { flex: 1 },
  colQty: { width: 50, textAlign: "center" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  itemName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  itemVariant: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 2,
  },
  itemSku: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 2,
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  summaryBox: {
    width: 250,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 10,
    color: "#374151",
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  summaryTotalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
  },
  paymentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
  },
  paymentBox: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 10,
    color: "#374151",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  statusCompleted: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusFailed: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    alignItems: "center",
  },
  thankYouText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 6,
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 1.5,
  },
});

function formatCurrency(amount: number): string {
  return `Rs. ${Number(amount).toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case "completed":
      return styles.statusCompleted;
    case "pending":
      return styles.statusPending;
    default:
      return styles.statusFailed;
  }
}

export default function InvoiceDocument({ order, company }: InvoiceData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {company.logoKey && (
              <Image src={company.logoKey} style={styles.logo} />
            )}
            <View>
              <Text style={styles.companyName}>{company.companyName}</Text>
              {company.address && (
                <Text style={styles.companyDetails}>{company.address}</Text>
              )}
              {company.phoneNumber && (
                <Text style={styles.companyDetails}>{company.phoneNumber}</Text>
              )}
              {company.email && (
                <Text style={styles.companyDetails}>{company.email}</Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.orderId}>{order.orderId}</Text>
          </View>
        </View>

        {/* Order & Customer Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Order Details</Text>
            <Text style={styles.infoValue}>
              Date: {formatDate(order.createdAt)}
            </Text>
            <Text style={styles.infoValue}>
              Payment: {order.paymentMethod?.toUpperCase() || "N/A"}
            </Text>
            {order.transactionId && (
              <Text style={styles.infoValue}>
                Transaction: {order.transactionId}
              </Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoValue}>
              {order.customerName || "N/A"}
            </Text>
            {order.customerEmail && (
              <Text style={styles.infoValue}>{order.customerEmail}</Text>
            )}
            {order.customerPhone && (
              <Text style={styles.infoValue}>{order.customerPhone}</Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Ship To</Text>
            <Text style={styles.infoValue}>
              {order.shippingAddress || "N/A"}
            </Text>
            {order.landmark && (
              <Text style={styles.infoValue}>Landmark: {order.landmark}</Text>
            )}
          </View>
        </View>

        {/* Items Table Header */}
        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colNum]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>

        {/* Items Table Rows */}
        {order.items?.map((item, index) => (
          <View
            key={item.id}
            style={index % 2 === 0 ? styles.tableRow : styles.tableRow_ALT}
          >
            <Text style={[styles.colNum, { color: "#9ca3af" }]}>
              {index + 1}
            </Text>
            <View style={styles.colItem}>
              <Text style={styles.itemName}>{item.productName}</Text>
              {item.variantName && (
                <Text style={styles.itemVariant}>{item.variantName}</Text>
              )}
              {item.sku && <Text style={styles.itemSku}>SKU: {item.sku}</Text>}
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(item.totalAmount)}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(order.subtotal)}
              </Text>
            </View>
            {order.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Discount
                  {order.orderCoupons && order.orderCoupons.length > 0
                    ? ` (${order.orderCoupons[0]?.couponCode})`
                    : ""}
                </Text>
                <Text style={[styles.summaryValue, { color: "#16a34a" }]}>
                  - {formatCurrency(order.discountAmount)}
                </Text>
              </View>
            )}
            {order.deliveryCharge > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charge</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(order.deliveryCharge)}
                </Text>
              </View>
            )}
            {order.taxAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(order.taxAmount)}
                </Text>
              </View>
            )}
            {order.deliveryCharge === 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>Free</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                {formatCurrency(order.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>
              {order.paymentMethod === "cod"
                ? "Cash on Delivery"
                : order.paymentMethod?.toUpperCase() || "N/A"}
            </Text>
          </View>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <Text
              style={[
                styles.statusBadge,
                getStatusStyle(order.paymentStatus),
              ]}
            >
              {order.paymentStatus?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Order Status</Text>
            <Text
              style={[
                styles.statusBadge,
                getStatusStyle(
                  order.status === "delivered" ? "completed" : order.status
                ),
              ]}
            >
              {order.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYouText}>Thank you for your purchase!</Text>
          <Text style={styles.footerText}>
            If you have any questions about this invoice, please contact us at{" "}
            {company.email || company.phoneNumber || "support"}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
