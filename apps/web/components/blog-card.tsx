import { Blog } from "@/types/blog";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getImageSrc(path: string): string {
  if (path.startsWith("/") || path.startsWith("http")) return path;
  return `/${path}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function FeaturedCard({ blog }: { blog: Blog }) {
  const imageUrl = getImageSrc(blog.imageKey || "/images/blog-placeholder.png");

  return (
    <Link href={`/blog/${blog.slug}`} className="group block">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center border border-gray-200 bg-white overflow-hidden transition-all hover:border-gray-900">
        <div className="relative overflow-hidden">
          <Image
            src={imageUrl}
            alt={blog.title}
            width={800}
            height={500}
            className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72 lg:h-full"
          />
        </div>

        <div className="p-6 sm:p-8 lg:py-8 lg:px-8">
          <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
            <time dateTime={new Date(blog.createdAt).toISOString()}>
              {formatDate(blog.createdAt)}
            </time>
            <span className="h-0.5 w-0.5 rounded-full bg-gray-300" />
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 uppercase tracking-wide font-bold">
              Featured
            </span>
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl group-hover:text-gray-600 transition-colors">
            {blog.title}
          </h2>

          {blog.description && (
            <p className="mt-3 text-sm leading-relaxed text-gray-500 line-clamp-3">
              {stripHtml(blog.description)}
            </p>
          )}

          <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
            Read article
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function DefaultCard({ blog }: { blog: Blog }) {
  const imageUrl = getImageSrc(blog.imageKey || "/images/blog-placeholder.png");

  return (
    <Link href={`/blog/${blog.slug}`} className="group block">
      <div className="relative flex flex-col overflow-hidden border border-gray-200 bg-white transition-all hover:border-gray-900">
        <div className="relative overflow-hidden">
          <Image
            src={imageUrl}
            alt={blog.title}
            width={600}
            height={400}
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <time
            dateTime={new Date(blog.createdAt).toISOString()}
            className="text-[11px] font-medium text-gray-400"
          >
            {formatDate(blog.createdAt)}
          </time>

          <h3 className="mt-2 text-base font-bold leading-snug text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
            {blog.title}
          </h3>

          {blog.description && (
            <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">
              {stripHtml(blog.description)}
            </p>
          )}

          <div className="mt-auto pt-4">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
              Read more
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const BlogCard = ({
  blog,
  featured = false,
}: {
  blog: Blog;
  featured?: boolean;
}) => {
  if (featured) {
    return <FeaturedCard blog={blog} />;
  }
  return <DefaultCard blog={blog} />;
};

export { BlogCard };
export default BlogCard;
