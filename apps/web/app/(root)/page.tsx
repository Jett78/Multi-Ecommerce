import { Hero } from "@/components/sections/hero";
import { Testimonials } from "@/components/sections/testimonials";
import { FaqSection } from "@/components/sections/faq-section";
import BlogSection from "@/components/sections/blog-section";
import { MidBanner } from "@/components/sections/mid-banner";
import { getBlogs } from "@/actions/blog-action";
import CategorySection from "@/components/sections/category-section";
import FeaturedProducts from "@/components/sections/featured-products";
import BestSellers from "@/components/sections/best-seller-products";
import NewArrivals from "@/components/sections/new-arrivals";
import YouMayAlsoLike from "@/components/sections/you-may-also-like";

export default async function Home() {
  const posts = await getBlogs({ take: 3, isActive: true });

  return (
    <>
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <MidBanner />
      <BestSellers />
      <NewArrivals />
      <YouMayAlsoLike />
      <BlogSection posts={posts} />
      <Testimonials />
      <FaqSection />
    </>
  );
}
