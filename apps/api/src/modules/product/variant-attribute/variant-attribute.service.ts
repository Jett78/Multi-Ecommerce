import { Injectable, NotFoundException } from '@nestjs/common';
import { VariantAttributeRepository } from './variant-attribute.repository';
import { CreateVariantAttributeDto } from './dto/create-variant-attribute.dto';
import { UpdateVariantAttributeDto } from './dto/update-variant-attribute.dto';

@Injectable()
export class VariantAttributeService {
  constructor(
    private readonly repository: VariantAttributeRepository,
  ) {}

  async create(dto: CreateVariantAttributeDto) {
    return this.repository.create(dto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const attribute = await this.repository.findById(id);
    if (!attribute) {
      throw new NotFoundException(`Variant attribute with ID ${id} not found`);
    }
    return attribute;
  }

  async findByVariantId(variantId: string) {
    return this.repository.findByVariantId(variantId);
  }

  async update(id: string, dto: UpdateVariantAttributeDto) {
    await this.findById(id);
    return this.repository.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }

  async deleteByVariantId(variantId: string) {
    return this.repository.deleteByVariantId(variantId);
  }
}
