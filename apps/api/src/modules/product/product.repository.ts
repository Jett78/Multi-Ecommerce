import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, ilike, or, and, sql, desc, gte, lte } from 'drizzle-orm';

@Injectable()
export class ProductRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createProduct(data: typeof schema.products.$inferInsert) {
    const [product] = await this.db.insert(schema.products).values(data).returning();
    return product;
  }

  async createSeoMeta(data: typeof schema.seoMetas.$inferInsert) {
    const [seoMeta] = await this.db.insert(schema.seoMetas).values(data).returning();
    return seoMeta;
  }

  async findProductById(id: string) {
    const [result] = await this.db
      .select()
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.subcategories, eq(schema.products.subcategoryId, schema.subcategories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .leftJoin(schema.seoMetas, eq(schema.products.id, schema.seoMetas.productId))
      .where(eq(schema.products.id, id));

    if (!result) return null;

    const variants = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, id))
      .orderBy(schema.productVariants.sortOrder);

    // Fetch attributes for each variant
    const variantsWithAttributes = await Promise.all(
      variants.map(async (variant) => {
        const attributes = await this.db
          .select()
          .from(schema.variantAttributes)
          .where(eq(schema.variantAttributes.variantId, variant.id))
          .orderBy(schema.variantAttributes.sortOrder);
        return { ...variant, attributes };
      })
    );

    const images = await this.db
      .select()
      .from(schema.productImages)
      .where(eq(schema.productImages.productId, id))
      .orderBy(schema.productImages.sortOrder);

    return {
      ...result.products,
      category: result.categories,
      subcategory: result.subcategories,
      brand: result.brands,
      seoMeta: result.seo_metas,
      variants: variantsWithAttributes,
      images,
    };
  }

  async findProductBySlug(slug: string) {
    const [result] = await this.db
      .select()
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.subcategories, eq(schema.products.subcategoryId, schema.subcategories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .leftJoin(schema.seoMetas, eq(schema.products.id, schema.seoMetas.productId))
      .where(eq(schema.products.slug, slug));

    if (!result) return null;

    const variants = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, result.products.id))
      .orderBy(schema.productVariants.sortOrder);

    const images = await this.db
      .select()
      .from(schema.productImages)
      .where(eq(schema.productImages.productId, result.products.id))
      .orderBy(schema.productImages.sortOrder);

    return {
      ...result.products,
      category: result.categories,
      subcategory: result.subcategories,
      brand: result.brands,
      seoMeta: result.seo_metas,
      variants,
      images,
    };
  }

  async findAllProducts(params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.products.name, `%${params.search}%`),
          ilike(schema.products.description, `%${params.search}%`),
          ilike(schema.products.sku, `%${params.search}%`),
        ),
      );
    }

    if (params?.status) {
      conditions.push(eq(schema.products.status, params.status as any));
    }

    if (params?.categoryId) {
      conditions.push(eq(schema.products.categoryId, params.categoryId));
    }

    if (params?.subcategoryId) {
      conditions.push(eq(schema.products.subcategoryId, params.subcategoryId));
    }

    if (params?.brandId) {
      conditions.push(eq(schema.products.brandId, params.brandId));
    }

    if (params?.isFeatured !== undefined) {
      conditions.push(eq(schema.products.isFeatured, params.isFeatured));
    }

    if (params?.minPrice !== undefined) {
      conditions.push(gte(sql`(SELECT MIN(price) FROM product_variants WHERE product_variants.product_id = ${schema.products.id})`, params.minPrice));
    }

    if (params?.maxPrice !== undefined) {
      conditions.push(lte(sql`(SELECT MIN(price) FROM product_variants WHERE product_variants.product_id = ${schema.products.id})`, params.maxPrice));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const products = await this.db
      .select()
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.subcategories, eq(schema.products.subcategoryId, schema.subcategories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .where(whereClause)
      .orderBy(desc(schema.products.sortOrder), desc(schema.products.createdAt))
      .limit(params?.take || 10)
      .offset(params?.skip || 0);

    return products.map((row) => ({
      ...row.products,
      category: row.categories,
      subcategory: row.subcategories,
      brand: row.brands,
    }));
  }

  async countProducts(params?: {
    search?: string;
    status?: string;
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
    isFeatured?: boolean;
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.products.name, `%${params.search}%`),
          ilike(schema.products.description, `%${params.search}%`),
          ilike(schema.products.sku, `%${params.search}%`),
        ),
      );
    }

    if (params?.status) {
      conditions.push(eq(schema.products.status, params.status as any));
    }

    if (params?.categoryId) {
      conditions.push(eq(schema.products.categoryId, params.categoryId));
    }

    if (params?.subcategoryId) {
      conditions.push(eq(schema.products.subcategoryId, params.subcategoryId));
    }

    if (params?.brandId) {
      conditions.push(eq(schema.products.brandId, params.brandId));
    }

    if (params?.isFeatured !== undefined) {
      conditions.push(eq(schema.products.isFeatured, params.isFeatured));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.products)
      .where(whereClause);

    return Number(result.count);
  }

  async updateProduct(id: string, data: Partial<typeof schema.products.$inferInsert>) {
    const [product] = await this.db
      .update(schema.products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.products.id, id))
      .returning();

    return product;
  }

  async findAllVariants() {
    return this.db
      .select()
      .from(schema.productVariants)
      .orderBy(schema.productVariants.productId, schema.productVariants.sortOrder);
  }

  async createProductImages(productId: string, imageKeys: string[]) {
    if (!imageKeys.length) return [];
    const rows = imageKeys.map((imageKey, index) => ({
      productId,
      imageKey,
      sortOrder: index,
      isPrimary: index === 0,
    }));
    return this.db.insert(schema.productImages).values(rows).returning();
  }

  async deleteProductImages(productId: string) {
    return this.db
      .delete(schema.productImages)
      .where(eq(schema.productImages.productId, productId))
      .returning();
  }

  async updateSeoMeta(productId: string, data: Partial<typeof schema.seoMetas.$inferInsert>) {
    const [seoMeta] = await this.db
      .update(schema.seoMetas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.seoMetas.productId, productId))
      .returning();

    return seoMeta;
  }

  async deleteProduct(id: string) {
    const [product] = await this.db
      .delete(schema.products)
      .where(eq(schema.products.id, id))
      .returning();

    return product;
  }

  async softDeleteProduct(id: string) {
    const [product] = await this.db
      .update(schema.products)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(schema.products.id, id))
      .returning();

    return product;
  }
}
