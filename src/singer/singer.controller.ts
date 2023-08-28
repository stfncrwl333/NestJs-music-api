import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SingerService } from './singer.service';
import { Role, Singer, SingerAlbum } from '@prisma/client';
import { CreateSingerDto } from './dto/create-singer-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateSingerDto } from './dto/update-singer-dto';
import { AtGuard } from '../auth/guard/at.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CreateSingerAlbumDto } from '../singer-album/dto/create-singer-album-dto';
import { UserDecorator } from '../auth/decorator/user.decorator';
import { JwtPayload } from '@app/common';
import { SingerResponse } from './dto/singer-response-dto';

@Controller('singers')
export class SingerController {
  constructor(private readonly singerService: SingerService) {}

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getAll(
    @Query('page', new ParseIntPipe()) page: number,
    @Query('size', new ParseIntPipe()) size: number,
  ): Promise<SingerResponse[]> {
    return this.singerService.getAll(page, size);
  }

  @UseGuards(AtGuard)
  @Get(':singerId')
  async getOne(
    @Param('singerId', new ParseIntPipe()) singerId: number,
  ): Promise<Singer> {
    return this.singerService.getOne(singerId);
  }

  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AtGuard)
  @Post()
  async create(
    @Body() singerData: CreateSingerDto,
    @UploadedFile() file: Express.Multer.File,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<Singer> {
    return this.singerService.create(singerData, file, decodedUser);
  }

  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AtGuard)
  @Put(':singerId')
  async update(
    @Body() singerData: UpdateSingerDto,
    @Param('singerId', new ParseIntPipe()) singerId: number,
    @UploadedFile() file: Express.Multer.File,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<Singer> {
    return this.singerService.update(singerData, singerId, file, decodedUser);
  }

  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AtGuard)
  @Post(':singerId/singer-albums')
  async createSingerAlbum(
    @Body() singerAlbumData: CreateSingerAlbumDto,
    @Param('singerId', new ParseIntPipe()) singerId: number,
    @UploadedFile() file: Express.Multer.File,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<SingerAlbum> {
    return this.singerService.createSingerAlbum(
      singerAlbumData,
      singerId,
      file,
      decodedUser,
    );
  }

  @UseGuards(AtGuard)
  @Delete(':singerId')
  @HttpCode(204)
  async delete(
    @Param('singerId', new ParseIntPipe()) singerId: number,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<void> {
    return this.singerService.delete(singerId, decodedUser);
  }
}
