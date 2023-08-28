import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Song, SongsOnPlaylists, User } from '@prisma/client';
import { SongResponse } from './dto/song-response';
import { UpdateSongDto } from './dto/update-song-dto';
import { UploadService } from '../upload/upload.service';
import { JwtPayload } from '@app/common';
import { UserService } from '../user/user.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async isAuthorizedUser(songId: number, decodedUser: JwtPayload) {
    const song: Song = await this.getOne(songId);
    const user: User = await this.userService.getOne(decodedUser.id);
    if (song.userId !== user.id && user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Unauthorized user!');
    }
  }

  public deleteSongFields(song: Song): void {
    delete song.singerAlbumId;
    delete song.userId;
  }

  async getAll(page: number, size: number): Promise<SongResponse[]> {
    const songs: SongResponse[] = await this.prisma.song.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        artist: true,
        type: true,
        language: true,
        rate: true,
        photoName: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: page * size ?? 0,
      take: size ?? 0,
    });

    return songs;
  }

  async getOne(songId: number): Promise<Song> {
    const song: Song = await this.prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      throw new NotFoundException('Song not found!');
    }

    const cachedSong: Song = JSON.parse(
      await this.redisService.get(`song-${song.id}`),
    );

    if (!cachedSong) {
      await this.redisService.set(`song-${song.id}`, JSON.stringify(song));
      this.deleteSongFields(song);
      return song;
    }

    this.deleteSongFields(cachedSong);
    return cachedSong;
  }

  async update(
    songId: number,
    songData: UpdateSongDto,
    file: Express.Multer.File,
    decodedUser: JwtPayload,
  ): Promise<Song> {
    if (file) {
      await this.uploadService.upload(file.originalname, file.buffer);
    }
    await this.getOne(songId);
    await this.isAuthorizedUser(songId, decodedUser);
    const song: Song = await this.prisma.song.update({
      where: { id: songId },
      data: {
        ...songData,
        photoName: file ? file.originalname : null,
      },
    });
    this.deleteSongFields(song);
    return song;
  }

  async pushSongToPlaylist(
    songId: number,
    playlistId: number,
  ): Promise<SongsOnPlaylists> {
    await this.getOne(songId);
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) {
      throw new NotFoundException('Playlist not found!');
    }
    return await this.prisma.songsOnPlaylists.create({
      data: {
        playlistId,
        songId,
      },
    });
  }

  async delete(songId: number, decodedUser: JwtPayload): Promise<void> {
    await this.isAuthorizedUser(songId, decodedUser);
    await this.prisma.song.delete({
      where: { id: songId },
    });
  }
}
