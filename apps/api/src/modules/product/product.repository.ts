import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, ilike, or, and, sql, desc, asc, gte, lte, gt, inArray, not, exists } from 'drizzle-orm';

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

    const variantIds = variants.map(v => v.id);

    const allAttributes = variantIds.length > 0
      ? await this.db
          .select()
          .from(schema.variantAttributes)
          .where(inArray(schema.variantAttributes.variantId, variantIds))
          .orderBy(schema.variantAttributes.sortOrder)
      : [];

    const attributesByVariant = new Map<string, typeof allAttributes>();
    for (const attr of allAttributes) {
      const list = attributesByVariant.get(attr.variantId) || [];
      list.push(attr);
      attributesByVariant.set(attr.variantId, list);
    }

    const variantsWithAttributes = variants.map((variant) => ({
      ...variant,
      attributes: attributesByVariant.get(variant.id) || [],
    }));

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

  async findProductBySku(sku: string) {
    const [result] = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.sku, sku));
    return result || null;
  }

  async findProductByBarcode(barcode: string) {
    const [byProduct] = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.barcode, barcode))
      .limit(1);

    if (byProduct) {
      return this.findProductById(byProduct.id);
    }

    const [byVariant] = await this.db
      .select({ productId: schema.productVariants.productId })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.barcode, barcode))
      .limit(1);

    if (!byVariant) return null;

    return this.findProductById(byVariant.productId);
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

    const variantIds = variants.map(v => v.id);

    const allAttributes = variantIds.length > 0
      ? await this.db
          .select()
          .from(schema.variantAttributes)
          .where(inArray(schema.variantAttributes.variantId, variantIds))
          .orderBy(schema.variantAttributes.sortOrder)
      : [];

    const attributesByVariant = new Map<string, typeof allAttributes>();
    for (const attr of allAttributes) {
      const list = attributesByVariant.get(attr.variantId) || [];
      list.push(attr);
      attributesByVariant.set(attr.variantId, list);
    }

    const variantsWithAttributes = variants.map((variant) => ({
      ...variant,
      attributes: attributesByVariant.get(variant.id) || [],
    }));

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
      variants: variantsWithAttributes,
      images,
    };
  }

  private buildStockCondition(stockStatus?: 'in_stock' | 'out_of_stock') {
    if (!stockStatus) return undefined;

    const hasVariants = exists(
      this.db
        .select({ id: schema.productVariants.id })
        .from(schema.productVariants)
        .where(eq(schema.productVariants.productId, schema.products.id)),
    );

    const variantStockSum = sql<number>`COALESCE((SELECT SUM(product_variants.stock_quantity) FROM product_variants WHERE product_variants.product_id = ${schema.products.id}), 0)`;
    const productStock = sql<number>`COALESCE(${schema.products.stockQuantity}, 0)`;

    if (stockStatus === 'out_of_stock') {
      return or(
        and(hasVariants, eq(variantStockSum, 0)),
        and(not(hasVariants), eq(productStock, 0)),
      );
    }

    return or(
      and(hasVariants, gt(variantStockSum, 0)),
      and(not(hasVariants), gt(productStock, 0)),
    );
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
    minRating?: number;
    sortBy?: string;
    stockStatus?: 'in_stock' | 'out_of_stock';
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.products.name, `%${params.search}%`),
          ilike(schema.products.description, `%${params.search}%`),
          ilike(schema.products.sku, `%${params.search}%`),
          ilike(schema.products.barcode, `%${params.search}%`),
          exists(
            this.db
              .select({ id: schema.productVariants.id })
              .from(schema.productVariants)
              .where(
                and(
                  eq(schema.productVariants.productId, schema.products.id),
                  or(
                    ilike(schema.productVariants.sku, `%${params.search}%`),
                    ilike(schema.productVariants.barcode, `%${params.search}%`),
                  ),
                ),
              ),
          ),
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

    if (params?.minRating !== undefined) {
      conditions.push(gte(schema.products.averageRating, params.minRating));
    }

    const stockCondition = this.buildStockCondition(params?.stockStatus);
    if (stockCondition) {
      conditions.push(stockCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const getSortOrder = () => {
      switch (params?.sortBy) {
        case 'price_asc':
          return sql`(SELECT MIN(price) FROM product_variants WHERE product_variants.product_id = ${schema.products.id}) ASC`;
        case 'price_desc':
          return sql`(SELECT MIN(price) FROM product_variants WHERE product_variants.product_id = ${schema.products.id}) DESC`;
        case 'name_asc':
          return asc(schema.products.name);
        case 'name_desc':
          return desc(schema.products.name);
        case 'oldest':
          return asc(schema.products.createdAt);
        case 'popularity':
          return desc(schema.products.sortOrder);
        case 'stable':
          return [
            asc(schema.categories.name),
            asc(schema.products.name),
            sql`(SELECT string_agg(va.attribute_value, ' / ' ORDER BY va.sort_order)
                FROM product_variants pv
                INNER JOIN variant_attributes va ON va.variant_id = pv.id
                WHERE pv.id = (
                  SELECT pv2.id FROM product_variants pv2
                  WHERE pv2.product_id = ${schema.products.id}
                  ORDER BY pv2.sort_order, pv2.created_at, pv2.id
                  LIMIT 1
                ))`,
            asc(schema.products.id),
          ];
        case 'newest':
        default:
          return [desc(schema.products.sortOrder), desc(schema.products.createdAt)];
      }
    };

    const orderByClause = params?.search && !params?.sortBy
      ? [
          sql`CASE WHEN ${schema.products.name} ILIKE ${params.search + '%'} THEN 0 ELSE 1 END`,
          sql`CASE WHEN ${schema.products.name} ILIKE ${'%' + params.search + '%'} THEN 0 ELSE 1 END`,
          desc(schema.products.sortOrder),
          desc(schema.products.createdAt),
        ]
      : getSortOrder();

    const products = await this.db
      .select()
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.subcategories, eq(schema.products.subcategoryId, schema.subcategories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .where(whereClause)
      .orderBy(...(Array.isArray(orderByClause) ? orderByClause : [orderByClause]))
      .limit(params?.take || 10)
      .offset(params?.skip || 0);

    const productIds = products.map((row) => row.products.id).filter((id): id is string => id !== null);

    if (productIds.length === 0) {
      return [];
    }

    // Batch fetch variants, images, and SEO meta for all products
    const [allVariants, allImages, allSeoMetas] = await Promise.all([
      this.db
        .select()
        .from(schema.productVariants)
        .where(inArray(schema.productVariants.productId, productIds))
        .orderBy(schema.productVariants.sortOrder),
      this.db
        .select()
        .from(schema.productImages)
        .where(inArray(schema.productImages.productId, productIds))
        .orderBy(schema.productImages.sortOrder),
      this.db
        .select()
        .from(schema.seoMetas)
        .where(inArray(schema.seoMetas.productId, productIds)),
    ]);

    const variantIds = allVariants.map(v => v.id);

    const allAttributes = variantIds.length > 0
      ? await this.db
          .select()
          .from(schema.variantAttributes)
          .where(inArray(schema.variantAttributes.variantId, variantIds))
          .orderBy(schema.variantAttributes.sortOrder)
      : [];

    // Group by product ID
    const variantsByProduct = new Map<string, typeof allVariants>();
    const imagesByProduct = new Map<string, typeof allImages>();
    const seoMetaByProduct = new Map<string, typeof allSeoMetas>();
    const attributesByVariant = new Map<string, typeof allAttributes>();

    for (const variant of allVariants) {
      const list = variantsByProduct.get(variant.productId) || [];
      list.push(variant);
      variantsByProduct.set(variant.productId, list);
    }

    for (const image of allImages) {
      if (!image.productId) continue;
      const list = imagesByProduct.get(image.productId) || [];
      list.push(image);
      imagesByProduct.set(image.productId, list);
    }

    for (const seo of allSeoMetas) {
      if (!seo.productId) continue;
      seoMetaByProduct.set(seo.productId, [seo]);
    }

    for (const attr of allAttributes) {
      const list = attributesByVariant.get(attr.variantId) || [];
      list.push(attr);
      attributesByVariant.set(attr.variantId, list);
    }

    return products.map((row) => {
      const productId = row.products.id;
      const variants = (variantsByProduct.get(productId) || []).map((v) => ({
        ...v,
        attributes: attributesByVariant.get(v.id) || [],
      }));

      return {
        ...row.products,
        category: row.categories,
        subcategory: row.subcategories,
        brand: row.brands,
        seoMeta: seoMetaByProduct.get(productId)?.[0] || null,
        variants,
        images: imagesByProduct.get(productId) || [],
      };
    });
  }

  async countProducts(params?: {
    search?: string;
    status?: string;
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    stockStatus?: 'in_stock' | 'out_of_stock';
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.products.name, `%${params.search}%`),
          ilike(schema.products.description, `%${params.search}%`),
          ilike(schema.products.sku, `%${params.search}%`),
          ilike(schema.products.barcode, `%${params.search}%`),
          exists(
            this.db
              .select({ id: schema.productVariants.id })
              .from(schema.productVariants)
              .where(
                and(
                  eq(schema.productVariants.productId, schema.products.id),
                  or(
                    ilike(schema.productVariants.sku, `%${params.search}%`),
                    ilike(schema.productVariants.barcode, `%${params.search}%`),
                  ),
                ),
              ),
          ),
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

    if (params?.minRating !== undefined) {
      conditions.push(gte(schema.products.averageRating, params.minRating));
    }

    const stockCondition = this.buildStockCondition(params?.stockStatus);
    if (stockCondition) {
      conditions.push(stockCondition);
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

  async findRelatedProducts(productId: string, limit: number = 8) {
    const [source] = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, productId));

    if (!source) return [];

    const orConditions: any[] = [];

    if (source.categoryId) {
      orConditions.push(eq(schema.products.categoryId, source.categoryId));
    }
    if (source.subcategoryId) {
      orConditions.push(eq(schema.products.subcategoryId, source.subcategoryId));
    }
    if (source.brandId) {
      orConditions.push(eq(schema.products.brandId, source.brandId));
    }

    if (orConditions.length === 0) return [];

    const candidates = await this.db
      .select()
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.subcategories, eq(schema.products.subcategoryId, schema.subcategories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .where(
        and(
          not(eq(schema.products.id, productId)),
          eq(schema.products.status, 'active'),
          eq(schema.products.isActive, true),
          or(...orConditions),
        ),
      );

    if (candidates.length === 0) return [];

    const sourceTags = source.tags || [];
    const sourcePrice = source.price || 0;

    const scored = candidates
      .map((row) => {
        const product = row.products;
        let score = 0;

        if (product.subcategoryId && product.subcategoryId === source.subcategoryId) score += 10;
        if (product.categoryId && product.categoryId === source.categoryId) score += 5;
        if (product.brandId && product.brandId === source.brandId) score += 3;

        if (sourceTags.length > 0 && product.tags) {
          const overlap = product.tags.filter((t) => sourceTags.includes(t)).length;
          score += overlap;
        }

        if (sourcePrice > 0 && product.price) {
          const diff = Math.abs(product.price - sourcePrice) / sourcePrice;
          if (diff <= 0.2) score += 2;
        }

        return {
          ...row,
          score,
        };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const productIds = scored.map((r) => r.products.id).filter((id): id is string => id !== null);

    if (productIds.length === 0) return [];

    const [allVariants, allImages] = await Promise.all([
      this.db
        .select()
        .from(schema.productVariants)
        .where(inArray(schema.productVariants.productId, productIds))
        .orderBy(schema.productVariants.sortOrder),
      this.db
        .select()
        .from(schema.productImages)
        .where(inArray(schema.productImages.productId, productIds))
        .orderBy(schema.productImages.sortOrder),
    ]);

    const variantIds = allVariants.map((v) => v.id);
    const allAttributes =
      variantIds.length > 0
        ? await this.db
            .select()
            .from(schema.variantAttributes)
            .where(inArray(schema.variantAttributes.variantId, variantIds))
            .orderBy(schema.variantAttributes.sortOrder)
        : [];

    const variantsByProduct = new Map<string, typeof allVariants>();
    const imagesByProduct = new Map<string, typeof allImages>();
    const attributesByVariant = new Map<string, typeof allAttributes>();

    for (const variant of allVariants) {
      const list = variantsByProduct.get(variant.productId) || [];
      list.push(variant);
      variantsByProduct.set(variant.productId, list);
    }

    for (const image of allImages) {
      if (!image.productId) continue;
      const list = imagesByProduct.get(image.productId) || [];
      list.push(image);
      imagesByProduct.set(image.productId, list);
    }

    for (const attr of allAttributes) {
      const list = attributesByVariant.get(attr.variantId) || [];
      list.push(attr);
      attributesByVariant.set(attr.variantId, list);
    }

    return scored
      .map((row) => {
        const pid = row.products.id;
        if (!pid) return null;
        const variants = (variantsByProduct.get(pid) || []).map((v) => ({
          ...v,
          attributes: attributesByVariant.get(v.id) || [],
        }));

        return {
          ...row.products,
          category: row.categories,
          subcategory: row.subcategories,
          brand: row.brands,
          variants,
          images: imagesByProduct.get(pid) || [],
        };
      })
      .filter(Boolean);
  }

  async findBestSellers(limit: number = 10) {
    const bestSellersRaw = await this.db
      .select({
        productId: schema.productVariants.productId,
        totalSold: sql<number>`coalesce(sum(${schema.orderItems.quantity}), 0)`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.productVariants, eq(schema.orderItems.variantId, schema.productVariants.id))
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .where(eq(schema.orders.paymentStatus, 'completed'))
      .groupBy(schema.productVariants.productId)
      .orderBy(desc(sql`coalesce(sum(${schema.orderItems.quantity}), 0)`))
      .limit(limit);

    if (bestSellersRaw.length === 0) return [];

    const productIds = bestSellersRaw.map((r) => r.productId).filter((id): id is string => id !== null);

    const products = await this.db
      .select()
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.subcategories, eq(schema.products.subcategoryId, schema.subcategories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .where(
        and(
          inArray(schema.products.id, productIds),
          eq(schema.products.status, 'active'),
          eq(schema.products.isActive, true),
        ),
      );

    const [allVariants, allImages] = await Promise.all([
      this.db
        .select()
        .from(schema.productVariants)
        .where(inArray(schema.productVariants.productId, productIds))
        .orderBy(schema.productVariants.sortOrder),
      this.db
        .select()
        .from(schema.productImages)
        .where(inArray(schema.productImages.productId, productIds))
        .orderBy(schema.productImages.sortOrder),
    ]);

    const variantIds = allVariants.map((v) => v.id);
    const allAttributes =
      variantIds.length > 0
        ? await this.db
            .select()
            .from(schema.variantAttributes)
            .where(inArray(schema.variantAttributes.variantId, variantIds))
            .orderBy(schema.variantAttributes.sortOrder)
        : [];

    const variantsByProduct = new Map<string, typeof allVariants>();
    const imagesByProduct = new Map<string, typeof allImages>();
    const attributesByVariant = new Map<string, typeof allAttributes>();

    for (const variant of allVariants) {
      const list = variantsByProduct.get(variant.productId) || [];
      list.push(variant);
      variantsByProduct.set(variant.productId, list);
    }

    for (const image of allImages) {
      if (!image.productId) continue;
      const list = imagesByProduct.get(image.productId) || [];
      list.push(image);
      imagesByProduct.set(image.productId, list);
    }

    for (const attr of allAttributes) {
      const list = attributesByVariant.get(attr.variantId) || [];
      list.push(attr);
      attributesByVariant.set(attr.variantId, list);
    }

    const soldMap = new Map(bestSellersRaw.map((r) => [r.productId, r.totalSold]));

    return products
      .map((row) => {
        const productId = row.products.id;
        if (!productId) return null;
        const variants = (variantsByProduct.get(productId) || []).map((v) => ({
          ...v,
          attributes: attributesByVariant.get(v.id) || [],
        }));

        return {
          ...row.products,
          category: row.categories,
          subcategory: row.subcategories,
          brand: row.brands,
          variants,
          images: imagesByProduct.get(productId) || [],
          totalSold: soldMap.get(productId) || 0,
        };
      })
      .filter(Boolean);
  }
}
