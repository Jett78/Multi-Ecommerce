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
  ApiQuery,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandEntity } from './entities/brand.entity';

@ApiTags('brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @RequirePermissions('brand.create')
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'Brand created successfully', type: BrandEntity })
  async create(@Body() dto: CreateBrandDto) {
    const brand = await this.brandService.create(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Brand created successfully',
      data: new BrandEntity(brand),
    };
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 10;
    const result = await this.brandService.findAll({
      skip: skipNum,
      take: takeNum,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    return {
      success: true,
      statusCode: 200,
      message: 'Brands fetched successfully',
      data: result.data.map((b) => new BrandEntity(b)),
      total: result.total,
      skip: result.skip,
      take: result.take,
      hasMore: result.hasMore,
    };
  }

  @AllowAnonymous()
  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by ID' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const brand = await this.brandService.findOne(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Brand fetched successfully',
      data: new BrandEntity(brand),
    };
  }

  @Put(':id')
  @RequirePermissions('brand.edit')
  @ApiOperation({ summary: 'Update a brand' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ) {
    const brand = await this.brandService.update(id, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Brand updated successfully',
      data: new BrandEntity(brand),
    };
  }

  @Delete(':id')
  @RequirePermissions('brand.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a brand' })
  @ApiParam({ name: 'id', description: 'Brand UUID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.brandService.remove(id);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }
}
