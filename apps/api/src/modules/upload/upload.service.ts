import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly cloudfrontUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'ap-south-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME', '');
    this.cloudfrontUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL', '');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadResult> {
    const ext = path.extname(file.originalname);
    const key = `${folder}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const url = this.cloudfrontUrl
      ? `https://${this.cloudfrontUrl}/${key}`
      : `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION', 'ap-south-1')}.amazonaws.com/${key}`;

    this.logger.log(`File uploaded: ${key}`);
    return { key, url, bucket: this.bucketName };
  }

  async uploadFromUrl(
    imageUrl: string,
    folder: string = 'uploads',
  ): Promise<UploadResult> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      throw new BadRequestException('Invalid URL provided');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new BadRequestException('Only HTTP/HTTPS URLs are allowed');
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new BadRequestException(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || this.getContentTypeFromUrl(imageUrl);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(`Content type ${contentType} is not allowed`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    const ext = this.getExtensionFromContentType(contentType) || path.extname(parsedUrl.pathname) || '.jpg';
    const key = `${folder}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    const url = this.buildUrl(key);

    this.logger.log(`File uploaded from URL: ${key}`);
    return { key, url, bucket: this.bucketName };
  }

  private getContentTypeFromUrl(url: string): string {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  private getExtensionFromContentType(contentType: string): string | null {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    return extensions[contentType] || null;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`File deleted: ${key}`);
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  private buildUrl(key: string): string {
    return this.cloudfrontUrl
      ? `https://${this.cloudfrontUrl}/${key}`
      : `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION', 'ap-south-1')}.amazonaws.com/${key}`;
  }

  async listFiles(params: {
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
    search?: string;
  }): Promise<{
    items: Array<{ key: string; url: string; size: number; lastModified: Date }>;
    nextContinuationToken?: string;
    isTruncated: boolean;
    totalCount: number;
  }> {
    const { prefix, maxKeys = 50, continuationToken, search } = params;

    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix || undefined,
      MaxKeys: maxKeys + 1,
      ContinuationToken: continuationToken,
    });

    const response = await this.s3Client.send(command);
    let items = (response.Contents || [])
      .filter((item) => item.Key && item.Key !== prefix)
      .map((item) => ({
        key: item.Key!,
        url: this.buildUrl(item.Key!),
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
      }));

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter((item) => item.key.toLowerCase().includes(searchLower));
    }

    const hasMore = items.length > maxKeys;
    const paginatedItems = hasMore ? items.slice(0, maxKeys) : items;

    return {
      items: paginatedItems,
      nextContinuationToken: response.NextContinuationToken,
      isTruncated: hasMore || (response.IsTruncated || false),
      totalCount: paginatedItems.length,
    };
  }

  async listFolders(): Promise<Array<{ name: string; count: number }>> {
    const folderMap = new Map<string, number>();
    let token: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1000,
        ContinuationToken: token,
      });

      const response = await this.s3Client.send(command);

      for (const item of response.Contents || []) {
        if (!item.Key) continue;
        const parts = item.Key.split('/');
        if (parts.length > 1) {
          const folder = parts[0];
          folderMap.set(folder, (folderMap.get(folder) || 0) + 1);
        }
      }

      token = response.NextContinuationToken;
    } while (token);

    return Array.from(folderMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
}
