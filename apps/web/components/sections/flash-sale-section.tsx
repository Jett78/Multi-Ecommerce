import { getActiveFlashSales, getActiveFlashSaleProducts } from "@/actions/flash-sale-action";
import FlashSaleSectionClient from "@/components/sections/flash-sale-section-client";

export default async function FlashSaleSection() {
  const [sales, saleProducts] = await Promise.all([
    getActiveFlashSales(),
    getActiveFlashSaleProducts(),
  ]);

  const activeSale = sales[0];

  if (!activeSale || saleProducts.length === 0) return null;

  return (
    <FlashSaleSectionClient
      sale={activeSale}
      products={saleProducts}
    />
  );
}
