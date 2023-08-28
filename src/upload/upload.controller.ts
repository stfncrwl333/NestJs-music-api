import { Body, Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';
import { GetFileDto } from './dto/get-file-dto';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('presigned-url')
  async getPresignedUrl(@Body('fileName') fileName: string) {
    return this.uploadService.getPresignedUrl(fileName);
  }
}
