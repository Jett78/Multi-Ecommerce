"use client";

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceData } from "@/types/invoice";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  topDate: {
    fontSize: 8,
    color: "#666666",
  },
  topLabel: {
    fontSize: 10,
    color: "#666666",
  },
  centerBlock: {
    alignItems: "center",
    marginBottom: 25,
  },
  orderTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    letterSpacing: 1,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  infoBlock: {
    marginBottom: 20,
    gap: 4,
  },
  infoRow: {
    flexDirection: "row",
    gap: 6,
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 9,
    color: "#000000",
    textTransform: "uppercase",
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#999999",
    borderBottomStyle: "dashed",
    marginVertical: 10,
  },
  solidLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 4,
  },
  tableCell: {
    fontSize: 9,
    color: "#000000",
  },
  variantText: {
    fontSize: 7,
    color: "#666666",
    marginTop: 2,
  },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: "center" },
  colRate: { width: 65, textAlign: "right" },
  colCost: { width: 65, textAlign: "right" },
  summaryBlock: {
    alignItems: "flex-end",
    marginTop: 10,
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 20,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#000000",
  },
  summaryValue: {
    fontSize: 9,
    color: "#000000",
    width: 65,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    gap: 20,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    width: 65,
    textAlign: "right",
  },
  amountWords: {
    fontSize: 8,
    color: "#333333",
    marginTop: 10,
    textTransform: "uppercase",
  },
  thankYou: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textAlign: "center",
    marginTop: 25,
    textTransform: "uppercase",
  },
  disclaimer: {
    fontSize: 7,
    color: "#666666",
    textAlign: "center",
    marginTop: 15,
    textTransform: "uppercase",
    lineHeight: 1.4,
  },
  receivedBy: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginTop: 20,
    textTransform: "uppercase",
  },
});

function formatCurrency(amount: number): string {
  return Number(amount).toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toUpperCase();
}

function getAmountInWords(amount: number): string {
  const np = amount / 100; // convert from paisa to rupees if needed
  // If amount is already in rupees (not paisa), use directly
  const rupees = amount >= 1000 ? amount : amount;

  if (rupees === 0) return "NIL";

  const ones: string[] = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
    "SEVENTEEN", "EIGHTEEN", "NINETEEN",
  ];
  const tens: string[] = [
    "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY",
  ];

  const convert = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n] || "";
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " AND " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " THOUSAND" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " LAKH" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " CRORE" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };

  const integerRupees = Math.floor(rupees);
  const words = convert(integerRupees);
  return `(${words} ONLY)`;
}

export default function ReceiptDocument({ order, company }: InvoiceData) {
  const items = order.items || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top row: Date left, Receipt label right */}
        <View style={styles.topRow}>
          <Text style={styles.topDate}>
            {formatDate(order.createdAt)} {formatTime(order.createdAt)}
          </Text>
          <Text style={styles.topLabel}>Receipt</Text>
        </View>

        {/* Center: Order number + Company name */}
        <View style={styles.centerBlock}>
          <Text style={styles.orderTitle}>ORDER #{order.orderId}</Text>
          <Text style={styles.companyName}>{company.companyName}</Text>
        </View>

        {/* Customer info */}
        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CUSTOMER: </Text>
            <Text style={styles.infoValue}>
              {order.customerName || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PAYMENT MODE: </Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === "cod"
                ? "COD"
                : order.paymentMethod?.toUpperCase() || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DATE &amp; TIME: </Text>
            <Text style={styles.infoValue}>
              {formatDate(order.createdAt)}, {formatTime(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Dashed line */}
        <View style={styles.dashedLine} />

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>DESCRIPTION</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>QTY</Text>
          <Text style={[styles.tableHeaderText, styles.colRate]}>RATE(RS)</Text>
          <Text style={[styles.tableHeaderText, styles.colCost]}>COST(RS)</Text>
        </View>

        {/* Table rows */}
        {items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.tableCell}>
                {item.productName.toUpperCase()}
              </Text>
              {item.variantName && (
                <Text style={styles.variantText}>
                  VARIANT: {item.variantName.toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.colRate]}>
              {formatCurrency(item.unitPrice)}
            </Text>
            <Text style={[styles.tableCell, styles.colCost]}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>
        ))}

        {/* Solid line */}
        <View style={styles.solidLine} />

        {/* Summary */}
        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SUB TOTAL</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(order.subtotal)}
            </Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                DISCOUNT
                {order.orderCoupons && order.orderCoupons.length > 0
                  ? ` (${order.orderCoupons[0]?.couponCode})`
                  : ""}
              </Text>
              <Text style={styles.summaryValue}>
                - {formatCurrency(order.discountAmount)}
              </Text>
            </View>
          )}
          {order.deliveryCharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>DELIVERY CHARGE</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(order.deliveryCharge)}
              </Text>
            </View>
          )}
          {order.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TAX</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(order.taxAmount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Amount in words */}
        <Text style={styles.amountWords}>
          {getAmountInWords(order.totalAmount)}
        </Text>

        {/* Thank you */}
        <Text style={styles.thankYou}>
          THANK YOU! PLEASE VISIT US AGAIN.
        </Text>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          THIS IS NOT A TAX INVOICE. PLEASE COLLECT ORIGINAL BILL{"\n"}
          FROM THE COUNTER.
        </Text>

        {/* Received by */}
        <Text style={styles.receivedBy}>
          RECEIVED BY: {company.companyName.toUpperCase()}
        </Text>
      </Page>
    </Document>
  );
}
