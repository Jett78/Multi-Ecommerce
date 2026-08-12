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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { ProductEntity } from './entities/product.entity';
import { VariantEntity } from './entities/variant.entity';
import { ReviewEntity } from './entities/review.entity';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiCookieAuth()
  @RequirePermissions('product.create')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductEntity })
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
  ) {
    const review = await this.productService.createReview(id, '', dto);
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
}
