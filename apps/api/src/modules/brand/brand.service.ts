import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BrandRepository } from './brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);

  constructor(private readonly repository: BrandRepository) {}

  async create(dto: CreateBrandDto) {
    try {
      const maxSortOrder = await this.repository.findMaxSortOrder();

      const brand = await this.repository.create({
        name: dto.name,
        imageKey: dto.imageKey,
        isActive: dto.isActive ?? true,
        sortOrder: maxSortOrder + 1,
      });

      return brand;
    } catch (error) {
      this.logger.error(`Failed to create brand: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(params?: { skip?: number; take?: number; search?: string; isActive?: boolean }) {
    try {
      const { skip = 0, take = 10, search, isActive } = params || {};
      const [brands, total] = await Promise.all([
        this.repository.findAll({ skip, take, search, isActive }),
        this.repository.count({ search, isActive }),
      ]);
      return { data: brands, total, skip, take, hasMore: skip + take < total };
    } catch (error) {
      this.logger.error(`Failed to fetch brands: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const brand = await this.repository.findById(id);
      if (!brand) {
        throw new NotFoundException(`Brand with id "${id}" not found`);
      }
      return brand;
    } catch (error) {
      this.logger.error(`Failed to fetch brand: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, dto: UpdateBrandDto) {
    try {
      const existingBrand = await this.repository.findById(id);
      if (!existingBrand) {
        throw new NotFoundException(`Brand with id "${id}" not found`);
      }

      if (dto.sortOrder !== undefined && dto.sortOrder !== existingBrand.sortOrder) {
        await this.repository.swapSortOrder(existingBrand.sortOrder, dto.sortOrder);
      }

      const updatedBrand = await this.repository.update(id, {
        name: dto.name,
        imageKey: dto.imageKey,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      });

      return updatedBrand;
    } catch (error) {
      this.logger.error(`Failed to update brand: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const brand = await this.repository.findById(id);
      if (!brand) {
        throw new NotFoundException(`Brand with id "${id}" not found`);
      }

      await this.repository.delete(id);
      await this.repository.reorderAfterDelete(brand.sortOrder);

      return { message: 'Brand deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete brand: ${error.message}`, error.stack);
      throw error;
    }
  }
}
