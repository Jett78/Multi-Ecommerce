import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

@Injectable()
export class CartRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findOrCreateCart(userId?: string, sessionId?: string) {
    let cart;

    if (userId) {
      [cart] = await this.db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.userId, userId))
        .limit(1);
    } else if (sessionId) {
      [cart] = await this.db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.sessionId, sessionId))
        .limit(1);
    }

    if (!cart) {
      const [newCart] = await this.db
        .insert(schema.carts)
        .values({
          userId: userId || null,
          sessionId: sessionId || randomUUID(),
          expiresAt: userId ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .returning();
      cart = newCart;
    }

    return cart;
  }

  async findCartById(cartId: string) {
    const [cart] = await this.db
      .select()
      .from(schema.carts)
      .where(eq(schema.carts.id, cartId));

    return cart || null;
  }

  async findCartItems(cartId: string) {
    const items = await this.db
      .select()
      .from(schema.cartItems)
      .innerJoin(schema.productVariants, eq(schema.cartItems.variantId, schema.productVariants.id))
      .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .where(eq(schema.cartItems.cartId, cartId));

    return items.map((row) => ({
      id: row.cart_items.id,
      cartId: row.cart_items.cartId,
      variantId: row.cart_items.variantId,
      quantity: row.cart_items.quantity,
      priceAtAdd: row.cart_items.priceAtAdd,
      createdAt: row.cart_items.createdAt,
      updatedAt: row.cart_items.updatedAt,
      variant: {
        id: row.product_variants.id,
        sku: row.product_variants.sku,
        name: row.product_variants.name,
        price: row.product_variants.price,
        stockQuantity: row.product_variants.stockQuantity,
        allowBackorder: row.product_variants.allowBackorder,
      },
      product: {
        id: row.products.id,
        name: row.products.name,
        slug: row.products.slug,
      },
    }));
  }

  async addCartItem(cartId: string, variantId: string, quantity: number, priceAtAdd: number) {
    const [existingItem] = await this.db
      .select()
      .from(schema.cartItems)
      .where(sql`${schema.cartItems.cartId} = ${cartId} AND ${schema.cartItems.variantId} = ${variantId}`)
      .limit(1);

    if (existingItem) {
      const [updated] = await this.db
        .update(schema.cartItems)
        .set({
          quantity: existingItem.quantity + quantity,
          priceAtAdd,
          updatedAt: new Date(),
        })
        .where(eq(schema.cartItems.id, existingItem.id))
        .returning();

      return updated;
    }

    const [newItem] = await this.db
      .insert(schema.cartItems)
      .values({
        cartId,
        variantId,
        quantity,
        priceAtAdd,
      })
      .returning();

    return newItem;
  }

  async updateCartItem(cartItemId: string, quantity: number) {
    const [updated] = await this.db
      .update(schema.cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(schema.cartItems.id, cartItemId))
      .returning();

    return updated;
  }

  async deleteCartItem(cartItemId: string) {
    const [deleted] = await this.db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.id, cartItemId))
      .returning();

    return deleted;
  }

  async clearCart(cartId: string) {
    await this.db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.cartId, cartId));
  }

  async deleteCart(cartId: string) {
    await this.db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.cartId, cartId));

    await this.db
      .delete(schema.carts)
      .where(eq(schema.carts.id, cartId));
  }

  async getCartTotal(cartId: string) {
    const items = await this.findCartItems(cartId);

    const subtotal = items.reduce((sum, item) => sum + (item.priceAtAdd * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      itemCount,
      items,
    };
  }
}
