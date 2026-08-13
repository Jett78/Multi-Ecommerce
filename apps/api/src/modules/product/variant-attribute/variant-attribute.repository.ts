import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../../db/db.module';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { CreateVariantAttributeDto } from './dto/create-variant-attribute.dto';
import { UpdateVariantAttributeDto } from './dto/update-variant-attribute.dto';

@Injectable()
export class VariantAttributeRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select()
      .from(schema.variantAttributes)
      .orderBy(schema.variantAttributes.variantId, schema.variantAttributes.sortOrder);
  }

  async create(dto: CreateVariantAttributeDto) {
    const [attribute] = await this.db
      .insert(schema.variantAttributes)
      .values({
        variantId: dto.variantId,
        attributeName: dto.attributeName,
        attributeValue: dto.attributeValue,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();
    return attribute;
  }

  async findById(id: string) {
    const [attribute] = await this.db
      .select()
      .from(schema.variantAttributes)
      .where(eq(schema.variantAttributes.id, id));
    return attribute;
  }

  async findByVariantId(variantId: string) {
    return this.db
      .select()
      .from(schema.variantAttributes)
      .where(eq(schema.variantAttributes.variantId, variantId))
      .orderBy(schema.variantAttributes.sortOrder);
  }

  async update(id: string, dto: UpdateVariantAttributeDto) {
    const [updated] = await this.db
      .update(schema.variantAttributes)
      .set({
        ...(dto.attributeName !== undefined && { attributeName: dto.attributeName }),
        ...(dto.attributeValue !== undefined && { attributeValue: dto.attributeValue }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      })
      .where(eq(schema.variantAttributes.id, id))
      .returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db
      .delete(schema.variantAttributes)
      .where(eq(schema.variantAttributes.id, id))
      .returning();
    return deleted;
  }

  async deleteByVariantId(variantId: string) {
    return this.db
      .delete(schema.variantAttributes)
      .where(eq(schema.variantAttributes.variantId, variantId))
      .returning();
  }
}
