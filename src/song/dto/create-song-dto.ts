import { SongType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateSongDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  artist: string;

  @IsNotEmpty()
  @IsEnum(SongType)
  type: SongType;

  @IsNotEmpty()
  @IsString()
  language: string;

  @IsNotEmpty()
  rate: number;
}
