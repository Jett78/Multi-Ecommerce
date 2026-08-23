import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { DiscountRepository } from './discount.repository';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class DiscountService {
  private readonly logger = new Logger(DiscountService.name);

  constructor(private readonly repository: DiscountRepository) {}

  async create(dto: CreateCouponDto) {
    const existing = await this.repository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Coupon with code "${dto.code}" already exists`);
    }

    const coupon = await this.repository.create({
      code: dto.code,
      type: dto.type,
      value: dto.value,
      minOrderAmount: dto.minOrderAmount,
      maxDiscountAmount: dto.maxDiscountAmount,
      usageLimit: dto.usageLimit,
      perUserLimit: dto.perUserLimit,
      productIds: dto.productIds,
      categoryIds: dto.categoryIds,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      isActive: dto.isActive,
      description: dto.description,
    });

    return coupon;
  }

  async findAll(page?: number, limit?: number, search?: string) {
    return this.repository.findAll(page, limit, search);
  }

  async findActive() {
    return this.repository.findActive();
  }

  async findById(id: string) {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.repository.findByCode(dto.code);
      if (duplicate) {
        throw new ConflictException(`Coupon with code "${dto.code}" already exists`);
      }
    }

    return this.repository.update(id, {
      ...(dto.code !== undefined ? { code: dto.code } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.value !== undefined ? { value: dto.value } : {}),
      ...(dto.minOrderAmount !== undefined ? { minOrderAmount: dto.minOrderAmount } : {}),
      ...(dto.maxDiscountAmount !== undefined ? { maxDiscountAmount: dto.maxDiscountAmount } : {}),
      ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
      ...(dto.perUserLimit !== undefined ? { perUserLimit: dto.perUserLimit } : {}),
      ...(dto.productIds !== undefined ? { productIds: dto.productIds } : {}),
      ...(dto.categoryIds !== undefined ? { categoryIds: dto.categoryIds } : {}),
      ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
      ...(dto.expiresAt !== undefined ? { expiresAt: new Date(dto.expiresAt) } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    });
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Coupon with id "${id}" not found`);
    }
    return this.repository.delete(id);
  }

  async validateCoupon(dto: ValidateCouponDto, userId?: string) {
    const coupon = await this.repository.findByCode(dto.code);
    if (!coupon) {
      return { valid: false, discountAmount: 0, type: 'fixed', code: dto.code, description: '', message: 'Invalid coupon code' };
    }

    if (!coupon.isActive) {
      return { valid: false, discountAmount: 0, type: coupon.type, code: coupon.code, description: coupon.description || '', message: 'This coupon is no longer active' };
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return { valid: false, discountAmount: 0, type: coupon.type, code: coupon.code, description: coupon.description || '', message: 'This coupon is not yet active' };
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      return { valid: false, discountAmount: 0, type: coupon.type, code: coupon.code, description: coupon.description || '', message: 'This coupon has expired' };
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, discountAmount: 0, type: coupon.type, code: coupon.code, description: coupon.description || '', message: 'This coupon has reached its usage limit' };
    }

    if (userId && coupon.perUserLimit !== null) {
      const userUsage = await this.repository.countUserCouponUsage(userId, coupon.id);
      if (userUsage >= coupon.perUserLimit) {
        return { valid: false, discountAmount: 0, type: coupon.type, code: coupon.code, description: coupon.description || '', message: 'You have already used this coupon the maximum number of times' };
      }
    }

    if (coupon.minOrderAmount !== null && dto.subtotal < coupon.minOrderAmount / 100) {
      return { valid: false, discountAmount: 0, type: coupon.type, code: coupon.code, description: coupon.description || '', message: `Minimum order amount is Rs. ${(coupon.minOrderAmount / 100).toLocaleString()}` };
    }

    if (coupon.productIds && coupon.productIds.length > 0) {
      const applicableItems = dto.items.filter(item => coupon.productIds!.includes(item.productId));
      if (applicableItems.length === 0) {
        return { valid: false, discountAmount: 0, type: coupon.type, code: coupon.code, description: coupon.description || '', message: 'This coupon is not applicable to any items in your cart' };
      }
    }

    if (coupon.categoryIds && coupon.categoryIds.length > 0) {
      const applicableItems = dto.items.filter(item => coupon.categoryIds!.includes(item.categoryId));
      if (applicableItems.length === 0) {
        return { valid: false, discountAmount: 0, type: coupon.type, code: coupon.code, description: coupon.description || '', message: 'This coupon is not applicable to any items in your cart' };
      }
    }

    let discountAmount = 0;
    let applicableSubtotal = dto.subtotal;

    if (coupon.productIds && coupon.productIds.length > 0) {
      applicableSubtotal = dto.items
        .filter(item => coupon.productIds!.includes(item.productId))
        .reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);
    } else if (coupon.categoryIds && coupon.categoryIds.length > 0) {
      applicableSubtotal = dto.items
        .filter(item => coupon.categoryIds!.includes(item.categoryId))
        .reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);
    }

    switch (coupon.type) {
      case 'fixed':
        discountAmount = Math.min(coupon.value / 100, applicableSubtotal);
        break;
      case 'percentage':
        discountAmount = Math.floor((applicableSubtotal * coupon.value) / 100);
        if (coupon.maxDiscountAmount !== null) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount / 100);
        }
        break;
      case 'free_shipping':
        discountAmount = 0;
        break;
    }

    return {
      valid: true,
      discountAmount,
      type: coupon.type,
      code: coupon.code,
      description: coupon.description || '',
      message: coupon.type === 'free_shipping'
        ? 'Free shipping applied!'
        : `Discount of Rs. ${discountAmount.toLocaleString()} applied!`,
    };
  }
}
