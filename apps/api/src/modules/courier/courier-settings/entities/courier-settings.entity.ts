import { ApiProperty } from '@nestjs/swagger';

export class CourierSettingsEntity {
  @ApiProperty() id: string;
  @ApiProperty() provider: string;
  @ApiProperty() name: string;
  @ApiProperty() apiBaseUrl: string;
  @ApiProperty() credentials: string;
  @ApiProperty() config: string | null;
  @ApiProperty() isEnabled: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  constructor(partial: Record<string, any>) {
    Object.assign(this, partial);
    if (partial._decryptedCredentials) {
      this.credentials = partial._decryptedCredentials;
    }
  }
}
