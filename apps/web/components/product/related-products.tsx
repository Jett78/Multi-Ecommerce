import type { Product } from "@/types/product";
import ProductSlider from "@/components/product-slider";

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <div className="mt-16 pt-16 border-t-4 border-black">
      <ProductSlider
        products={products}
        title="YOU MAY ALSO LIKE"
        subtitle="Similar Products"
      />
    </div>
  );
}
