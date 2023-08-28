import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '@prisma/client';
import { JwtPayload } from '@app/common';
import {PrismaService} from "../../prisma/prisma.service";

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([AtStrategy.extractJWT]),
      secretOrKey: configService.get('ACCESS_TOKEN_SECRET'),
    });
  }

  private static extractJWT(req: Request): string | null {
    if (req.cookies && 'accessToken' in req.cookies) {
      return req.cookies.accessToken;
    }
    return null;
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user: User = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new ForbiddenException('Token is not valid!');
    }

    return payload;
  }
}
