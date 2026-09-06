import { Metadata } from "next";
import { getActiveFlashSales, getActiveFlashSaleProducts } from "@/actions/flash-sale-action";
import FlashSalePageClient from "./flash-sale-page-client";

export const metadata: Metadata = {
  title: "Flash Sale | Limited Time Deals",
  description: "Don't miss out on our flash sale! Get amazing discounts on selected products for a limited time only.",
};

export default async function FlashSalePage() {
  const [sales, products] = await Promise.all([
    getActiveFlashSales(),
    getActiveFlashSaleProducts(),
  ]);

  const activeSale = sales[0] || null;

  return (
    <FlashSalePageClient
      sale={activeSale}
      products={products}
    />
  );
}
