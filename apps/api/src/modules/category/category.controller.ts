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
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { GetCategoriesQueryDto, GetSubcategoriesQueryDto } from './dto/get-categories-query.dto';
import { CategoryEntity } from './entities/category.entity';
import { SubcategoryEntity } from './entities/subcategory.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @RequirePermissions('category.create')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryEntity })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.categoryService.createCategory(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Category created successfully',
      data: new CategoryEntity(category),
    };
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get all categories with pagination' })
  async findAllCategories(@Query() query: GetCategoriesQueryDto) {
    const result = await this.categoryService.findAllCategories(query);
    return {
      success: true,
      statusCode: 200,
      message: 'Categories fetched successfully',
      data: result.data.map((c) => new CategoryEntity(c)),
      total: result.total,
      skip: result.skip,
      take: result.take,
      hasMore: result.hasMore,
    };
  }

  @AllowAnonymous()
  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  async findOneCategory(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoryService.findOneCategory(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Category fetched successfully',
      data: new CategoryEntity(category),
    };
  }

  @AllowAnonymous()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a category by slug' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  async findCategoryBySlug(@Param('slug') slug: string) {
    const category = await this.categoryService.findCategoryBySlug(slug);
    return {
      success: true,
      statusCode: 200,
      message: 'Category fetched successfully',
      data: new CategoryEntity(category),
    };
  }

  @Put(':id')
  @RequirePermissions('category.edit')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.updateCategory(id, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Category updated successfully',
      data: new CategoryEntity(category),
    };
  }

  @Delete(':id')
  @RequirePermissions('category.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  async removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.categoryService.removeCategory(id);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }
}

@ApiTags('subcategories')
@Controller('subcategories')
export class SubcategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @RequirePermissions('category.create')
  @ApiOperation({ summary: 'Create a new subcategory' })
  @ApiResponse({ status: 201, description: 'Subcategory created successfully', type: SubcategoryEntity })
  async createSubcategory(@Body() dto: CreateSubcategoryDto) {
    const subcategory = await this.categoryService.createSubcategory(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Subcategory created successfully',
      data: new SubcategoryEntity(subcategory),
    };
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get all subcategories with pagination' })
  async findAllSubcategories(@Query() query: GetSubcategoriesQueryDto) {
    const result = await this.categoryService.findAllSubcategories(query);
    return {
      success: true,
      statusCode: 200,
      message: 'Subcategories fetched successfully',
      data: result.data.map((s) => new SubcategoryEntity(s)),
      total: result.total,
      skip: result.skip,
      take: result.take,
      hasMore: result.hasMore,
    };
  }

  @AllowAnonymous()
  @Get(':id')
  @ApiOperation({ summary: 'Get a subcategory by ID' })
  @ApiParam({ name: 'id', description: 'Subcategory UUID' })
  async findOneSubcategory(@Param('id', ParseUUIDPipe) id: string) {
    const subcategory = await this.categoryService.findOneSubcategory(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Subcategory fetched successfully',
      data: new SubcategoryEntity(subcategory),
    };
  }

  @AllowAnonymous()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a subcategory by slug' })
  @ApiParam({ name: 'slug', description: 'Subcategory slug' })
  async findSubcategoryBySlug(@Param('slug') slug: string) {
    const subcategory = await this.categoryService.findSubcategoryBySlug(slug);
    return {
      success: true,
      statusCode: 200,
      message: 'Subcategory fetched successfully',
      data: new SubcategoryEntity(subcategory),
    };
  }

  @Put(':id')
  @RequirePermissions('category.edit')
  @ApiOperation({ summary: 'Update a subcategory' })
  @ApiParam({ name: 'id', description: 'Subcategory UUID' })
  async updateSubcategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    const subcategory = await this.categoryService.updateSubcategory(id, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Subcategory updated successfully',
      data: new SubcategoryEntity(subcategory),
    };
  }

  @Delete(':id')
  @RequirePermissions('category.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a subcategory' })
  @ApiParam({ name: 'id', description: 'Subcategory UUID' })
  async removeSubcategory(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.categoryService.removeSubcategory(id);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }
}
