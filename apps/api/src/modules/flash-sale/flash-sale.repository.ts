import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, ilike, or, and, sql, gte, lte, between } from 'drizzle-orm';

@Injectable()
export class FlashSaleRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: typeof schema.flashSales.$inferInsert, products: Array<{ variantId: string; salePrice: number; originalPrice: number; maxQuantity?: number }>) {
    return this.db.transaction(async (tx) => {
      const [sale] = await tx.insert(schema.flashSales).values(data).returning();

      if (products && products.length > 0) {
        await tx.insert(schema.flashSaleProducts).values(
          products.map((p) => ({
            flashSaleId: sale.id,
            variantId: p.variantId,
            salePrice: p.salePrice,
            originalPrice: p.originalPrice,
            maxQuantity: p.maxQuantity,
          }))
        );
      }

      return sale;
    });
  }

  async findById(id: string) {
    const [sale] = await this.db
      .select()
      .from(schema.flashSales)
      .where(eq(schema.flashSales.id, id));

    if (!sale) return null;

    const products = await this.db
      .select({
        id: schema.flashSaleProducts.id,
        flashSaleId: schema.flashSaleProducts.flashSaleId,
        variantId: schema.flashSaleProducts.variantId,
        salePrice: schema.flashSaleProducts.salePrice,
        originalPrice: schema.flashSaleProducts.originalPrice,
        maxQuantity: schema.flashSaleProducts.maxQuantity,
        soldQuantity: schema.flashSaleProducts.soldQuantity,
        createdAt: schema.flashSaleProducts.createdAt,
        productName: schema.products.name,
        productSlug: schema.products.slug,
        variantSku: schema.productVariants.sku,
        variantPrice: schema.productVariants.price,
      })
      .from(schema.flashSaleProducts)
      .innerJoin(schema.productVariants, eq(schema.flashSaleProducts.variantId, schema.productVariants.id))
      .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .where(eq(schema.flashSaleProducts.flashSaleId, id));

    return { ...sale, products };
  }

  async findBySlug(slug: string) {
    const [sale] = await this.db
      .select()
      .from(schema.flashSales)
      .where(eq(schema.flashSales.slug, slug));

    if (!sale) return null;

    const products = await this.db
      .select({
        id: schema.flashSaleProducts.id,
        flashSaleId: schema.flashSaleProducts.flashSaleId,
        variantId: schema.flashSaleProducts.variantId,
        salePrice: schema.flashSaleProducts.salePrice,
        originalPrice: schema.flashSaleProducts.originalPrice,
        maxQuantity: schema.flashSaleProducts.maxQuantity,
        soldQuantity: schema.flashSaleProducts.soldQuantity,
        createdAt: schema.flashSaleProducts.createdAt,
        productName: schema.products.name,
        productSlug: schema.products.slug,
        variantSku: schema.productVariants.sku,
        variantPrice: schema.productVariants.price,
      })
      .from(schema.flashSaleProducts)
      .innerJoin(schema.productVariants, eq(schema.flashSaleProducts.variantId, schema.productVariants.id))
      .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .where(eq(schema.flashSaleProducts.flashSaleId, sale.id));

    return { ...sale, products };
  }

  async findAll(page: number = 1, limit: number = 20, search?: string) {
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(schema.flashSales.name, `%${search}%`),
          ilike(schema.flashSales.slug, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.flashSales)
      .where(whereClause);

    const totalCount = Number(countResult.count);

    const sales = await this.db
      .select({
        id: schema.flashSales.id,
        name: schema.flashSales.name,
        slug: schema.flashSales.slug,
        description: schema.flashSales.description,
        startsAt: schema.flashSales.startsAt,
        endsAt: schema.flashSales.endsAt,
        isActive: schema.flashSales.isActive,
        imageUrl: schema.flashSales.imageUrl,
        createdAt: schema.flashSales.createdAt,
        updatedAt: schema.flashSales.updatedAt,
        productsCount: sql<number>`(
          SELECT COUNT(*)::INTEGER FROM flash_sale_products fsp
          WHERE fsp.flash_sale_id = ${schema.flashSales.id}
        )::integer`,
      })
      .from(schema.flashSales)
      .where(whereClause)
      .orderBy(sql`${schema.flashSales.startsAt} desc`)
      .limit(limit)
      .offset(offset);

    return {
      sales,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async findActive() {
    const now = new Date();
    return this.db
      .select()
      .from(schema.flashSales)
      .where(
        and(
          eq(schema.flashSales.isActive, true),
          lte(schema.flashSales.startsAt, now),
          gte(schema.flashSales.endsAt, now),
        )
      )
      .orderBy(sql`${schema.flashSales.endsAt} asc`);
  }

  async findActiveProducts() {
    const now = new Date();
    const rows = await this.db
      .select({
        id: schema.flashSaleProducts.id,
        flashSaleId: schema.flashSaleProducts.flashSaleId,
        variantId: schema.flashSaleProducts.variantId,
        salePrice: schema.flashSaleProducts.salePrice,
        originalPrice: schema.flashSaleProducts.originalPrice,
        maxQuantity: schema.flashSaleProducts.maxQuantity,
        soldQuantity: schema.flashSaleProducts.soldQuantity,
        flashSaleName: schema.flashSales.name,
        flashSaleSlug: schema.flashSales.slug,
        flashSaleStartsAt: schema.flashSales.startsAt,
        flashSaleEndsAt: schema.flashSales.endsAt,
        productId: schema.products.id,
        productName: schema.products.name,
        productSlug: schema.products.slug,
        imageKey: schema.productImages.imageKey,
      })
      .from(schema.flashSaleProducts)
      .innerJoin(schema.flashSales, eq(schema.flashSaleProducts.flashSaleId, schema.flashSales.id))
      .innerJoin(schema.productVariants, eq(schema.flashSaleProducts.variantId, schema.productVariants.id))
      .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .leftJoin(
        schema.productImages,
        and(
          eq(schema.productImages.productId, schema.products.id),
          eq(schema.productImages.isPrimary, true),
        ),
      )
      .where(
        and(
          eq(schema.flashSales.isActive, true),
          lte(schema.flashSales.startsAt, now),
          gte(schema.flashSales.endsAt, now),
        )
      );

    return rows.map((row) => ({
      ...row,
      imageUrl: row.imageKey ? this.buildImageUrl(row.imageKey) : null,
    }));
  }

  async findActiveProductByVariantId(variantId: string) {
    const now = new Date();
    const [result] = await this.db
      .select()
      .from(schema.flashSaleProducts)
      .innerJoin(schema.flashSales, eq(schema.flashSaleProducts.flashSaleId, schema.flashSales.id))
      .where(
        and(
          eq(schema.flashSaleProducts.variantId, variantId),
          eq(schema.flashSales.isActive, true),
          lte(schema.flashSales.startsAt, now),
          gte(schema.flashSales.endsAt, now),
        )
      )
      .limit(1);

    return result || null;
  }

  async update(id: string, data: Partial<typeof schema.flashSales.$inferInsert>) {
    const [sale] = await this.db
      .update(schema.flashSales)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.flashSales.id, id))
      .returning();

    return sale;
  }

  async updateWithProducts(
    id: string,
    updateData: Partial<typeof schema.flashSales.$inferInsert>,
    newProducts?: Array<{ variantId: string; salePrice: number; originalPrice: number; maxQuantity?: number }>,
    existingProducts?: Array<{ id: string; variantId: string }>
  ) {
    return this.db.transaction(async (tx) => {
      try {
       
        await tx
          .update(schema.flashSales)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(schema.flashSales.id, id));


        if (newProducts !== undefined && existingProducts !== undefined) {
        

          const existingVariantIds = new Set(existingProducts.map(p => p.variantId));
          const newVariantIds = new Set(newProducts.map(p => p.variantId));

          const toRemove = existingProducts.filter(p => !newVariantIds.has(p.variantId));
          
          for (const product of toRemove) {
            await tx.delete(schema.flashSaleProducts)
              .where(eq(schema.flashSaleProducts.id, product.id));
          }

          for (const product of newProducts) {
            const existing = existingProducts.find(p => p.variantId === product.variantId);
            if (existing) {
              await tx.update(schema.flashSaleProducts)
                .set({
                  salePrice: product.salePrice,
                  originalPrice: product.originalPrice,
                  maxQuantity: product.maxQuantity,
                })
                .where(eq(schema.flashSaleProducts.id, existing.id));
            } else {
              const result = await tx.insert(schema.flashSaleProducts).values({
                flashSaleId: id,
                variantId: product.variantId,
                salePrice: product.salePrice,
                originalPrice: product.originalPrice,
                maxQuantity: product.maxQuantity,
              }).returning();
            }
          }

        } else {
          console.log(`[Transaction] Skipping product update - newProducts: ${newProducts !== undefined}, existingProducts: ${existingProducts !== undefined}`);
        }

      } catch (error) {
        console.error(`[Transaction Error] Failed to update flash sale ${id}:`, error);
        throw error;
      }
    });
  }

  async delete(id: string) {
    const [sale] = await this.db
      .delete(schema.flashSales)
      .where(eq(schema.flashSales.id, id))
      .returning();

    return sale;
  }

  async addProduct(data: typeof schema.flashSaleProducts.$inferInsert) {
    const [product] = await this.db
      .insert(schema.flashSaleProducts)
      .values(data)
      .returning();

    return product;
  }

  async removeProduct(id: string) {
    const [product] = await this.db
      .delete(schema.flashSaleProducts)
      .where(eq(schema.flashSaleProducts.id, id))
      .returning();

    return product;
  }

  async updateProduct(id: string, data: Partial<typeof schema.flashSaleProducts.$inferInsert>) {
    const [product] = await this.db
      .update(schema.flashSaleProducts)
      .set(data)
      .where(eq(schema.flashSaleProducts.id, id))
      .returning();

    return product;
  }

  async checkVariantInActiveSale(variantId: string, excludeFlashSaleId?: string) {
    const now = new Date();
    const conditions = [
      eq(schema.flashSaleProducts.variantId, variantId),
      eq(schema.flashSales.isActive, true),
      lte(schema.flashSales.startsAt, now),
      gte(schema.flashSales.endsAt, now),
    ];

    if (excludeFlashSaleId) {
      conditions.push(sql`${schema.flashSaleProducts.flashSaleId} != ${excludeFlashSaleId}`);
    }

    const [existing] = await this.db
      .select({ id: schema.flashSaleProducts.id })
      .from(schema.flashSaleProducts)
      .innerJoin(schema.flashSales, eq(schema.flashSaleProducts.flashSaleId, schema.flashSales.id))
      .where(and(...conditions))
      .limit(1);

    return !!existing;
  }

  async incrementSoldQuantity(id: string, quantity: number) {
    await this.db
      .update(schema.flashSaleProducts)
      .set({ soldQuantity: sql`${schema.flashSaleProducts.soldQuantity} + ${quantity}` })
      .where(eq(schema.flashSaleProducts.id, id));
  }

  async debugCheckProducts(flashSaleId: string) {
    const products = await this.db
      .select()
      .from(schema.flashSaleProducts)
      .where(eq(schema.flashSaleProducts.flashSaleId, flashSaleId));

  

    return products;
  }

  private buildImageUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL || '';
    const bucketName = process.env.S3_BUCKET_NAME || '';
    const region = process.env.AWS_REGION || 'ap-south-1';

    if (cloudfrontUrl) {
      return `https://${cloudfrontUrl}/${key}`;
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
}
