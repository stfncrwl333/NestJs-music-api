import { IsNotEmpty, IsString } from 'class-validator';

export class GetFileDto {
  @IsNotEmpty()
  @IsString()
  fileName: string;
}
