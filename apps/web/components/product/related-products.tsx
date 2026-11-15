import type { Product } from "@/types/product";
import ProductSlider from "@/components/product-slider";

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <div className="mt-14  border-t border-gray-200">
      <ProductSlider
        products={products}
        title="You May Also Like"
        subtitle="Similar Products"
      />
    </div>
  );
}
