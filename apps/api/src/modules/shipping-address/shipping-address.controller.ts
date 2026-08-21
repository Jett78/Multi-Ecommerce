import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AllowAnonymous, Session as BetterSession, UserSession } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ShippingAddressService } from './shipping-address.service';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { ShippingAddressEntity } from './entities/shipping-address.entity';

@ApiTags('shipping-addresses')
@Controller('shipping-addresses')
export class ShippingAddressController {
  constructor(private readonly service: ShippingAddressService) {}

  private getUserId(session: UserSession | undefined): string {
    const userId = session?.user?.id;
    if (!userId) {
      throw new UnauthorizedException('You must be logged in to manage addresses');
    }
    return userId;
  }

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'List the current user shipping addresses' })
  @ApiResponse({ status: 200, type: [ShippingAddressEntity] })
  async findAll(@BetterSession() session: UserSession) {
    const userId = this.getUserId(session);
    const data = await this.service.findAll(userId);
    return {
      success: true,
      statusCode: 200,
      message: 'Shipping addresses fetched successfully',
      data,
    };
  }

  @Post()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Create a shipping address' })
  @ApiResponse({ status: 201, type: ShippingAddressEntity })
  async create(@BetterSession() session: UserSession, @Body() dto: CreateShippingAddressDto) {
    const userId = this.getUserId(session);
    const data = await this.service.create(userId, dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Shipping address created successfully',
      data,
    };
  }

  @Put(':id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Update a shipping address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, type: ShippingAddressEntity })
  async update(
    @BetterSession() session: UserSession,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingAddressDto,
  ) {
    const userId = this.getUserId(session);
    const data = await this.service.update(id, userId, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Shipping address updated successfully',
      data,
    };
  }

  @Patch(':id/default')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Set a shipping address as default' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, type: ShippingAddressEntity })
  async setDefault(@BetterSession() session: UserSession, @Param('id', ParseUUIDPipe) id: string) {
    const userId = this.getUserId(session);
    const data = await this.service.setDefault(id, userId);
    return {
      success: true,
      statusCode: 200,
      message: 'Default shipping address updated',
      data,
    };
  }

  @Delete(':id')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a shipping address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  async remove(@BetterSession() session: UserSession, @Param('id', ParseUUIDPipe) id: string) {
    const userId = this.getUserId(session);
    const result = await this.service.remove(id, userId);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }
}
