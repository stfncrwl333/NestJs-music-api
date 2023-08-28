import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist-dto';
import { Playlist, Role, User } from '@prisma/client';
import { UpdatePlaylistDto } from './dto/update-playlist-dto';
import { JwtPayload } from '@app/common';
import { UserService } from '../user/user.service';
import { PlaylistResponse } from './dto/playlist-response';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PlaylistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async isAuthorizedUser(
    playlistId: number,
    decodedUser: JwtPayload,
  ): Promise<void> {
    const playlist: Playlist = await this.getOne(playlistId);
    const user: User = await this.userService.getOne(decodedUser.id);
    if (playlist.userId !== user.id && user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Unauthorized user!');
    }
  }

  deletePlaylistFields(playlist: Playlist): void {
    delete playlist.userId;
  }

  async getAll(page: number, size: number): Promise<PlaylistResponse[]> {
    return await this.prisma.playlist.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: page * size ?? 0,
      take: size ?? 0,
    });
  }

  async getOne(playlistId: number): Promise<Playlist> {
    const playlist: Playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found!');
    }

    const cachedPlaylist: Playlist = JSON.parse(
      await this.redisService.get(`playlist-${playlist.id}`),
    );

    if (!cachedPlaylist) {
      await this.redisService.set(
        `playlist-${playlist.id}`,
        JSON.stringify(playlist),
      );
      this.deletePlaylistFields(playlist);
      return playlist;
    }

    this.deletePlaylistFields(cachedPlaylist);
    return cachedPlaylist;
  }

  async create(
    playlistData: CreatePlaylistDto,
    user: JwtPayload,
  ): Promise<Playlist> {
    const createdPlaylist: Playlist = await this.prisma.playlist.create({
      data: { ...playlistData, userId: user.id },
    });
    this.deletePlaylistFields(createdPlaylist);
    return createdPlaylist;
  }

  async update(
    playlistData: UpdatePlaylistDto,
    playlistId: number,
    decodedUser: JwtPayload,
  ): Promise<Playlist> {
    await this.isAuthorizedUser(playlistId, decodedUser);
    const updatedPlaylist: Playlist = await this.prisma.playlist.update({
      where: { id: playlistId },
      data: { ...playlistData },
    });
    this.deletePlaylistFields(updatedPlaylist);
    return updatedPlaylist;
  }

  async delete(playlistId: number, decodedUser: JwtPayload): Promise<void> {
    await this.isAuthorizedUser(playlistId, decodedUser);
    await this.prisma.playlist.delete({
      where: { id: playlistId },
    });
  }
}
