import {
  Controller,
  Post,
  Delete,
  Get,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@thallesp/nestjs-better-auth';
import { UploadService } from './upload.service';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('list')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'List files in S3 bucket' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Folder prefix filter' })
  @ApiQuery({ name: 'maxKeys', required: false, description: 'Max items per page' })
  @ApiQuery({ name: 'continuationToken', required: false, description: 'Pagination token' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by key name' })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  async listFiles(
    @Query('prefix') prefix?: string,
    @Query('maxKeys') maxKeys?: string,
    @Query('continuationToken') continuationToken?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.uploadService.listFiles({
      prefix,
      maxKeys: maxKeys ? parseInt(maxKeys, 10) : 50,
      continuationToken,
      search,
    });
    return {
      success: true,
      statusCode: 200,
      message: 'Files listed successfully',
      data: result.items,
      nextContinuationToken: result.nextContinuationToken,
      isTruncated: result.isTruncated,
      totalCount: result.totalCount,
    };
  }

  @Get('folders')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'List folders in S3 bucket' })
  @ApiResponse({ status: 200, description: 'Folders listed successfully' })
  async listFolders() {
    const folders = await this.uploadService.listFolders();
    return {
      success: true,
      statusCode: 200,
      message: 'Folders listed successfully',
      data: folders,
    };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'application/pdf',
          'video/mp4',
          'video/webm',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('File type not allowed'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'blogs', description: 'Upload folder' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadFile(file, folder || 'uploads');
    return {
      success: true,
      statusCode: 201,
      message: 'File uploaded successfully',
      data: result,
    };
  }

  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('File type not allowed'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload multiple files to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        folder: { type: 'string', example: 'services', description: 'Upload folder' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await Promise.all(
      files.map(file => this.uploadService.uploadFile(file, folder || 'uploads'))
    );

    return {
      success: true,
      statusCode: 201,
      message: 'Files uploaded successfully',
      data: results,
    };
  }

  @Delete(':key')
  @Roles(['super_admin'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file from S3' })
  @ApiParam({ name: 'key', description: 'File key (URL-encoded)' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFile(@Param('key') key: string) {
    const decodedKey = decodeURIComponent(key);
    await this.uploadService.deleteFile(decodedKey);
    return {
      success: true,
      statusCode: 200,
      message: 'File deleted successfully',
    };
  }

  @Get('signed-url')
  @Roles(['super_admin'])
  @ApiOperation({ summary: 'Get a signed upload URL' })
  @ApiQuery({ name: 'key', description: 'File key' })
  @ApiQuery({ name: 'contentType', description: 'MIME type' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  async getSignedUploadUrl(
    @Query('key') key: string,
    @Query('contentType') contentType: string,
  ) {
    const url = await this.uploadService.getSignedUploadUrl(key, contentType);
    return {
      success: true,
      statusCode: 200,
      message: 'Signed URL generated',
      data: { url, key },
    };
  }
}
