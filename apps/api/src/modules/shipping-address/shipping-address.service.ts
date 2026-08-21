import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ShippingAddressRepository } from './shipping-address.repository';
import { ShippingAddressEntity } from './entities/shipping-address.entity';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';

@Injectable()
export class ShippingAddressService {
  constructor(private readonly repository: ShippingAddressRepository) {}

  private toEntity(row: any): ShippingAddressEntity {
    return new ShippingAddressEntity({
      id: row.id,
      userId: row.userId,
      type: row.type,
      label: row.label,
      provinceId: row.provinceId,
      provinceName: row.provinceName,
      district: row.district,
      municipality: row.municipality,
      landmark: row.landmark,
      streetAddress: row.streetAddress,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(userId: string, dto: CreateShippingAddressDto) {
    const existing = await this.repository.findAllByUser(userId);
    const shouldBeDefault = dto.isDefault === true || existing.length === 0;

    if (shouldBeDefault) {
      await this.repository.setAllNonDefault(userId);
    }

    const row = await this.repository.create({
      userId,
      type: dto.type ?? 'home',
      label: dto.label,
      provinceId: dto.provinceId,
      provinceName: dto.provinceName,
      district: dto.district,
      municipality: dto.municipality,
      landmark: dto.landmark,
      streetAddress: dto.streetAddress,
      isDefault: shouldBeDefault,
    });

    return this.toEntity(row);
  }

  async findAll(userId: string) {
    const rows = await this.repository.findAllByUser(userId);
    return rows.map((r) => this.toEntity(r));
  }

  private async getOwned(id: string, userId: string) {
    const row = await this.repository.findById(id);
    if (!row || row.userId !== userId) {
      throw new NotFoundException('Shipping address not found');
    }
    return row;
  }

  async update(id: string, userId: string, dto: UpdateShippingAddressDto) {
    await this.getOwned(id, userId);

    if (dto.isDefault === true) {
      await this.repository.setAllNonDefault(userId);
    }

    const row = await this.repository.update(id, {
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.label !== undefined ? { label: dto.label } : {}),
      ...(dto.provinceId !== undefined ? { provinceId: dto.provinceId } : {}),
      ...(dto.provinceName !== undefined ? { provinceName: dto.provinceName } : {}),
      ...(dto.district !== undefined ? { district: dto.district } : {}),
      ...(dto.municipality !== undefined ? { municipality: dto.municipality } : {}),
      ...(dto.landmark !== undefined ? { landmark: dto.landmark } : {}),
      ...(dto.streetAddress !== undefined ? { streetAddress: dto.streetAddress } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
    });

    return this.toEntity(row);
  }

  async remove(id: string, userId: string) {
    const row = await this.getOwned(id, userId);
    await this.repository.delete(id);

    // If the deleted address was the default, promote another one
    if (row.isDefault) {
      const remaining = await this.repository.findAllByUser(userId);
      if (remaining.length > 0) {
        await this.repository.update(remaining[0].id, { isDefault: true });
      }
    }

    return { success: true, message: 'Address deleted successfully' };
  }

  async setDefault(id: string, userId: string) {
    await this.getOwned(id, userId);
    await this.repository.setAllNonDefault(userId);
    const row = await this.repository.update(id, { isDefault: true });
    return this.toEntity(row);
  }
}
