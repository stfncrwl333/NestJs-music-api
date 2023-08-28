import { Injectable } from '@nestjs/common';
import { SesService } from '@nextnm/nestjs-ses';
import { SesEmailOptions } from '@nextnm/nestjs-ses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSesService {
  constructor(
    private readonly sesService: SesService,
    private readonly config: ConfigService,
  ) {}

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const options: SesEmailOptions = {
      from: this.config.getOrThrow('AWS_SES_EMAIL'),
      to,
      subject,
      html,
    };
    await this.sesService.sendEmail(options);
  }
}
