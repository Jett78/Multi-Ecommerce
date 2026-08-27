import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DB_CONNECTION } from '../../../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { UpdateCourierSettingsDto } from './dto/update-courier-settings.dto';
import { encrypt, decrypt, isEncrypted } from '../../../common/utils/encryption';

@Injectable()
export class CourierSettingsService {
  private readonly logger = new Logger(CourierSettingsService.name);

  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select()
      .from(schema.courierSettings);
  }

  async findByProvider(provider: string) {
    const [settings] = await this.db
      .select()
      .from(schema.courierSettings)
      .where(eq(schema.courierSettings.provider, provider))
      .limit(1);

    if (!settings) return null;

    const decryptedCredentials = isEncrypted(settings.credentials)
      ? decrypt(settings.credentials)
      : settings.credentials;

    return {
      ...settings,
      _decryptedCredentials: decryptedCredentials,
    };
  }

  async getCredentials(provider: string) {
    const settings = await this.findByProvider(provider);
    if (!settings || !settings.isEnabled) {
      return null;
    }

    return {
      credentials: JSON.parse(settings._decryptedCredentials),
      config: settings.config ? JSON.parse(settings.config) : {},
      apiBaseUrl: settings.apiBaseUrl,
    };
  }

  async isEnabled(provider: string): Promise<boolean> {
    const settings = await this.findByProvider(provider);
    return settings?.isEnabled ?? false;
  }

  async upsert(provider: string, dto: UpdateCourierSettingsDto) {
    const existing = await this.findByProvider(provider);
    const encryptedCredentials = encrypt(dto.credentials);

    if (existing) {
      await this.db
        .update(schema.courierSettings)
        .set({
          name: dto.name,
          apiBaseUrl: dto.apiBaseUrl,
          credentials: encryptedCredentials,
          config: dto.config || null,
          isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : existing.isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(schema.courierSettings.id, existing.id));
    } else {
      await this.db.insert(schema.courierSettings).values({
        provider,
        name: dto.name,
        apiBaseUrl: dto.apiBaseUrl,
        credentials: encryptedCredentials,
        config: dto.config || null,
        isEnabled: dto.isEnabled || false,
      });
    }

    return this.findByProvider(provider);
  }
}
