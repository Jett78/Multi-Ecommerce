import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class ShippingAddressRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: typeof schema.shippingAddresses.$inferInsert) {
    const [row] = await this.db.insert(schema.shippingAddresses).values(data).returning();
    return row;
  }

  async findAllByUser(userId: string) {
    return this.db
      .select()
      .from(schema.shippingAddresses)
      .where(eq(schema.shippingAddresses.userId, userId))
      .orderBy(desc(schema.shippingAddresses.isDefault), schema.shippingAddresses.createdAt);
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(schema.shippingAddresses)
      .where(eq(schema.shippingAddresses.id, id));
    return row || null;
  }

  async findDefault(userId: string) {
    const [row] = await this.db
      .select()
      .from(schema.shippingAddresses)
      .where(
        and(
          eq(schema.shippingAddresses.userId, userId),
          eq(schema.shippingAddresses.isDefault, true),
        ),
      );
    return row || null;
  }

  async update(id: string, data: Partial<typeof schema.shippingAddresses.$inferInsert>) {
    const [row] = await this.db
      .update(schema.shippingAddresses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.shippingAddresses.id, id))
      .returning();
    return row;
  }

  async setAllNonDefault(userId: string) {
    await this.db
      .update(schema.shippingAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(schema.shippingAddresses.userId, userId));
  }

  async delete(id: string) {
    await this.db.delete(schema.shippingAddresses).where(eq(schema.shippingAddresses.id, id));
  }
}
