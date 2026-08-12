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
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get cart' })
  async getCart(@Query('sessionId') sessionId?: string) {
    const result = await this.cartService.getCart(undefined, sessionId);
    return {
      success: true,
      statusCode: 200,
      message: 'Cart fetched successfully',
      data: result,
    };
  }

  @AllowAnonymous()
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(@Body() dto: AddToCartDto, @Query('sessionId') sessionId?: string) {
    const result = await this.cartService.addToCart(dto.variantId, dto.quantity, undefined, sessionId);
    return {
      success: true,
      statusCode: 201,
      message: 'Item added to cart',
      data: result,
    };
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateCartItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const result = await this.cartService.updateCartItem(id, dto.quantity);
    return {
      success: true,
      statusCode: 200,
      message: 'Cart item updated',
      data: result,
    };
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeFromCart(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.cartService.removeFromCart(id);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }

  @Delete(':cartId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(@Param('cartId', ParseUUIDPipe) cartId: string) {
    const result = await this.cartService.clearCart(cartId);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }
}
