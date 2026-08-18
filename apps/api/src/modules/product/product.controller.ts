import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AllowAnonymous, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewReplyDto } from './dto/create-review-reply.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { ProductEntity } from './entities/product.entity';
import { VariantEntity } from './entities/variant.entity';
import { ReviewEntity, ReviewReplyEntity } from './entities/review.entity';
import { DB_CONNECTION } from '../../db/db.module';
import { user as userTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<Record<string, never>>,
  ) {}

  @Post()
  @ApiCookieAuth()
  @RequirePermissions('product.create')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductEntity })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      withVariants: {
        summary: 'Create product with explicit variants',
        description: 'Product with multiple variants (e.g. different sizes/colors). Each variant has its own SKU, price, stock, and attributes.',
        value: {
          name: 'iPhone 15 Pro',
          slug: 'iphone-15-pro',
          description: 'Latest iPhone with A17 Pro chip',
          categoryId: 'string',
          brandId: 'string',
          sku: 'APL-IP15P',
          status: 'draft',
          isFeatured: false,
          isActive: true,
          tags: ['smartphone', 'apple', '5g'],
          variants: [
            {
              sku: 'APL-IP15P-128-BLU',
              name: '128GB - Blue',
              price: 99999,
              compareAtPrice: 109999,
              costPrice: 50000,
              stockQuantity: 25,
              weight: 200,
              attributes: [
                { attributeName: 'Color', attributeValue: 'Blue', sortOrder: 0 },
                { attributeName: 'Storage', attributeValue: '128GB', sortOrder: 1 },
              ],
            },
            {
              sku: 'APL-IP15P-256-BLU',
              name: '256GB - Blue',
              price: 109999,
              stockQuantity: 15,
              attributes: [
                { attributeName: 'Color', attributeValue: 'Blue', sortOrder: 0 },
                { attributeName: 'Storage', attributeValue: '256GB', sortOrder: 1 },
              ],
            },
          ],
          seoMeta: {
            metaTitle: 'iPhone 15 Pro - Best Price',
            metaDescription: 'Buy iPhone 15 Pro with best price and free shipping',
            canonicalUrl: 'https://example.com/products/iphone-15-pro',
            metaRobots: 'index, follow',
            ogTitle: 'iPhone 15 Pro - Share',
            ogDescription: 'Check out the new iPhone 15 Pro',
            ogImageKey: 'products/og-image.jpg',
          },
          images: ['products/iphone-front.jpg'],
        },
      },
      withoutVariants: {
        summary: 'Create simple product (auto-creates default variant)',
        description: 'Product without explicit variants. A default variant is auto-created from the base price/stock fields.',
        value: {
          name: 'iPhone 15 Pro',
          slug: 'iphone-15-pro',
          description: 'Latest iPhone with A17 Pro chip',
          sku: 'APL-IP15P-128',
          status: 'draft',
          isFeatured: false,
          isActive: true,
          tags: ['smartphone', 'apple', '5g'],
          price: 99999,
          compareAtPrice: 109999,
          costPrice: 50000,
          stockQuantity: 0,
          weight: 200,
          seoMeta: {
            metaTitle: 'iPhone 15 Pro - Best Price',
            metaDescription: 'Buy iPhone 15 Pro with best price and free shipping',
          },
          images: ['products/iphone-front.jpg'],
        },
      },
    },
  })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productService.createProduct(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Product created successfully',
      data: new ProductEntity(product),
    };
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get all products with pagination' })
  async findAll(@Query() query: GetProductsQueryDto) {
    const result = await this.productService.findAllProducts(query);
    return {
      success: true,
      statusCode: 200,
      message: 'Products fetched successfully',
      data: result.data.map((p) => new ProductEntity(p)),
      total: result.total,
      skip: result.skip,
      take: result.take,
      hasMore: result.hasMore,
    };
  }

  @AllowAnonymous()
  @Get('variants')
  @ApiOperation({ summary: 'Get all product variants' })
  async listAllVariants() {
    const variants = await this.productService.findAllVariants();
    return {
      success: true,
      statusCode: 200,
      message: 'Variants fetched successfully',
      data: variants.map((v) => new VariantEntity(v)),
    };
  }

  @AllowAnonymous()
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productService.findOneProduct(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Product fetched successfully',
      data: new ProductEntity(product),
    };
  }

  @AllowAnonymous()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  async findBySlug(@Param('slug') slug: string) {
    const product = await this.productService.findProductBySlug(slug);
    return {
      success: true,
      statusCode: 200,
      message: 'Product fetched successfully',
      data: new ProductEntity(product),
    };
  }

  @Put(':id')
  @ApiCookieAuth()
  @RequirePermissions('product.edit')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productService.updateProduct(id, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Product updated successfully',
      data: new ProductEntity(product),
    };
  }

  @Delete(':id')
  @ApiCookieAuth()
  @RequirePermissions('product.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.productService.removeProduct(id);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }

  @Put(':id/archive')
  @ApiCookieAuth()
  @RequirePermissions('product.edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a product (soft delete)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.productService.softDeleteProduct(id);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }

  // Variants
  @Post(':id/variants')
  @ApiCookieAuth()
  @RequirePermissions('product.create')
  @ApiOperation({ summary: 'Add a variant to a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({
    type: CreateVariantDto,
    examples: {
      variant: {
        summary: 'Create a product variant',
        description:
          'Add a variant (e.g. a 128GB Blue phone) to a product. Pass the product id in the URL path and the variant details in the body.',
        value: {
          sku: 'APL-IP15P-128-BLU',
          name: '128GB - Blue',
          price: 99999,
          compareAtPrice: 109999,
          costPrice: 50000,
          stockQuantity: 25,
          allowBackorder: false,
          lowStockThreshold: 5,
          weight: 200,
          barcode: '1234567890123',
          isActive: true,
          sortOrder: 0,
          attributes: [
            { attributeName: 'Color', attributeValue: 'Blue', sortOrder: 0 },
            { attributeName: 'Storage', attributeValue: '128GB', sortOrder: 1 },
          ],
        },
      },
    },
  })
  async createVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVariantDto,
  ) {
    const variant = await this.productService.createVariant(id, dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Variant created successfully',
      data: new VariantEntity(variant),
    };
  }

  @AllowAnonymous()
  @Get(':id/variants')
  @ApiOperation({ summary: 'Get all variants for a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async findAllVariants(@Param('id', ParseUUIDPipe) id: string) {
    const variants = await this.productService.findAllVariantsByProductId(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Variants fetched successfully',
      data: variants.map((v) => new VariantEntity(v)),
    };
  }

  @Put('variants/:variantId')
  @ApiCookieAuth()
  @RequirePermissions('product.edit')
  @ApiOperation({ summary: 'Update a variant' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  async updateVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    const variant = await this.productService.updateVariant(variantId, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Variant updated successfully',
      data: new VariantEntity(variant),
    };
  }

  @Delete('variants/:variantId')
  @ApiCookieAuth()
  @RequirePermissions('product.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a variant' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  async removeVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    const result = await this.productService.removeVariant(variantId);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }

  @Post('variants/:variantId/stock')
  @ApiCookieAuth()
  @RequirePermissions('product.manage_inventory')
  @ApiOperation({ summary: 'Adjust stock for a variant' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  async adjustStock(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: AdjustStockDto,
  ) {
    const result = await this.productService.adjustStock(variantId, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Stock adjusted successfully',
      data: result,
    };
  }

  // Reviews
  @Post(':id/reviews')
  @ApiCookieAuth()
  @RequirePermissions('product.create')
  @ApiOperation({ summary: 'Submit a review for a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async createReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
    @Session() session: UserSession,
  ) {
    if (!session?.user) {
      return { success: false, statusCode: 401, message: 'Not authenticated' };
    }
    const review = await this.productService.createReview(id, session.user.id, dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Review submitted successfully',
      data: new ReviewEntity(review),
    };
  }

  @AllowAnonymous()
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async findAllReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetReviewsQueryDto,
  ) {
    const result = await this.productService.findAllReviewsByProductId(id, query);
    return {
      success: true,
      statusCode: 200,
      message: 'Reviews fetched successfully',
      data: result.data.map((r) => new ReviewEntity(r)),
      total: result.total,
      skip: result.skip,
      take: result.take,
      hasMore: result.hasMore,
      avgRating: result.avgRating,
      totalReviews: result.totalReviews,
    };
  }

  @AllowAnonymous()
  @Get(':id/rating-breakdown')
  @ApiOperation({ summary: 'Get rating breakdown for a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  async getRatingBreakdown(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.productService.getRatingBreakdown(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Rating breakdown fetched successfully',
      data: result,
    };
  }

  @Put('reviews/:reviewId/approve')
  @ApiCookieAuth()
  @RequirePermissions('review.moderate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a review' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  async approveReview(@Param('reviewId', ParseUUIDPipe) reviewId: string) {
    const review = await this.productService.approveReview(reviewId);
    return {
      success: true,
      statusCode: 200,
      message: 'Review approved successfully',
      data: new ReviewEntity(review),
    };
  }

  @Delete('reviews/:reviewId')
  @ApiCookieAuth()
  @RequirePermissions('review.moderate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  async removeReview(@Param('reviewId', ParseUUIDPipe) reviewId: string) {
    const result = await this.productService.removeReview(reviewId);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }

  @Get('reviews/all')
  @ApiCookieAuth()
  @RequirePermissions('review.moderate')
  @ApiOperation({ summary: 'Get all reviews for admin moderation' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of items to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of items to take' })
  @ApiQuery({ name: 'rating', required: false, type: Number, description: 'Filter by rating (1-5)' })
  @ApiQuery({ name: 'isApproved', required: false, type: Boolean, description: 'Filter by approval status' })
  @ApiResponse({ status: 200, description: 'Reviews fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires review.moderate permission' })
  async findAllReviewsForAdmin(@Query() query: GetReviewsQueryDto) {
    const result = await this.productService.findAllReviewsForAdmin(query);
    return {
      success: true,
      statusCode: 200,
      message: 'Reviews fetched successfully',
      data: result.data.map((r) => new ReviewEntity(r)),
      total: result.total,
      skip: result.skip,
      take: result.take,
      hasMore: result.hasMore,
    };
  }

  @Post('reviews/:reviewId/helpful')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a review as helpful' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  async markReviewHelpful(@Param('reviewId', ParseUUIDPipe) reviewId: string) {
    const review = await this.productService.markReviewHelpful(reviewId);
    return {
      success: true,
      statusCode: 200,
      message: 'Review marked as helpful',
      data: new ReviewEntity(review),
    };
  }

  // ============================================================
  // REVIEW REPLIES
  // ============================================================

  @Post('reviews/:reviewId/replies')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Reply to a review' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  async createReviewReply(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: CreateReviewReplyDto,
    @Session() session: UserSession,
  ) {
    if (!session?.user) {
      return { success: false, statusCode: 401, message: 'Not authenticated' };
    }

    const userRecord = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    const userRole = userRecord[0]?.role || 'customer';

    const reply = await this.productService.createReviewReply(
      reviewId,
      session.user.id,
      dto,
      userRole,
    );

    return {
      success: true,
      statusCode: 201,
      message: 'Reply posted successfully',
      data: new ReviewReplyEntity(reply),
    };
  }

  @AllowAnonymous()
  @Get('reviews/:reviewId/replies')
  @ApiOperation({ summary: 'Get replies for a review' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  async getReviewReplies(@Param('reviewId', ParseUUIDPipe) reviewId: string) {
    const replies = await this.productService.getReviewReplies(reviewId);
    return {
      success: true,
      statusCode: 200,
      message: 'Replies fetched successfully',
      data: replies.map((r) => new ReviewReplyEntity(r)),
    };
  }

  @Delete('reviews/:reviewId/replies/:replyId')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a reply' })
  @ApiParam({ name: 'reviewId', description: 'Review UUID' })
  @ApiParam({ name: 'replyId', description: 'Reply UUID' })
  async deleteReviewReply(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Param('replyId', ParseUUIDPipe) replyId: string,
    @Session() session: UserSession,
  ) {
    if (!session?.user) {
      return { success: false, statusCode: 401, message: 'Not authenticated' };
    }

    const userRecord = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    const userRole = userRecord[0]?.role || 'customer';

    await this.productService.deleteReviewReply(replyId, session.user.id, userRole);

    return {
      success: true,
      statusCode: 200,
      message: 'Reply deleted successfully',
    };
  }
}
