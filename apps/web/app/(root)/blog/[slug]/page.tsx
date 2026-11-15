import { notFound } from "next/navigation";
import { getBlogBySlug, getAllBlogSlugs } from "@/actions/blog-action";
import BackButton from "@/components/buttons/back-button";
import SocialShare from "@/components/buttons/social-share-button";
import type { Metadata } from "next";
import type { BlogPostPageProps } from "@/types/components";
import Image from "next/image";
import { Calendar, Clock } from "lucide-react";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function readTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return { title: "Blog Not Found" };
  }

  const metaTitle = blog.seoMeta?.metaTitle || blog.title;
  const metaDescription =
    blog.seoMeta?.metaDescription || blog.description || "";
  const ogImage = blog.seoMeta?.ogImageKey || blog.imageKey;

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: blog.seoMeta?.ogTitle || metaTitle,
      description: blog.seoMeta?.ogDescription || metaDescription,
      images: ogImage ? [{ url: ogImage }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: blog.seoMeta?.ogTitle || metaTitle,
      description: blog.seoMeta?.ogDescription || metaDescription,
      images: ogImage ? [ogImage] : [],
    },
    robots: blog.seoMeta?.metaRobots || "index, follow",
    alternates: blog.seoMeta?.canonicalUrl
      ? { canonical: blog.seoMeta.canonicalUrl }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const imageUrl = blog.imageKey || blog.seoMeta?.ogImageKey;

  return (
    <article className="min-h-screen bg-white">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-20  mb-6">
        <BackButton />

        <div className="mt-6 flex items-center gap-3 text-[11px] font-medium text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(blog.createdAt)}
          </span>
          <span className="h-0.5 w-0.5 rounded-full bg-gray-300" />
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {readTime(blog.description || "")}
          </span>
        </div>

        <h1 className="mt-4 text-xl font-bold  text-gray-900 sm:text-2xl lg:text-3xl">
          {blog.title}
        </h1>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <figure className="overflow-hidden border border-gray-200">
            <Image
              src={imageUrl}
              alt={blog.title}
              className="h-64 w-full object-cover sm:h-80 md:h-[28rem]"
              width={1200}
              height={600}
              priority
            />
          </figure>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div
          className="prose prose-lg prose-gray prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{
            __html: blog.description || "<p>No content available.</p>",
          }}
        />
      </div>

      {/* Footer */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
              Written by
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900">Admin</p>
          </div>
          <SocialShare slug={blog.slug} title={blog.title} />
        </div>
      </div>
    </article>
  );
}
