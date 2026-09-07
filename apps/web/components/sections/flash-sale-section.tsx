import { getActiveFlashSales, getActiveFlashSaleProducts } from "@/actions/flash-sale-action";
import FlashSaleSectionClient from "@/components/sections/flash-sale-section-client";

export default async function FlashSaleSection() {
  const [sales, saleProducts] = await Promise.all([
    getActiveFlashSales(),
    getActiveFlashSaleProducts(),
  ]);

  if (sales.length === 0) return null;

  return (
    <div className="space-y-6">
      {sales.map((sale) => {
        const filteredProducts = saleProducts.filter(p => p.flashSaleId === sale.id);
        if (filteredProducts.length === 0) return null;
        return (
          <FlashSaleSectionClient
            key={sale.id}
            sale={sale}
            products={filteredProducts}
          />
        );
      })}
    </div>
  );
}
