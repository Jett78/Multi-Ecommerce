import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, sql, desc } from 'drizzle-orm';

@Injectable()
export class VariantRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createVariant(data: typeof schema.productVariants.$inferInsert) {
    const [variant] = await this.db.insert(schema.productVariants).values(data).returning();
    return variant;
  }

  async findVariantById(id: string) {
    const [result] = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, id));

    if (!result) return null;

    const attributes = await this.db
      .select()
      .from(schema.variantAttributes)
      .where(eq(schema.variantAttributes.variantId, id))
      .orderBy(schema.variantAttributes.sortOrder);

    const images = await this.db
      .select()
      .from(schema.productImages)
      .where(eq(schema.productImages.variantId, id))
      .orderBy(schema.productImages.sortOrder);

    return {
      ...result,
      attributes,
      images,
    };
  }

  async findVariantBySku(sku: string) {
    const [variant] = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.sku, sku));

    return variant || null;
  }

  async findAllVariantsByProductId(productId: string) {
    const variants = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, productId))
      .orderBy(schema.productVariants.sortOrder);

    const variantIds = variants.map((v) => v.id);

    if (variantIds.length === 0) return [];

    const attributes = await this.db
      .select()
      .from(schema.variantAttributes)
      .where(sql`${schema.variantAttributes.variantId} IN ${variantIds}`);

    const images = await this.db
      .select()
      .from(schema.productImages)
      .where(sql`${schema.productImages.variantId} IN ${variantIds}`);

    return variants.map((variant) => ({
      ...variant,
      attributes: attributes.filter((a) => a.variantId === variant.id),
      images: images.filter((i) => i.variantId === variant.id),
    }));
  }

  async updateVariant(id: string, data: Partial<typeof schema.productVariants.$inferInsert>) {
    const [variant] = await this.db
      .update(schema.productVariants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.productVariants.id, id))
      .returning();

    return variant;
  }

  async deleteVariant(id: string) {
    const [variant] = await this.db
      .delete(schema.productVariants)
      .where(eq(schema.productVariants.id, id))
      .returning();

    return variant;
  }

  async deleteVariantsByProductId(productId: string) {
    await this.db
      .delete(schema.productVariants)
      .where(eq(schema.productVariants.productId, productId));
  }

  async deleteAllAttributesByVariantId(variantId: string) {
    await this.db
      .delete(schema.variantAttributes)
      .where(eq(schema.variantAttributes.variantId, variantId));
  }

  async createAttribute(data: typeof schema.variantAttributes.$inferInsert) {
    const [attribute] = await this.db.insert(schema.variantAttributes).values(data).returning();
    return attribute;
  }

  async upsertAttributes(variantId: string, attributes: { attributeName: string; attributeValue: string; sortOrder?: number }[]) {
    await this.db
      .delete(schema.variantAttributes)
      .where(eq(schema.variantAttributes.variantId, variantId));

    if (attributes.length === 0) return [];

    const inserted = await this.db
      .insert(schema.variantAttributes)
      .values(attributes.map((a) => ({ ...a, variantId })))
      .returning();

    return inserted;
  }

  async adjustStock(variantId: string, quantityChange: number, reference?: string, notes?: string, createdBy?: string) {
    const variant = await this.findVariantById(variantId);
    if (!variant) throw new Error('Variant not found');

    const quantityBefore = variant.stockQuantity;
    const quantityAfter = quantityBefore + quantityChange;

    const updated = await this.updateVariant(variantId, { stockQuantity: quantityAfter });

    const [transaction] = await this.db
      .insert(schema.inventoryTransactions)
      .values({
        variantId,
        type: quantityChange > 0 ? 'restock' : 'sale',
        quantity: quantityChange,
        quantityBefore,
        quantityAfter,
        reference,
        notes,
        createdBy,
      })
      .returning();

    return { variant: updated, transaction };
  }
}
