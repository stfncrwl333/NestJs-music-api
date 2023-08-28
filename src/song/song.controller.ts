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
import { SongService } from './song.service';
import { AtGuard } from '../auth/guard/at.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role, Song, SongsOnPlaylists } from '@prisma/client';
import { SongResponse } from './dto/song-response';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateSongDto } from './dto/update-song-dto';
import { UserDecorator } from '../auth/decorator/user.decorator';
import { JwtPayload } from '@app/common';

@Controller('songs')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getAll(
    @Query('page', new ParseIntPipe()) page: number,
    @Query('size', new ParseIntPipe()) size: number,
  ): Promise<SongResponse[]> {
    return this.songService.getAll(page, size);
  }

  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AtGuard)
  @Get(':songId')
  async getOne(
    @Param('songId', new ParseIntPipe()) songId: number,
  ): Promise<Song> {
    return this.songService.getOne(songId);
  }

  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AtGuard)
  @Put(':songId')
  async update(
    @Param('songId', new ParseIntPipe()) songId: number,
    @Body() songData: UpdateSongDto,
    @UploadedFile() file: Express.Multer.File,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<Song> {
    return this.songService.update(songId, songData, file, decodedUser);
  }

  @UseGuards(AtGuard)
  @Post(':songId/playlists/:playlistId')
  async pushSongToPlaylist(
    @Param('songId', new ParseIntPipe()) songId: number,
    @Param('playlistId', new ParseIntPipe()) playlistId: number,
  ): Promise<SongsOnPlaylists> {
    return this.songService.pushSongToPlaylist(songId, playlistId);
  }

  @UseGuards(AtGuard)
  @Delete(':songId')
  @HttpCode(204)
  async delete(
    @Param('songId', new ParseIntPipe()) songId: number,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<void> {
    return this.songService.delete(songId, decodedUser);
  }
}
