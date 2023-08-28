import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Role, User } from '@prisma/client';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserResponse } from './dto/user-response';
import { AtGuard } from '../auth/guard/at.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserDecorator } from '../auth/decorator/user.decorator';
import { JwtPayload } from '@app/common';
import { UpdateUserDto } from './dto/update-user-dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RoleGuard)
  @Roles(Role.ADMIN)
  async getAll(
    @Query('page', new ParseIntPipe()) page: number,
    @Query('size', new ParseIntPipe()) size: number,
  ): Promise<UserResponse[]> {
    return this.userService.getAll(page, size);
  }

  @Get(':userId')
  @UseGuards(AtGuard)
  async getOne(
    @Param('userId', new ParseIntPipe()) userId: number,
  ): Promise<User> {
    return this.userService.getOne(userId);
  }

  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AtGuard)
  @Put(':userId')
  async update(
    @Body() userData: UpdateUserDto,
    @Param('userId', new ParseIntPipe()) userId: number,
    @UploadedFile() file: Express.Multer.File,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<User> {
    return this.userService.update(userData, userId, file, decodedUser);
  }

  @UseGuards(AtGuard)
  @Delete(':userId')
  @HttpCode(204)
  async delete(
    @Param('userId', new ParseIntPipe()) userId: number,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<void> {
    return this.userService.delete(userId, decodedUser);
  }
}
