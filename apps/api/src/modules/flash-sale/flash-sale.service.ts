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

    this.logger.log(`[Service] Starting update for flash sale ${id}`);
    this.logger.log(`[Service] DTO received:`, JSON.stringify(dto, null, 2));
    this.logger.log(`[Service] Existing flash sale has ${existing.products?.length || 0} products`);

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

    if (dto.products !== undefined) {
      this.logger.log(`[Service] Updating flash sale ${id} with ${dto.products.length} products`);
      
      if (dto.products.length === 0) {
        this.logger.warn(`[Service] WARNING: Empty products array provided - all products will be removed`);
      } else {
        this.logger.log(`[Service] Products payload:`, JSON.stringify(dto.products, null, 2));
      }
      
      this.logger.log(`[Service] Existing products:`, JSON.stringify(existing.products?.map(p => ({ id: p.id, variantId: p.variantId })), null, 2));
      
      for (const product of dto.products) {
        const existingProduct = existing.products?.find(p => p.variantId === product.variantId);
        if (!existingProduct) {
          this.logger.log(`[Service] Checking if variant ${product.variantId} is in another active sale...`);
          const inActiveSale = await this.repository.checkVariantInActiveSale(product.variantId, id);
          if (inActiveSale) {
            this.logger.error(`[Service] Variant ${product.variantId} is already in an active flash sale`);
            throw new ConflictException(`Variant "${product.variantId}" is already in an active flash sale`);
          }
          this.logger.log(`[Service] Variant ${product.variantId} is available`);
        }
      }

      this.logger.log(`[Service] All validations passed, calling repository.updateWithProducts...`);
      await this.repository.updateWithProducts(id, updateData, dto.products, existing.products);
      this.logger.log(`[Service] Flash sale ${id} updated successfully with products`);
    } else {
      this.logger.log(`[Service] No products in DTO, updating metadata only`);
      await this.repository.update(id, updateData);
      this.logger.log(`[Service] Flash sale ${id} metadata updated successfully`);
    }

    this.logger.log(`[Service] Fetching updated flash sale from database...`);
    const updated = await this.findById(id);
    this.logger.log(`[Service] Updated flash sale has ${updated.products?.length || 0} products`);
    return updated;
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
