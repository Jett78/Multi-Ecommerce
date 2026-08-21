import { Module } from '@nestjs/common';
import { ShippingAddressController } from './shipping-address.controller';
import { ShippingAddressService } from './shipping-address.service';
import { ShippingAddressRepository } from './shipping-address.repository';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [ShippingAddressController],
  providers: [ShippingAddressService, ShippingAddressRepository],
  exports: [ShippingAddressService],
})
export class ShippingAddressModule {}
