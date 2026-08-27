import {
  Controller,
  Get,
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
import { CourierSettingsService } from './courier-settings.service';
import { UpdateCourierSettingsDto } from './dto/update-courier-settings.dto';
import { CourierSettingsEntity } from './entities/courier-settings.entity';

@ApiTags('courier-settings')
@ApiBearerAuth()
@Controller('courier/settings')
export class CourierSettingsController {
  constructor(private readonly courierSettingsService: CourierSettingsService) {}

  @Get()
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'List all courier providers' })
  async findAll() {
    const settings = await this.courierSettingsService.findAll();
    return {
      success: true,
      statusCode: 200,
      message: 'Courier providers fetched successfully',
      data: settings.map((s) => new CourierSettingsEntity(s)),
    };
  }

  @Get(':provider')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Get courier settings for a provider' })
  async findOne(@Param('provider') provider: string) {
    const settings = await this.courierSettingsService.findByProvider(provider);
    if (!settings) {
      return {
        success: true,
        statusCode: 200,
        message: 'Courier settings not found',
        data: null,
      };
    }
    return {
      success: true,
      statusCode: 200,
      message: 'Courier settings fetched successfully',
      data: new CourierSettingsEntity(settings),
    };
  }

  @Put(':provider')
  @Roles(['super_admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update courier settings' })
  async upsert(
    @Param('provider') provider: string,
    @Body() dto: UpdateCourierSettingsDto,
  ) {
    const settings = await this.courierSettingsService.upsert(provider, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Courier settings saved successfully',
      data: new CourierSettingsEntity(settings!),
    };
  }

  @Get(':provider/status')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Check if courier provider is configured and enabled' })
  async checkStatus(@Param('provider') provider: string) {
    const credentials = await this.courierSettingsService.getCredentials(provider);
    return {
      success: true,
      statusCode: 200,
      message: 'Courier provider status checked',
      data: {
        configured: !!credentials,
        enabled: credentials !== null,
      },
    };
  }
}
