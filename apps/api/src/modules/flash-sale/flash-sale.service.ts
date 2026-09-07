import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { FlashSaleRepository } from './flash-sale.repository';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';
import { AddFlashSaleProductDto } from './dto/add-flash-sale-product.dto';

@Injectable()
export class FlashSaleService {
  private readonly logger = new Logger(FlashSaleService.name);

  constructor(private readonly repository: FlashSaleRepository) {}

  async create(dto: CreateFlashSaleDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('End date must be after start date');
    }

    if (dto.products && dto.products.length > 0) {
      for (const product of dto.products) {
        const inActiveSale = await this.repository.checkVariantInActiveSale(product.variantId);
        if (inActiveSale) {
          throw new ConflictException(`Variant "${product.variantId}" is already in an active flash sale`);
        }
      }
    }

    const sale = await this.repository.create(
      {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        startsAt,
        endsAt,
        isActive: dto.isActive ?? true,
        imageUrl: dto.imageUrl,
      },
      dto.products || [],
    );

    return this.findById(sale.id);
  }

  async findAll(page?: number, limit?: number, search?: string) {
    return this.repository.findAll(page, limit, search);
  }

  async findActive() {
    return this.repository.findActive();
  }

  async findActiveProducts() {
    return this.repository.findActiveProducts();
  }

  async findById(id: string) {
    const sale = await this.repository.findById(id);
    if (!sale) {
      throw new NotFoundException(`Flash sale with id "${id}" not found`);
    }
    return sale;
  }

  async findBySlug(slug: string) {
    const sale = await this.repository.findBySlug(slug);
    if (!sale) {
      throw new NotFoundException(`Flash sale with slug "${slug}" not found`);
    }
    return sale;
  }

  async update(id: string, dto: UpdateFlashSaleDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Flash sale with id "${id}" not found`);
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.startsAt !== undefined) updateData.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) updateData.endsAt = new Date(dto.endsAt);

    if (dto.startsAt && dto.endsAt) {
      if (new Date(dto.endsAt) <= new Date(dto.startsAt)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    await this.repository.update(id, updateData);

    if (dto.products !== undefined) {
      const existingVariantIds = new Set(existing.products?.map(p => p.variantId) || []);
      const newVariantIds = new Set(dto.products.map(p => p.variantId));

      const toRemove = existing.products?.filter(p => !newVariantIds.has(p.variantId)) || [];
      for (const product of toRemove) {
        await this.repository.removeProduct(product.id);
      }

      for (const product of dto.products) {
        const existingProduct = existing.products?.find(p => p.variantId === product.variantId);
        if (existingProduct) {
          await this.repository.updateProduct(existingProduct.id, {
            salePrice: product.salePrice,
            originalPrice: product.originalPrice,
            maxQuantity: product.maxQuantity,
          });
        } else {
          const inActiveSale = await this.repository.checkVariantInActiveSale(product.variantId, id);
          if (inActiveSale) {
            throw new ConflictException(`Variant "${product.variantId}" is already in an active flash sale`);
          }
          await this.repository.addProduct({
            flashSaleId: id,
            variantId: product.variantId,
            salePrice: product.salePrice,
            originalPrice: product.originalPrice,
            maxQuantity: product.maxQuantity,
          });
        }
      }
    }

    return this.findById(id);
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Flash sale with id "${id}" not found`);
    }
    return this.repository.delete(id);
  }

  async addProduct(flashSaleId: string, dto: AddFlashSaleProductDto) {
    const sale = await this.repository.findById(flashSaleId);
    if (!sale) {
      throw new NotFoundException(`Flash sale with id "${flashSaleId}" not found`);
    }

    const inActiveSale = await this.repository.checkVariantInActiveSale(dto.variantId, flashSaleId);
    if (inActiveSale) {
      throw new ConflictException('This variant is already in an active flash sale');
    }

    const product = await this.repository.addProduct({
      flashSaleId,
      variantId: dto.variantId,
      salePrice: dto.salePrice,
      originalPrice: dto.originalPrice,
      maxQuantity: dto.maxQuantity,
    });

    return this.findById(flashSaleId);
  }

  async removeProduct(productId: string) {
    const product = await this.repository.removeProduct(productId);
    if (!product) {
      throw new NotFoundException(`Flash sale product with id "${productId}" not found`);
    }
    return { message: 'Product removed from flash sale' };
  }

  async updateProduct(productId: string, dto: Partial<AddFlashSaleProductDto>) {
    const existing = await this.repository.updateProduct(productId, dto);
    if (!existing) {
      throw new NotFoundException(`Flash sale product with id "${productId}" not found`);
    }
    return existing;
  }

  async getFlashSalePriceForVariant(variantId: string) {
    return this.repository.findActiveProductByVariantId(variantId);
  }

  async decrementSoldQuantity(id: string, quantity: number) {
    await this.repository.incrementSoldQuantity(id, -quantity);
  }
}
