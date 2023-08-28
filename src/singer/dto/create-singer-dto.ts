import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SingerType } from '@prisma/client';

export class CreateSingerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  info: string;

  @IsNotEmpty()
  @IsEnum(SingerType)
  type: SingerType;
}
