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

  private readonly variantFields = ['price', 'compareAtPrice', 'costPrice', 'stockQuantity', 'allowBackorder', 'lowStockThreshold', 'weight', 'barcode'];

  private cleanProduct(product: any) {
    if (product.variants && product.variants.length > 0) {
      const cleaned = { ...product };
      for (const field of this.variantFields) {
        delete cleaned[field];
      }
      return cleaned;
    }
    return product;
  }

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
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        brandId: dto.brandId,
        sku: dto.sku,
        status: dto.status as any || 'active',
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        tags: dto.tags,
        isActive: dto.isActive ?? true,
        // Store variant fields directly on product (for no-variant products)
        price: dto.price ?? 0,
        compareAtPrice: dto.compareAtPrice,
        costPrice: dto.costPrice,
        stockQuantity: dto.stockQuantity ?? 0,
        allowBackorder: dto.allowBackorder ?? false,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        weight: dto.weight,
        barcode: dto.barcode,
      });

      let result: Record<string, any> = { ...product };

      // Auto-generate SEO meta from product name
      const seoMeta = await this.productRepository.createSeoMeta({
        metaTitle: dto.seoMeta?.metaTitle || dto.name,
        metaDescription: dto.seoMeta?.metaDescription || dto.name,
        ogTitle: dto.seoMeta?.ogTitle || dto.name,
        ogDescription: dto.seoMeta?.ogDescription || dto.name,
        ...(dto.seoMeta?.canonicalUrl && { canonicalUrl: dto.seoMeta.canonicalUrl }),
        ...(dto.seoMeta?.metaRobots && { metaRobots: dto.seoMeta.metaRobots }),
        ...(dto.seoMeta?.ogImageKey && { ogImageKey: dto.seoMeta.ogImageKey }),
        productId: product.id,
      });
      result.seoMeta = seoMeta;

      // Only create product_variants when explicit variants are provided
      if (dto.variants && dto.variants.length > 0) {
        const createdVariants = [];
        for (let i = 0; i < dto.variants.length; i++) {
          const v = dto.variants[i];
          const variantSku = v.sku;
          
          // Only check SKU uniqueness if SKU is provided
          if (variantSku) {
            const skuExists = await this.variantRepository.findVariantBySku(variantSku);
            if (skuExists) {
              throw new ConflictException(`Variant with SKU "${variantSku}" already exists`);
            }
          }

          const variant = await this.variantRepository.createVariant({
            productId: product.id,
            sku: variantSku || null,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            costPrice: v.costPrice,
            stockQuantity: v.stockQuantity ?? 0,
            allowBackorder: v.allowBackorder ?? false,
            lowStockThreshold: v.lowStockThreshold ?? 5,
            weight: v.weight,
            barcode: v.barcode,
            isActive: v.isActive ?? true,
            sortOrder: v.sortOrder ?? i,
          });

          if (v.attributes && v.attributes.length > 0) {
            await this.variantRepository.upsertAttributes(variant.id, v.attributes);
          }

          const createdVariant = await this.variantRepository.findVariantById(variant.id);
          createdVariants.push(createdVariant);
        }
        result.variants = createdVariants;
      }

      if (dto.images?.length) {
        result.images = await this.productRepository.createProductImages(
          product.id,
          dto.images,
        );
      }

      return this.cleanProduct(result);
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
        data: products.map((p) => this.cleanProduct(p)),
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
      return this.cleanProduct(product);
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
      return this.cleanProduct(product);
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

      // Determine if variants are being added
      const hasVariants = dto.variants && dto.variants.length > 0;

      const updated = await this.productRepository.updateProduct(id, {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        brandId: dto.brandId,
        sku: dto.sku,
        status: dto.status as any,
        isFeatured: dto.isFeatured,
        sortOrder: dto.sortOrder,
        tags: dto.tags,
        isActive: dto.isActive,
        // If variants are provided, reset product-level fields to defaults
        // Otherwise, update them with the provided values
        price: hasVariants ? 0 : dto.price,
        compareAtPrice: hasVariants ? null : dto.compareAtPrice,
        costPrice: hasVariants ? null : dto.costPrice,
        stockQuantity: hasVariants ? 0 : dto.stockQuantity,
        allowBackorder: hasVariants ? false : dto.allowBackorder,
        lowStockThreshold: hasVariants ? 5 : dto.lowStockThreshold,
        weight: hasVariants ? null : dto.weight,
        barcode: hasVariants ? null : dto.barcode,
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

      if (dto.images !== undefined) {
        await this.productRepository.deleteProductImages(id);
        if (dto.images.length) {
          await this.productRepository.createProductImages(id, dto.images);
        }
      }

      // If variants are provided, replace all variants
      if (hasVariants) {
        // Delete existing variants (cascade deletes attributes)
        await this.variantRepository.deleteVariantsByProductId(id);

        // Create new variants
        const createdVariants = [];
        for (let i = 0; i < dto.variants!.length; i++) {
          const v = dto.variants![i];
          
          // Only check SKU uniqueness if SKU is provided
          if (v.sku) {
            const skuExists = await this.variantRepository.findVariantBySku(v.sku);
            if (skuExists) {
              throw new ConflictException(`Variant with SKU "${v.sku}" already exists`);
            }
          }

          const variant = await this.variantRepository.createVariant({
            productId: id,
            sku: v.sku || null,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            costPrice: v.costPrice,
            stockQuantity: v.stockQuantity ?? 0,
            allowBackorder: v.allowBackorder ?? false,
            lowStockThreshold: v.lowStockThreshold ?? 5,
            weight: v.weight,
            barcode: v.barcode,
            isActive: v.isActive ?? true,
            sortOrder: v.sortOrder ?? i,
          });

          if (v.attributes && v.attributes.length > 0) {
            await this.variantRepository.upsertAttributes(variant.id, v.attributes);
          }

          const createdVariant = await this.variantRepository.findVariantById(variant.id);
          createdVariants.push(createdVariant);
        }

        // Return updated product with variants
        const result = await this.productRepository.findProductById(id);
        if (!result) {
          throw new NotFoundException(`Product with id "${id}" not found after update`);
        }
        return this.cleanProduct(result);
      }

      // If no variants provided but product previously had variants, delete them
      // (user switched from variants to no-variants mode)
      if (existing.variants && existing.variants.length > 0) {
        await this.variantRepository.deleteVariantsByProductId(id);
      }

      return this.cleanProduct(updated);
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

      // Only check SKU uniqueness if SKU is provided
      if (dto.sku) {
        const skuExists = await this.variantRepository.findVariantBySku(dto.sku);
        if (skuExists) {
          throw new ConflictException(`Variant with SKU "${dto.sku}" already exists`);
        }
      }

      const variant = await this.variantRepository.createVariant({
        productId,
        sku: dto.sku || null,
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
        sku: dto.sku || null,
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

  async findAllVariants() {
    try {
      return await this.productRepository.findAllVariants();
    } catch (error) {
      this.logger.error(`Failed to fetch variants: ${error.message}`, error.stack);
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
