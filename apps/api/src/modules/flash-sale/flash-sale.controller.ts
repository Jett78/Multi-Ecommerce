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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { FlashSaleService } from './flash-sale.service';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';
import { AddFlashSaleProductDto } from './dto/add-flash-sale-product.dto';

@ApiTags('Flash Sales')
@Controller('flash-sales')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Get()
  @RequirePermissions('flash_sale.read')
  @ApiOperation({ summary: 'List all flash sales (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.flashSaleService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Flash sales fetched successfully',
      data: result.sales,
      total: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('active')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get active flash sales (public)' })
  async findActive() {
    const sales = await this.flashSaleService.findActive();
    return {
      success: true,
      statusCode: 200,
      message: 'Active flash sales fetched successfully',
      data: sales,
    };
  }

  @Get('active/products')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get all products in active flash sales (public)' })
  async findActiveProducts() {
    const products = await this.flashSaleService.findActiveProducts();
    return {
      success: true,
      statusCode: 200,
      message: 'Active flash sale products fetched successfully',
      data: products,
    };
  }

  @Get(':id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get a flash sale by ID' })
  @ApiParam({ name: 'id', description: 'Flash Sale ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const sale = await this.flashSaleService.findById(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Flash sale fetched successfully',
      data: sale,
    };
  }

  @Post()
  @RequirePermissions('flash_sale.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new flash sale (admin)' })
  async create(@Body() dto: CreateFlashSaleDto) {
    const sale = await this.flashSaleService.create(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Flash sale created successfully',
      data: sale,
    };
  }

  @Put(':id')
  @RequirePermissions('flash_sale.edit')
  @ApiOperation({ summary: 'Update a flash sale (admin)' })
  @ApiParam({ name: 'id', description: 'Flash Sale ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFlashSaleDto,
  ) {
    const sale = await this.flashSaleService.update(id, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Flash sale updated successfully',
      data: sale,
    };
  }

  @Delete(':id')
  @RequirePermissions('flash_sale.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a flash sale (admin)' })
  @ApiParam({ name: 'id', description: 'Flash Sale ID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.flashSaleService.delete(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Flash sale deleted successfully',
    };
  }

  @Post(':id/products')
  @RequirePermissions('flash_sale.edit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a product to flash sale (admin)' })
  @ApiParam({ name: 'id', description: 'Flash Sale ID' })
  async addProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddFlashSaleProductDto,
  ) {
    const sale = await this.flashSaleService.addProduct(id, dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Product added to flash sale',
      data: sale,
    };
  }

  @Delete('products/:productId')
  @RequirePermissions('flash_sale.edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a product from flash sale (admin)' })
  @ApiParam({ name: 'productId', description: 'Flash Sale Product ID' })
  async removeProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    const result = await this.flashSaleService.removeProduct(productId);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }

  @Put('products/:productId')
  @RequirePermissions('flash_sale.edit')
  @ApiOperation({ summary: 'Update a flash sale product (admin)' })
  @ApiParam({ name: 'productId', description: 'Flash Sale Product ID' })
  async updateProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: Partial<AddFlashSaleProductDto>,
  ) {
    const product = await this.flashSaleService.updateProduct(productId, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Flash sale product updated',
      data: product,
    };
  }
}
