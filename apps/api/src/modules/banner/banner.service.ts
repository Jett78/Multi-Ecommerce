import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { BannerRepository } from './banner.repository';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  constructor(private readonly repository: BannerRepository) {}

  async create(dto: CreateBannerDto) {
    try {
      const maxSortOrder = await this.repository.findMaxSortOrder();

      const banner = await this.repository.create({
        title: dto.title,
        imageUrl: dto.imageUrl,
        type: dto.type,
        link: dto.link,
        sortOrder: maxSortOrder + 1,
        isActive: dto.isActive ?? true,
      });

      return banner;
    } catch (error) {
      this.logger.error(`Failed to create banner: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(params?: { skip?: number; take?: number; search?: string }) {
    try {
      const { skip = 0, take = 10, search } = params || {};
      const [banners, total] = await Promise.all([
        this.repository.findAll({ skip, take, search }),
        this.repository.count({ search }),
      ]);
      return { data: banners, total };
    } catch (error) {
      this.logger.error(`Failed to fetch banners: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const banner = await this.repository.findById(id);
      if (!banner) {
        throw new NotFoundException(`Banner with id "${id}" not found`);
      }
      return banner;
    } catch (error) {
      this.logger.error(`Failed to fetch banner: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, dto: UpdateBannerDto) {
    try {
      const existingBanner = await this.repository.findById(id);
      if (!existingBanner) {
        throw new NotFoundException(`Banner with id "${id}" not found`);
      }

      if (dto.sortOrder !== undefined && dto.sortOrder !== existingBanner.sortOrder) {
        await this.repository.swapSortOrder(existingBanner.sortOrder, dto.sortOrder);
      }

      const updatedBanner = await this.repository.update(id, {
        title: dto.title,
        imageUrl: dto.imageUrl,
        type: dto.type,
        link: dto.link,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      });

      return updatedBanner;
    } catch (error) {
      this.logger.error(`Failed to update banner: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const banner = await this.repository.findById(id);
      if (!banner) {
        throw new NotFoundException(`Banner with id "${id}" not found`);
      }

      await this.repository.delete(id);
      await this.repository.reorderAfterDelete(banner.sortOrder);

      return { message: 'Banner deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete banner: ${error.message}`, error.stack);
      throw error;
    }
  }
}
