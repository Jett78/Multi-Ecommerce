import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AllowAnonymous, Roles } from '@thallesp/nestjs-better-auth';
import { CourierService } from './courier.service';
import { CalculateDeliveryDto, BatchCalculateDto } from './dto/calculate-delivery.dto';
import { UpdateMappingDto, BulkUpdateMappingsDto } from './dto/update-mapping.dto';
import { DeliveryRateEntity, DistrictMappingEntity } from './entities/courier.entity';

@ApiTags('courier')
@ApiBearerAuth()
@Controller('courier')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post('calculate')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate delivery charge for a district' })
  @ApiResponse({ status: 200, description: 'Delivery rate calculated' })
  async calculateRate(@Body() dto: CalculateDeliveryDto) {
    const rate = await this.courierService.calculateRate(
      dto.district,
      dto.weightKg,
      dto.codAmount,
      dto.deliveryType,
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Delivery rate calculated',
      data: new DeliveryRateEntity(rate),
    };
  }

  @Post('calculate/batch')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate delivery charges for many district/weight pairs' })
  @ApiResponse({ status: 200, description: 'Delivery rates calculated' })
  async calculateRatesBatch(@Body() dto: BatchCalculateDto) {
    const results = await this.courierService.calculateRatesBatch(dto.items);
    return {
      success: true,
      statusCode: 200,
      message: 'Delivery rates calculated',
      data: results,
    };
  }

  @Post('sync/:provider')
  @Roles(['super_admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync locations from courier API (runs in background)' })
  async syncLocations(@Param('provider') provider: string) {
    const result = await this.courierService.syncLocations(provider);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
      data: result,
    };
  }

  @Get('sync/:provider/status')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Get sync status for a provider' })
  async getSyncStatus(@Param('provider') provider: string) {
    const status = this.courierService.getSyncStatus(provider);
    return {
      success: true,
      statusCode: 200,
      message: 'Sync status fetched',
      data: status,
    };
  }

  @Get('mappings')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Get all district-to-courier mappings' })
  async getMappings() {
    const mappings = await this.courierService.getMappings();
    return {
      success: true,
      statusCode: 200,
      message: 'Mappings fetched successfully',
      data: mappings.map((m) => new DistrictMappingEntity(m)),
    };
  }

  @Post('mappings/auto-map/:provider')
  @Roles(['super_admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-map Nepal districts to synced cities/zones' })
  async autoMapDistricts(@Param('provider') provider: string) {
    const result = await this.courierService.autoMapDistricts(provider);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
      data: result,
    };
  }

  @Put('mappings')
  @Roles(['super_admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update district mappings' })
  async bulkUpdateMappings(@Body() dto: BulkUpdateMappingsDto) {
    const result = await this.courierService.bulkUpdateMappings(dto.mappings);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }

  @Put('mappings/single')
  @Roles(['super_admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a single district mapping' })
  async updateMapping(@Body() dto: UpdateMappingDto) {
    const result = await this.courierService.updateMapping(dto);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }

  @Get('locations/:provider/cities')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Get synced cities for a provider' })
  async getCities(@Param('provider') provider: string) {
    const cities = await this.courierService.getCities(provider);
    return {
      success: true,
      statusCode: 200,
      message: 'Cities fetched successfully',
      data: cities,
    };
  }

  @Get('locations/:provider/cities/:cityDbId/zones')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Get zones for a city' })
  async getZones(
    @Param('provider') provider: string,
    @Param('cityDbId') cityDbId: string,
  ) {
    const zones = await this.courierService.getZones(provider, cityDbId);
    return {
      success: true,
      statusCode: 200,
      message: 'Zones fetched successfully',
      data: zones,
    };
  }

  @Get('locations/:provider/zones/:zoneDbId/areas')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Get areas for a zone' })
  async getAreas(
    @Param('provider') provider: string,
    @Param('zoneDbId') zoneDbId: string,
  ) {
    const areas = await this.courierService.getAreas(provider, zoneDbId);
    return {
      success: true,
      statusCode: 200,
      message: 'Areas fetched successfully',
      data: areas,
    };
  }

  @Get('locations/:provider/branches')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Get branches for a provider' })
  async getBranches(@Param('provider') provider: string) {
    const branches = await this.courierService.getBranches(provider);
    return {
      success: true,
      statusCode: 200,
      message: 'Branches fetched successfully',
      data: branches,
    };
  }
}
