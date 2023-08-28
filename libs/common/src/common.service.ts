import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { hash, verify } from 'argon2';
import { CreateSignupDto } from '../../../src/auth/dto/create-signup-dto';

export interface JwtPayload {
  id: number;
  role: Role;
  exp: number;
}

@Injectable()
export class CommonService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async verifyAdmin(signupData: CreateSignupDto, role: Role): Promise<void> {
    if (role == Role.ADMIN) {
      if (!signupData.productKey) {
        throw new ForbiddenException('Provide product key!');
      }

      const productKey: string = `${
        signupData.email
      }-${role}-${this.config.getOrThrow('PRODUCT_KEY_SECRET')}`;

      const isValidProductKey: boolean = await verify(
        signupData.productKey,
        productKey,
      );

      if (!isValidProductKey) {
        throw new ForbiddenException('Product key is not valid!');
      }
    }
    delete signupData.productKey;
  }

  async generateAccessToken(id: number, role: Role): Promise<string> {
    return await this.jwt.signAsync(
      { id, role },
      {
        secret: this.config.getOrThrow('ACCESS_TOKEN_SECRET'),
        expiresIn: 60 * 60 * 24 * 7,
      },
    );
  }

  async generateRefreshToken(id: number, role: Role): Promise<string> {
    return await this.jwt.signAsync(
      { id, role },
      {
        secret: this.config.getOrThrow('REFRESH_TOKEN_SECRET'),
        expiresIn: 60 * 60 * 24 * 7,
      },
    );
  }

  async signCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken: string = await hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}
