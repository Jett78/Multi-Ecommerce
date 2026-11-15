import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { GetCategoriesQueryDto, GetSubcategoriesQueryDto } from './dto/get-categories-query.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly repository: CategoryRepository) {}

  async createCategory(dto: CreateCategoryDto) {
    try {
      const existing = await this.repository.findCategoryBySlug(dto.slug);
      if (existing) {
        throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
      }

      const sortOrder = dto.sortOrder ?? (await this.repository.getMaxSortOrder()) + 1;

      const category = await this.repository.createCategory({
        name: dto.name,
        slug: dto.slug,
        imageKey: dto.imageKey,
        sortOrder,
        isActive: dto.isActive ?? true,
      });

      return category;
    } catch (error) {
      this.logger.error(`Failed to create category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllCategories(query: GetCategoriesQueryDto) {
    try {
      const { skip = 0, take = 10, search, isActive } = query;

      const [categories, total] = await Promise.all([
        this.repository.findAllCategories({ skip, take, search, isActive }),
        this.repository.countCategories({ search, isActive }),
      ]);

      const hasMore = skip + take < total;

      return {
        data: categories,
        total,
        skip,
        take,
        hasMore,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOneCategory(id: string) {
    try {
      const category = await this.repository.findCategoryById(id);
      if (!category) {
        throw new NotFoundException(`Category with id "${id}" not found`);
      }
      return category;
    } catch (error) {
      this.logger.error(`Failed to fetch category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findCategoryBySlug(slug: string) {
    try {
      const category = await this.repository.findCategoryBySlug(slug);
      if (!category) {
        throw new NotFoundException(`Category with slug "${slug}" not found`);
      }
      return category;
    } catch (error) {
      this.logger.error(`Failed to fetch category by slug: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      const existing = await this.repository.findCategoryById(id);
      if (!existing) {
        throw new NotFoundException(`Category with id "${id}" not found`);
      }

      if (dto.slug && dto.slug !== existing.slug) {
        const slugExists = await this.repository.findCategoryBySlug(dto.slug);
        if (slugExists) {
          throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
        }
      }

      const updated = await this.repository.updateCategory(id, {
        name: dto.name,
        slug: dto.slug,
        imageKey: dto.imageKey,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeCategory(id: string) {
    try {
      const category = await this.repository.findCategoryById(id);
      if (!category) {
        throw new NotFoundException(`Category with id "${id}" not found`);
      }

      await this.repository.updateCategory(id, { isActive: false });
      await this.repository.deactivateSubcategoriesByCategoryId(id);
      return { message: 'Category deactivated successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createSubcategory(dto: CreateSubcategoryDto) {
    try {
      const category = await this.repository.findCategoryById(dto.categoryId);
      if (!category) {
        throw new NotFoundException(`Category with id "${dto.categoryId}" not found`);
      }

      const existing = await this.repository.findSubcategoryBySlug(dto.slug);
      if (existing) {
        throw new ConflictException(`Subcategory with slug "${dto.slug}" already exists`);
      }

      const sortOrder =
        dto.sortOrder ?? (await this.repository.getMaxSubcategorySortOrder()) + 1;

      const subcategory = await this.repository.createSubcategory({
        name: dto.name,
        slug: dto.slug,
        imageKey: dto.imageKey,
        sortOrder,
        isActive: dto.isActive ?? true,
        categoryId: dto.categoryId,
      });

      return subcategory;
    } catch (error) {
      this.logger.error(`Failed to create subcategory: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllSubcategories(query: GetSubcategoriesQueryDto) {
    try {
      const { skip = 0, take = 10, search, isActive, categoryId } = query;

      const [subcategories, total] = await Promise.all([
        this.repository.findAllSubcategories({ skip, take, search, isActive, categoryId }),
        this.repository.countSubcategories({ search, isActive, categoryId }),
      ]);

      const hasMore = skip + take < total;

      return {
        data: subcategories,
        total,
        skip,
        take,
        hasMore,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch subcategories: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOneSubcategory(id: string) {
    try {
      const subcategory = await this.repository.findSubcategoryById(id);
      if (!subcategory) {
        throw new NotFoundException(`Subcategory with id "${id}" not found`);
      }
      return subcategory;
    } catch (error) {
      this.logger.error(`Failed to fetch subcategory: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findSubcategoryBySlug(slug: string) {
    try {
      const subcategory = await this.repository.findSubcategoryBySlug(slug);
      if (!subcategory) {
        throw new NotFoundException(`Subcategory with slug "${slug}" not found`);
      }
      return subcategory;
    } catch (error) {
      this.logger.error(`Failed to fetch subcategory by slug: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateSubcategory(id: string, dto: UpdateSubcategoryDto) {
    try {
      const existing = await this.repository.findSubcategoryById(id);
      if (!existing) {
        throw new NotFoundException(`Subcategory with id "${id}" not found`);
      }

      if (dto.categoryId) {
        const category = await this.repository.findCategoryById(dto.categoryId);
        if (!category) {
          throw new NotFoundException(`Category with id "${dto.categoryId}" not found`);
        }
      }

      if (dto.slug && dto.slug !== existing.slug) {
        const slugExists = await this.repository.findSubcategoryBySlug(dto.slug);
        if (slugExists) {
          throw new ConflictException(`Subcategory with slug "${dto.slug}" already exists`);
        }
      }

      const updated = await this.repository.updateSubcategory(id, {
        name: dto.name,
        slug: dto.slug,
        imageKey: dto.imageKey,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
        categoryId: dto.categoryId,
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update subcategory: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeSubcategory(id: string) {
    try {
      const subcategory = await this.repository.findSubcategoryById(id);
      if (!subcategory) {
        throw new NotFoundException(`Subcategory with id "${id}" not found`);
      }

      await this.repository.deleteSubcategory(id);
      return { message: 'Subcategory deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete subcategory: ${error.message}`, error.stack);
      throw error;
    }
  }
}
