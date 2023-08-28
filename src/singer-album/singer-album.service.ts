import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, SingerAlbum, Song, User } from '@prisma/client';
import { SingerAlbumResponse } from './dto/singer-album-response';
import { UpdateSingerAlbumDto } from './dto/update-singer-album-dto';
import { UploadService } from '../upload/upload.service';
import { CreateSongDto } from '../song/dto/create-song-dto';
import { SongService } from '../song/song.service';
import { JwtPayload } from '@app/common';
import { UserService } from '../user/user.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SingerAlbumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly songService: SongService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async isAuthorizedUser(singerAlbumId: number, decodedUser: JwtPayload) {
    const singerAlbum: SingerAlbum = await this.getOne(singerAlbumId);
    const user: User = await this.userService.getOne(decodedUser.id);
    if (singerAlbum.userId !== user.id && user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Unauthorized User!');
    }
  }

  public deleteSingerAlbumField(singerAlbum: SingerAlbum): void {
    delete singerAlbum.singerId;
    delete singerAlbum.userId;
  }

  async getAll(page: number, size: number): Promise<SingerAlbumResponse[]> {
    return await this.prisma.singerAlbum.findMany({
      select: {
        id: true,
        name: true,
        photoName: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: page ?? 0,
      take: size ?? 0,
    });
  }

  async getOne(singerAlbumId: number): Promise<SingerAlbum> {
    const singerAlbum: SingerAlbum = await this.prisma.singerAlbum.findUnique({
      where: { id: singerAlbumId },
    });
    if (!singerAlbum) {
      throw new NotFoundException('Singer album not found!');
    }
    const cachedSingerAlbum: SingerAlbum = JSON.parse(
      await this.redisService.get(`singer-album-${singerAlbum.id}`),
    );

    if (!cachedSingerAlbum) {
      await this.redisService.set(
        `singer-album-${singerAlbum.id}`,
        JSON.stringify(singerAlbum),
      );
      this.deleteSingerAlbumField(singerAlbum);
      return singerAlbum;
    }

    this.deleteSingerAlbumField(cachedSingerAlbum);
    return cachedSingerAlbum;
  }

  async update(
    singerAlbumData: UpdateSingerAlbumDto,
    singerAlbumId: number,
    file: Express.Multer.File,
    decodedUser: JwtPayload,
  ): Promise<SingerAlbum> {
    await this.isAuthorizedUser(singerAlbumId, decodedUser);
    if (file) {
      await this.uploadService.upload(file.originalname, file.buffer);
    }
    const updatedSingerAlbum: SingerAlbum =
      await this.prisma.singerAlbum.update({
        where: { id: singerAlbumId },
        data: {
          ...singerAlbumData,
          photoName: file ? file.originalname : null,
        },
      });
    this.deleteSingerAlbumField(updatedSingerAlbum);
    return updatedSingerAlbum;
  }

  async createSong(
    songData: CreateSongDto,
    singerAlbumId: number,
    file: Express.Multer.File,
    decodedUser: JwtPayload,
  ): Promise<Song> {
    await this.getOne(singerAlbumId);
    if (file) {
      await this.uploadService.upload(file.originalname, file.buffer);
    }

    const song: Song = await this.prisma.song.create({
      data: {
        ...songData,
        rate: +songData.rate,
        singerAlbumId,
        photoName: file ? file.originalname : null,
        userId: decodedUser.id,
      },
    });
    this.songService.deleteSongFields(song);
    return song;
  }

  async delete(singerAlbumId: number, decodedUser: JwtPayload): Promise<void> {
    await this.isAuthorizedUser(singerAlbumId, decodedUser);
    await this.prisma.singerAlbum.delete({
      where: { id: singerAlbumId },
    });
  }
}
