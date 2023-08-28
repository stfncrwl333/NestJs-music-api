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
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dto/create-playlist-dto';
import { Playlist, Role } from '@prisma/client';
import { AtGuard } from '../auth/guard/at.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { UpdatePlaylistDto } from './dto/update-playlist-dto';
import { UserDecorator } from '../auth/decorator/user.decorator';
import { JwtPayload } from '@app/common';
import { PlaylistResponse } from './dto/playlist-response';

@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getAll(
    @Query('page', new ParseIntPipe()) page: number,
    @Query('size', new ParseIntPipe()) size: number,
  ): Promise<PlaylistResponse[]> {
    return this.playlistService.getAll(page, size);
  }

  @UseGuards(AtGuard)
  @Get(':songId')
  async getOne(
    @Param('songId', new ParseIntPipe()) songId: number,
  ): Promise<Playlist> {
    return this.playlistService.getOne(songId);
  }

  @UseGuards(AtGuard)
  @Post()
  async create(
    @Body() playlistData: CreatePlaylistDto,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<Playlist> {
    return this.playlistService.create(playlistData, decodedUser);
  }

  @UseGuards(AtGuard)
  @Put(':playlistId')
  async update(
    @Body() playlistData: UpdatePlaylistDto,
    @Param('playlistId', new ParseIntPipe()) playlistId: number,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<Playlist> {
    return this.playlistService.update(playlistData, playlistId, decodedUser);
  }

  @UseGuards(AtGuard)
  @Delete(':playlistId')
  @HttpCode(204)
  async delete(
    @Param('playlistId', new ParseIntPipe()) playlistId: number,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<void> {
    return this.playlistService.delete(playlistId, decodedUser);
  }
}
