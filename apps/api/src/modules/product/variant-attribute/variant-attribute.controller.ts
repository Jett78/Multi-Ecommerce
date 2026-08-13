import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../../decorators/require-permissions.decorator';
import { VariantAttributeService } from './variant-attribute.service';
import { CreateVariantAttributeDto } from './dto/create-variant-attribute.dto';
import { UpdateVariantAttributeDto } from './dto/update-variant-attribute.dto';
import { VariantAttributeEntity } from './entities/variant-attribute.entity';

@ApiTags('variant-attributes')
@Controller('variant-attributes')
export class VariantAttributeController {
  constructor(private readonly service: VariantAttributeService) {}

  @Post()
  @RequirePermissions('product.create')
  @ApiOperation({ summary: 'Create variant attribute' })
  @ApiResponse({ status: 201, type: VariantAttributeEntity })
  async create(@Body() dto: CreateVariantAttributeDto) {
    const attribute = await this.service.create(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Variant attribute created successfully',
      data: new VariantAttributeEntity(attribute),
    };
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get all variant attributes' })
  @ApiResponse({ status: 200, type: [VariantAttributeEntity] })
  async findAll() {
    const attributes = await this.service.findAll();
    return {
      success: true,
      statusCode: 200,
      message: 'Variant attributes fetched successfully',
      data: attributes.map((attr) => new VariantAttributeEntity(attr)),
    };
  }

  @Get(':id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get variant attribute by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: VariantAttributeEntity })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const attribute = await this.service.findById(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Variant attribute fetched successfully',
      data: new VariantAttributeEntity(attribute),
    };
  }

  @Get('variant/:variantId')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get all attributes for a variant' })
  @ApiParam({ name: 'variantId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [VariantAttributeEntity] })
  async findByVariantId(@Param('variantId', ParseUUIDPipe) variantId: string) {
    const attributes = await this.service.findByVariantId(variantId);
    return {
      success: true,
      statusCode: 200,
      message: 'Variant attributes fetched successfully',
      data: attributes.map((attr) => new VariantAttributeEntity(attr)),
    };
  }

  @Put(':id')
  @RequirePermissions('product.edit')
  @ApiOperation({ summary: 'Update variant attribute' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: VariantAttributeEntity })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVariantAttributeDto,
  ) {
    const attribute = await this.service.update(id, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Variant attribute updated successfully',
      data: new VariantAttributeEntity(attribute),
    };
  }

  @Delete(':id')
  @RequirePermissions('product.delete')
  @ApiOperation({ summary: 'Delete variant attribute' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Variant attribute deleted successfully',
    };
  }
}
