import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "@/components/product-detail-client";
import { getProductBySlug, getAllActiveProductSlugs, getRelatedProducts } from "@/actions/product-action";
import { getActiveFlashSaleProducts } from "@/actions/flash-sale-action";

export async function generateStaticParams() {
  const slugs = await getAllActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description?.replace(/<[^>]*>/g, "").slice(0, 100),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [relatedProducts, flashSaleProducts] = await Promise.all([
    getRelatedProducts(product.id, 8),
    getActiveFlashSaleProducts(),
  ]);

  const productVariantIds = product.variants?.map((v) => v.id) || [];
  const flashSale = flashSaleProducts.find((fp) =>
    productVariantIds.includes(fp.variantId)
  ) || null;

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      flashSale={flashSale}
    />
  );
}
