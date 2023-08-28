import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { UserResponse } from './dto/user-response';
import { UpdateUserDto } from './dto/update-user-dto';
import { JwtPayload } from '@app/common';
import { UploadService } from '../upload/upload.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly redisService: RedisService,
  ) {}

  async isAuthorizedUser(decodedUser: JwtPayload) {
    const user: User = await this.getOne(decodedUser.id);
    if (user.id == decodedUser.id && user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Unauthorized user!');
    }
  }

  deleteUserFields(user: User): void {
    delete user.password;
    delete user.refreshToken;
  }

  async getAll(page: number, size: number): Promise<UserResponse[]> {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        photo: true,
        photoName: true,
        role: true,
        confirmed: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: page ?? 0,
      take: size ?? 0,
    });
  }

  async getOne(userId: number): Promise<User> {
    const user: User = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const cachedUser: User = JSON.parse(
      await this.redisService.get(`user-${user.id}`),
    );

    if (!cachedUser) {
      await this.redisService.set(`user-${user.id}`, JSON.stringify(user));
      return user;
    }

    this.deleteUserFields(cachedUser);

    return cachedUser;
  }

  async update(
    userData: UpdateUserDto,
    userId: number,
    file: Express.Multer.File,
    decodedUser: JwtPayload,
  ): Promise<User> {
    await this.isAuthorizedUser(decodedUser);
    if (file) {
      this.uploadService.upload(file.originalname, file.buffer);
    }
    const updatedUser: User = await this.prisma.user.update({
      where: { id: userId },
      data: { ...userData, photoName: file ? file.originalname : null },
    });
    this.deleteUserFields(updatedUser);
    return updatedUser;
  }

  async delete(userId: number, decodedUser: JwtPayload): Promise<void> {
    await this.isAuthorizedUser(decodedUser);
    const deletedUser: User = await this.prisma.user.delete({
      where: { id: userId },
    });
    this.deleteUserFields(deletedUser);
  }
}
