import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/actions/homepage-actions";
import { getImageUrl } from "@/lib/utils";

export default async function CategorySection() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <p className="tracking-wider text-foreground uppercase text-sm font-bold mb-1">
            Browse
          </p>
          <h2 className="font-syne font-extrabold text-2xl md:text-3xl tracking-wide uppercase">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?categoryId=${category.id}`}
              className="group relative aspect-square overflow-hidden bg-zinc-100 border-2 border-transparent hover:border-black transition-all duration-300"
            >
              {category.imageKey ? (
                <Image
                  src={getImageUrl(category.imageKey)}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full font-syne text-4xl font-bold text-zinc-200">
                  {category.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-syne font-bold text-lg text-white uppercase tracking-wide">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
