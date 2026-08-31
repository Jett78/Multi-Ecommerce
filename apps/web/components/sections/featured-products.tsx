import { getFeaturedProducts } from "@/actions/homepage-actions";
import ProductSlider from "@/components/product-slider";

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <ProductSlider
      products={products}
      title="Featured Products"
      subtitle="Our Picks"
    />
  );
}
