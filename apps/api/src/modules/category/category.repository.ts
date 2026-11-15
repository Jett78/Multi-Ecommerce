import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, ilike, or, and, sql, desc } from 'drizzle-orm';

@Injectable()
export class CategoryRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createCategory(data: typeof schema.categories.$inferInsert) {
    const [category] = await this.db.insert(schema.categories).values(data).returning();
    return category;
  }

  async createSubcategory(data: typeof schema.subcategories.$inferInsert) {
    const [subcategory] = await this.db.insert(schema.subcategories).values(data).returning();
    return subcategory;
  }

  async findCategoryById(id: string) {
    const [result] = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id));

    return result || null;
  }

  async findCategoryBySlug(slug: string) {
    const [result] = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug));

    return result || null;
  }

  async findSubcategoryById(id: string) {
    const [result] = await this.db
      .select()
      .from(schema.subcategories)
      .leftJoin(schema.categories, eq(schema.subcategories.categoryId, schema.categories.id))
      .where(eq(schema.subcategories.id, id));

    if (!result) return null;

    return {
      ...result.subcategories,
      category: result.categories,
    };
  }

  async findSubcategoryBySlug(slug: string) {
    const [result] = await this.db
      .select()
      .from(schema.subcategories)
      .leftJoin(schema.categories, eq(schema.subcategories.categoryId, schema.categories.id))
      .where(eq(schema.subcategories.slug, slug));

    if (!result) return null;

    return {
      ...result.subcategories,
      category: result.categories,
    };
  }

  async getMaxSortOrder() {
    const [result] = await this.db
      .select({ max: sql<number>`coalesce(max(${schema.categories.sortOrder}), 0)` })
      .from(schema.categories);

    return Number(result?.max ?? 0);
  }

  async getMaxSubcategorySortOrder() {
    const [result] = await this.db
      .select({ max: sql<number>`coalesce(max(${schema.subcategories.sortOrder}), 0)` })
      .from(schema.subcategories);

    return Number(result?.max ?? 0);
  }

  async findAllCategories(params?: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.categories.name, `%${params.search}%`),
          ilike(schema.categories.slug, `%${params.search}%`),
        ),
      );
    }

    if (params?.isActive !== undefined) {
      conditions.push(eq(schema.categories.isActive, params.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const categories = await this.db
      .select()
      .from(schema.categories)
      .where(whereClause)
      .orderBy(desc(schema.categories.sortOrder), desc(schema.categories.createdAt))
      .limit(params?.take || 10)
      .offset(params?.skip || 0);

    return categories;
  }

  async countCategories(params?: { search?: string; isActive?: boolean }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.categories.name, `%${params.search}%`),
          ilike(schema.categories.slug, `%${params.search}%`),
        ),
      );
    }

    if (params?.isActive !== undefined) {
      conditions.push(eq(schema.categories.isActive, params.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.categories)
      .where(whereClause);

    return Number(result.count);
  }

  async findAllSubcategories(params?: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
    categoryId?: string;
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.subcategories.name, `%${params.search}%`),
          ilike(schema.subcategories.slug, `%${params.search}%`),
        ),
      );
    }

    if (params?.isActive !== undefined) {
      conditions.push(eq(schema.subcategories.isActive, params.isActive));
    }

    if (params?.categoryId) {
      conditions.push(eq(schema.subcategories.categoryId, params.categoryId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const subcategories = await this.db
      .select()
      .from(schema.subcategories)
      .leftJoin(schema.categories, eq(schema.subcategories.categoryId, schema.categories.id))
      .where(whereClause)
      .orderBy(desc(schema.subcategories.sortOrder), desc(schema.subcategories.createdAt))
      .limit(params?.take || 10)
      .offset(params?.skip || 0);

    return subcategories.map((row) => ({
      ...row.subcategories,
      category: row.categories,
    }));
  }

  async countSubcategories(params?: {
    search?: string;
    isActive?: boolean;
    categoryId?: string;
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.subcategories.name, `%${params.search}%`),
          ilike(schema.subcategories.slug, `%${params.search}%`),
        ),
      );
    }

    if (params?.isActive !== undefined) {
      conditions.push(eq(schema.subcategories.isActive, params.isActive));
    }

    if (params?.categoryId) {
      conditions.push(eq(schema.subcategories.categoryId, params.categoryId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.subcategories)
      .where(whereClause);

    return Number(result.count);
  }

  async updateCategory(id: string, data: Partial<typeof schema.categories.$inferInsert>) {
    const [category] = await this.db
      .update(schema.categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.categories.id, id))
      .returning();

    return category;
  }

  async updateSubcategory(id: string, data: Partial<typeof schema.subcategories.$inferInsert>) {
    const [subcategory] = await this.db
      .update(schema.subcategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.subcategories.id, id))
      .returning();

    return subcategory;
  }

  async deleteSubcategory(id: string) {
    const [subcategory] = await this.db
      .delete(schema.subcategories)
      .where(eq(schema.subcategories.id, id))
      .returning();

    return subcategory;
  }

  async deactivateSubcategoriesByCategoryId(categoryId: string) {
    await this.db
      .update(schema.subcategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.subcategories.categoryId, categoryId));
  }

  async countSubcategoriesByCategoryId(categoryId: string) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.subcategories)
      .where(eq(schema.subcategories.categoryId, categoryId));

    return Number(result.count);
  }
}
