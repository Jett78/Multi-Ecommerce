import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { ProductRepository } from '../product/product.repository';
import { VariantRepository } from '../product/variant.repository';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly variantRepository: VariantRepository,
  ) {}

  async getCart(userId?: string, sessionId?: string) {
    try {
      const cart = await this.cartRepository.findOrCreateCart(userId, sessionId);
      const items = await this.cartRepository.findCartItems(cart.id);
      const total = await this.cartRepository.getCartTotal(cart.id);

      return {
        cart,
        items: items,
        subtotal: total.subtotal,
        itemCount: total.itemCount,
      };
    } catch (error) {
      this.logger.error(`Failed to get cart: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCartCount(userId?: string, sessionId?: string) {
    try {
      const cart = await this.cartRepository.findOrCreateCart(userId, sessionId);
      const total = await this.cartRepository.getCartTotal(cart.id);
      return { itemCount: total.itemCount };
    } catch (error) {
      this.logger.error(`Failed to get cart count: ${error.message}`, error.stack);
      throw error;
    }
  }

  async addToCart(variantId: string, quantity: number, userId?: string, sessionId?: string) {
    try {
      const variant = await this.variantRepository.findVariantById(variantId);
      if (!variant) {
        throw new NotFoundException(`Variant with id "${variantId}" not found`);
      }

      if (!variant.allowBackorder && variant.stockQuantity < quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${variant.stockQuantity}`);
      }

      const cart = await this.cartRepository.findOrCreateCart(userId, sessionId);
      const item = await this.cartRepository.addCartItem(cart.id, variantId, quantity, variant.price);

      const items = await this.cartRepository.findCartItems(cart.id);
      const total = await this.cartRepository.getCartTotal(cart.id);

      return {
        cart,
        items,
        subtotal: total.subtotal,
        itemCount: total.itemCount,
      };
    } catch (error) {
      this.logger.error(`Failed to add to cart: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateCartItem(cartItemId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        await this.cartRepository.deleteCartItem(cartItemId);
        return { message: 'Item removed from cart' };
      }

      const item = await this.cartRepository.updateCartItem(cartItemId, quantity);
      return item;
    } catch (error) {
      this.logger.error(`Failed to update cart item: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeFromCart(cartItemId: string) {
    try {
      await this.cartRepository.deleteCartItem(cartItemId);
      return { message: 'Item removed from cart' };
    } catch (error) {
      this.logger.error(`Failed to remove from cart: ${error.message}`, error.stack);
      throw error;
    }
  }

  async clearCart(cartId: string) {
    try {
      await this.cartRepository.clearCart(cartId);
      return { message: 'Cart cleared successfully' };
    } catch (error) {
      this.logger.error(`Failed to clear cart: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteCart(cartId: string) {
    try {
      await this.cartRepository.deleteCart(cartId);
      return { message: 'Cart deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete cart: ${error.message}`, error.stack);
      throw error;
    }
  }
}
