import Link from "next/link";
import { getNewArrivals } from "@/actions/homepage-actions";
import { getActiveFlashSaleProducts } from "@/actions/flash-sale-action";
import ProductCard from "@/components/product-card";

export default async function NewArrivals() {
  const [products, flashSaleProducts] = await Promise.all([
    getNewArrivals(20),
    getActiveFlashSaleProducts(),
  ]);

  if (products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end  mb-8 sm:mb-10">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">
              Just In
            </p>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 uppercase">
              New Arrivals
            </h2>
          </div>
        
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map((product, index) => {
            const productVariantIds = product.variants?.map((v) => v.id) || [];
            const flashSale = flashSaleProducts.find((fp) =>
              productVariantIds.includes(fp.variantId)
            ) || null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                flashSalePrice={flashSale?.salePrice}
                flashSaleOriginalPrice={flashSale?.originalPrice}
                flashSaleName={flashSale?.flashSaleName}
              />
            );
          })}
        </div>

        {products.length >= 20 && (
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-block bg-primarymain text-white px-8 py-3 text-sm font-bold tracking-wide hover:bg-primarymain/90 transition-colors"
            >
              VIEW ALL PRODUCTS
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
