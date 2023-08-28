import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateSingerDto } from './dto/create-singer-dto';
import { Role, Singer, SingerAlbum, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UpdateSingerDto } from './dto/update-singer-dto';
import { CreateSingerAlbumDto } from '../singer-album/dto/create-singer-album-dto';
import { JwtPayload } from '@app/common';
import { UserService } from '../user/user.service';
import { SingerResponse } from './dto/singer-response-dto';
import { SingerAlbumService } from '../singer-album/singer-album.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SingerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly userService: UserService,
    private readonly singerAlbumService: SingerAlbumService,
    private readonly redisService: RedisService,
  ) {}

  private deleteSingerFields(singer: Singer): void {
    delete singer.userId;
  }

  async isAuthorizedUser(singerId: number, decodedUser: JwtPayload) {
    const singer: Singer = await this.getOne(singerId);
    const user: User = await this.userService.getOne(decodedUser.id);
    if (singer.userId !== user.id && user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Unauthorized user!');
    }
  }

  async getAll(page: number, size: number): Promise<SingerResponse[]> {
    return await this.prisma.singer.findMany({
      select: {
        id: true,
        name: true,
        info: true,
        type: true,
        photoName: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: page * size ?? 0,
      take: size ?? 0,
    });
  }

  async getOne(singerId: number): Promise<Singer> {
    const singer: Singer = await this.prisma.singer.findUnique({
      where: { id: singerId },
    });

    if (!singer) {
      throw new NotFoundException('Singer not found!');
    }

    const cachedSinger: Singer = JSON.parse(
      await this.redisService.get(`singer-${singer.id}`),
    );

    if (!cachedSinger) {
      await this.redisService.set(
        `singer-${singer.id}`,
        JSON.stringify(singer),
      );
      this.deleteSingerFields(singer);
      return singer;
    }

    this.deleteSingerFields(cachedSinger);
    return cachedSinger;
  }

  async create(
    singerData: CreateSingerDto,
    file: Express.Multer.File,
    decodedUser: JwtPayload,
  ): Promise<Singer> {
    if (file) {
      await this.uploadService.upload(file.originalname, file.buffer);
    }
    const createdSinger: Singer = await this.prisma.singer.create({
      data: {
        ...singerData,
        userId: decodedUser.id,
        photoName: file ? file.originalname : null,
      },
    });
    this.deleteSingerFields(createdSinger);
    return createdSinger;
  }

  async update(
    singerData: UpdateSingerDto,
    singerId: number,
    file: Express.Multer.File,
    decodedUser: JwtPayload,
  ): Promise<Singer> {
    await this.isAuthorizedUser(singerId, decodedUser);

    if (file) {
      await this.uploadService.upload(file.originalname, file.buffer);
    }

    const updatedSinger: Singer = await this.prisma.singer.update({
      where: { id: singerId },
      data: {
        ...singerData,
        photoName: file ? file.originalname : null,
      },
    });

    this.deleteSingerFields(updatedSinger);

    return updatedSinger;
  }

  async createSingerAlbum(
    singerAlbumData: CreateSingerAlbumDto,
    singerId: number,
    file: Express.Multer.File,
    decodedUser: JwtPayload,
  ): Promise<SingerAlbum> {
    await this.getOne(singerId);
    if (file) {
      await this.uploadService.upload(file.originalname, file.buffer);
    }
    const createdSingerAlbum: SingerAlbum =
      await this.prisma.singerAlbum.create({
        data: {
          ...singerAlbumData,
          userId: decodedUser.id,
          photoName: file ? file.originalname : null,
        },
      });

    this.singerAlbumService.deleteSingerAlbumField(createdSingerAlbum);

    return createdSingerAlbum;
  }

  async delete(singerId: number, decodedUser: JwtPayload): Promise<void> {
    await this.isAuthorizedUser(singerId, decodedUser);
    await this.prisma.singer.delete({
      where: { id: singerId },
    });
  }
}
