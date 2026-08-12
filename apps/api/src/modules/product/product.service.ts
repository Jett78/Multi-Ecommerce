import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { VariantRepository } from './variant.repository';
import { ReviewRepository } from './review.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: VariantRepository,
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async createProduct(dto: CreateProductDto) {
    try {
      const existing = await this.productRepository.findProductBySlug(dto.slug);
      if (existing) {
        throw new ConflictException(`Product with slug "${dto.slug}" already exists`);
      }

      if (dto.sku) {
        const skuExists = await this.productRepository.findProductById(dto.sku);
        if (skuExists) {
          throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
        }
      }

      const product = await this.productRepository.createProduct({
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        brandId: dto.brandId,
        sku: dto.sku,
        status: dto.status as any || 'draft',
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        tags: dto.tags,
        isActive: dto.isActive ?? true,
      });

      let result: Record<string, any> = { ...product };

      if (dto.seoMeta) {
        const seoMeta = await this.productRepository.createSeoMeta({
          ...dto.seoMeta,
          productId: product.id,
        });
        result.seoMeta = seoMeta;
      }

      // Option A: every product owns at least one variant so stock/pricing always lives on product_variants.
      // Auto-create a default variant from the base variant fields when the caller did not supply variants.
      const defaultVariantSku = dto.sku || `${dto.slug}-default`;
      const skuExists = await this.variantRepository.findVariantBySku(defaultVariantSku);
      if (skuExists) {
        throw new ConflictException(`Variant with SKU "${defaultVariantSku}" already exists`);
      }

      const defaultVariant = await this.variantRepository.createVariant({
        productId: product.id,
        sku: defaultVariantSku,
        name: dto.name,
        price: dto.price ?? 0,
        compareAtPrice: dto.compareAtPrice,
        costPrice: dto.costPrice,
        stockQuantity: dto.stockQuantity ?? 0,
        allowBackorder: dto.allowBackorder ?? false,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        weight: dto.weight,
        barcode: dto.barcode,
        isActive: dto.isActive ?? true,
        sortOrder: 0,
      });

      result.variants = [defaultVariant];
      return result;
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllProducts(query: GetProductsQueryDto) {
    try {
      const { skip = 0, take = 10, search, status, categoryId, subcategoryId, brandId, isFeatured, minPrice, maxPrice } = query;

      const [products, total] = await Promise.all([
        this.productRepository.findAllProducts({ skip, take, search, status, categoryId, subcategoryId, brandId, isFeatured, minPrice, maxPrice }),
        this.productRepository.countProducts({ search, status, categoryId, subcategoryId, brandId, isFeatured }),
      ]);

      const hasMore = skip + take < total;

      return {
        data: products,
        total,
        skip,
        take,
        hasMore,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch products: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOneProduct(id: string) {
    try {
      const product = await this.productRepository.findProductById(id);
      if (!product) {
        throw new NotFoundException(`Product with id "${id}" not found`);
      }
      return product;
    } catch (error) {
      this.logger.error(`Failed to fetch product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findProductBySlug(slug: string) {
    try {
      const product = await this.productRepository.findProductBySlug(slug);
      if (!product) {
        throw new NotFoundException(`Product with slug "${slug}" not found`);
      }
      return product;
    } catch (error) {
      this.logger.error(`Failed to fetch product by slug: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    try {
      const existing = await this.productRepository.findProductById(id);
      if (!existing) {
        throw new NotFoundException(`Product with id "${id}" not found`);
      }

      if (dto.slug && dto.slug !== existing.slug) {
        const slugExists = await this.productRepository.findProductBySlug(dto.slug);
        if (slugExists) {
          throw new ConflictException(`Product with slug "${dto.slug}" already exists`);
        }
      }

      const updated = await this.productRepository.updateProduct(id, {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        brandId: dto.brandId,
        sku: dto.sku,
        status: dto.status as any,
        isFeatured: dto.isFeatured,
        sortOrder: dto.sortOrder,
        tags: dto.tags,
        isActive: dto.isActive,
      });

      if (dto.seoMeta) {
        if (existing.seoMeta) {
          await this.productRepository.updateSeoMeta(id, dto.seoMeta);
        } else {
          await this.productRepository.createSeoMeta({
            ...dto.seoMeta,
            productId: id,
          });
        }
      }

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeProduct(id: string) {
    try {
      const product = await this.productRepository.findProductById(id);
      if (!product) {
        throw new NotFoundException(`Product with id "${id}" not found`);
      }

      await this.productRepository.deleteProduct(id);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete product: ${error.message}`, error.stack);
      throw error;
    }
  }

  async softDeleteProduct(id: string) {
    try {
      const product = await this.productRepository.findProductById(id);
      if (!product) {
        throw new NotFoundException(`Product with id "${id}" not found`);
      }

      await this.productRepository.softDeleteProduct(id);
      return { message: 'Product archived successfully' };
    } catch (error) {
      this.logger.error(`Failed to archive product: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Variants
  async createVariant(productId: string, dto: CreateVariantDto) {
    try {
      const product = await this.productRepository.findProductById(productId);
      if (!product) {
        throw new NotFoundException(`Product with id "${productId}" not found`);
      }

      const skuExists = await this.variantRepository.findVariantBySku(dto.sku);
      if (skuExists) {
        throw new ConflictException(`Variant with SKU "${dto.sku}" already exists`);
      }

      const variant = await this.variantRepository.createVariant({
        productId,
        sku: dto.sku,
        name: dto.name,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        costPrice: dto.costPrice,
        stockQuantity: dto.stockQuantity ?? 0,
        allowBackorder: dto.allowBackorder ?? false,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        weight: dto.weight,
        barcode: dto.barcode,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      });

      if (dto.attributes && dto.attributes.length > 0) {
        await this.variantRepository.upsertAttributes(variant.id, dto.attributes);
      }

      const createdVariant = await this.variantRepository.findVariantById(variant.id);
      if (!createdVariant) {
        throw new NotFoundException(`Failed to retrieve created variant`);
      }
      return createdVariant;
    } catch (error) {
      this.logger.error(`Failed to create variant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllVariantsByProductId(productId: string) {
    try {
      const product = await this.productRepository.findProductById(productId);
      if (!product) {
        throw new NotFoundException(`Product with id "${productId}" not found`);
      }

      return await this.variantRepository.findAllVariantsByProductId(productId);
    } catch (error) {
      this.logger.error(`Failed to fetch variants: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findVariantById(variantId: string) {
    try {
      const variant = await this.variantRepository.findVariantById(variantId);
      if (!variant) {
        throw new NotFoundException(`Variant with id "${variantId}" not found`);
      }
      return variant;
    } catch (error) {
      this.logger.error(`Failed to fetch variant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto) {
    try {
      const existing = await this.variantRepository.findVariantById(variantId);
      if (!existing) {
        throw new NotFoundException(`Variant with id "${variantId}" not found`);
      }

      if (dto.sku && dto.sku !== existing.sku) {
        const skuExists = await this.variantRepository.findVariantBySku(dto.sku);
        if (skuExists) {
          throw new ConflictException(`Variant with SKU "${dto.sku}" already exists`);
        }
      }

      const updated = await this.variantRepository.updateVariant(variantId, {
        sku: dto.sku,
        name: dto.name,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        costPrice: dto.costPrice,
        stockQuantity: dto.stockQuantity,
        allowBackorder: dto.allowBackorder,
        lowStockThreshold: dto.lowStockThreshold,
        weight: dto.weight,
        barcode: dto.barcode,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      });

      if (dto.attributes) {
        await this.variantRepository.upsertAttributes(variantId, dto.attributes);
      }

      const updatedVariant = await this.variantRepository.findVariantById(variantId);
      if (!updatedVariant) {
        throw new NotFoundException(`Failed to retrieve updated variant`);
      }
      return updatedVariant;
    } catch (error) {
      this.logger.error(`Failed to update variant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeVariant(variantId: string) {
    try {
      const variant = await this.variantRepository.findVariantById(variantId);
      if (!variant) {
        throw new NotFoundException(`Variant with id "${variantId}" not found`);
      }

      await this.variantRepository.deleteVariant(variantId);
      return { message: 'Variant deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete variant: ${error.message}`, error.stack);
      throw error;
    }
  }

  async adjustStock(variantId: string, dto: AdjustStockDto, userId?: string) {
    try {
      const variant = await this.variantRepository.findVariantById(variantId);
      if (!variant) {
        throw new NotFoundException(`Variant with id "${variantId}" not found`);
      }

      if (!variant.allowBackorder && dto.quantity < 0 && variant.stockQuantity + dto.quantity < 0) {
        throw new BadRequestException(`Insufficient stock. Available: ${variant.stockQuantity}, Requested: ${Math.abs(dto.quantity)}`);
      }

      return await this.variantRepository.adjustStock(variantId, dto.quantity, dto.reference, dto.notes, userId);
    } catch (error) {
      this.logger.error(`Failed to adjust stock: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Reviews
  async createReview(productId: string, userId: string, dto: CreateReviewDto) {
    try {
      const product = await this.productRepository.findProductById(productId);
      if (!product) {
        throw new NotFoundException(`Product with id "${productId}" not found`);
      }

      const hasPurchased = await this.reviewRepository.hasUserPurchasedProduct(userId, productId);

      const review = await this.reviewRepository.createReview({
        productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        isVerifiedPurchase: hasPurchased,
        isApproved: false,
        helpfulCount: 0,
      });

      return review;
    } catch (error) {
      this.logger.error(`Failed to create review: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllReviewsByProductId(productId: string, query: GetReviewsQueryDto) {
    try {
      const { skip = 0, take = 10, rating, isApproved } = query;

      const [reviews, total] = await Promise.all([
        this.reviewRepository.findAllReviewsByProductId(productId, { skip, take, rating, isApproved }),
        this.reviewRepository.countReviewsByProductId(productId, { rating, isApproved }),
      ]);

      const avgRating = await this.reviewRepository.getAverageRating(productId);

      const hasMore = skip + take < total;

      return {
        data: reviews,
        total,
        skip,
        take,
        hasMore,
        avgRating: avgRating.avgRating,
        totalReviews: avgRating.totalReviews,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch reviews: ${error.message}`, error.stack);
      throw error;
    }
  }

  async approveReview(reviewId: string) {
    try {
      const review = await this.reviewRepository.findReviewById(reviewId);
      if (!review) {
        throw new NotFoundException(`Review with id "${reviewId}" not found`);
      }

      return await this.reviewRepository.updateReview(reviewId, { isApproved: true });
    } catch (error) {
      this.logger.error(`Failed to approve review: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeReview(reviewId: string) {
    try {
      const review = await this.reviewRepository.findReviewById(reviewId);
      if (!review) {
        throw new NotFoundException(`Review with id "${reviewId}" not found`);
      }

      await this.reviewRepository.deleteReview(reviewId);
      return { message: 'Review deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete review: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markReviewHelpful(reviewId: string) {
    try {
      const review = await this.reviewRepository.findReviewById(reviewId);
      if (!review) {
        throw new NotFoundException(`Review with id "${reviewId}" not found`);
      }

      return await this.reviewRepository.incrementHelpfulCount(reviewId);
    } catch (error) {
      this.logger.error(`Failed to mark review helpful: ${error.message}`, error.stack);
      throw error;
    }
  }
}
