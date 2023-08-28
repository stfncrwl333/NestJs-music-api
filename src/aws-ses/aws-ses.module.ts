import { Global, Module } from '@nestjs/common';
import { AwsSesService } from './aws-ses.service';
import { SesModule } from '@nextnm/nestjs-ses';
import * as process from 'process';

@Global()
@Module({
  imports: [
    SesModule.forRoot({
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      apiKey: process.env.AWS_ACCESS_KEY,
      region: process.env.AWS_REGION,
    }),
  ],
  providers: [AwsSesService],
  exports: [AwsSesService],
})
export class AwsSesModule {}
