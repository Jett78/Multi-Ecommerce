import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateVariantAttributeDto } from './create-variant-attribute.dto';

export class UpdateVariantAttributeDto extends PartialType(
  OmitType(CreateVariantAttributeDto, ['variantId'] as const),
) {}
