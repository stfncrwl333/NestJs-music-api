import { ForbiddenException, Injectable, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSignupDto } from './dto/create-signup-dto';
import { Role, User } from '@prisma/client';
import { hash, verify } from 'argon2';
import { CommonService, JwtPayload } from '@app/common';
import { Response, Request } from 'express';
import { CreateProductKeyDto } from './dto/create-product-key-dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateLoginDto } from './dto/create-login-dto';
import { AwsSesService } from '../aws-ses/aws-ses.service';
import { UploadService } from '../upload/upload.service';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly commonService: CommonService,
    private readonly awsSesService: AwsSesService,
    private readonly uploadService: UploadService,
  ) {}

  deleteAuthFields(signupData: { password: any; refreshToken: any }): void {
    delete signupData.password;
    delete signupData.refreshToken;
  }

  @Post('product-key')
  async generateProductKey(
    productKeyData: CreateProductKeyDto,
  ): Promise<string> {
    const { email, role } = productKeyData;

    const productKey: string = `${email}-${role}-${this.config.getOrThrow(
      'PRODUCT_KEY_SECRET',
    )}`;

    return await hash(productKey);
  }

  async signup(
    response: Response,
    role: Role,
    signupData: CreateSignupDto,
    file: Express.Multer.File,
  ): Promise<User> {
    const { email, password } = signupData;

    const user: User = await this.prisma.user.findUnique({
      where: { email },
    });

    await this.commonService.verifyAdmin(signupData, role);

    if (user) {
      throw new ForbiddenException('Email already taken!');
    }

    const hashedPassword: string = await hash(password);

    if (file) {
      await this.uploadService.upload(file.originalname, file.buffer);
    }

    const createdUser: User = await this.prisma.user.create({
      data: {
        ...signupData,
        password: hashedPassword,
        email: email.toLowerCase(),
        photoName: file ? file.originalname : null,
        role,
      },
    });

    const accessToken: string = await this.commonService.generateAccessToken(
      createdUser.id,
      role,
    );

    const refreshToken: string = await this.commonService.generateRefreshToken(
      createdUser.id,
      role,
    );

    await this.commonService.signCookies(response, accessToken, refreshToken);

    this.deleteAuthFields(createdUser);

    response.json(createdUser);

    const subject: string = 'Confirm your email!';
    const link: string = `http://localhost:3000/auth/confirm/${accessToken}`;

    await this.awsSesService.sendEmail(createdUser.email, subject, link);
    await this.commonService.updateRefreshToken(createdUser.id, refreshToken)

    return createdUser;
  }

  async resendConfirmation(request: Request): Promise<string> {
    const accessTokenCookie = request.cookies.accessToken;

    const decodedUser: JwtPayload = this.jwt.decode(
      accessTokenCookie,
    ) as JwtPayload;

    const user: User = await this.prisma.user.findUnique({
      where: { id: decodedUser.id },
    });

    if (!user) {
      throw new ForbiddenException('Token is not valid');
    }

    const accessToken: string = await this.commonService.generateAccessToken(
      user.id,
      user.role,
    );

    const subject: string = 'Confirm your email!';

    const link: string = `http://localhost:3000/auth/confirm/${accessToken}`;

    await this.awsSesService.sendEmail(user.email, subject, link);

    return 'Resend confirmation email successfully!';
  }

  async confirmEmail(token: string): Promise<User> {
    const decodedUser = this.jwt.decode(token) as JwtPayload;

    if (Date.now() >= decodedUser.exp * 1000) {
      throw new ForbiddenException('Token is expired!');
    }

    const user: User = await this.prisma.user.findUnique({
      where: { id: decodedUser.id },
    });

    if (!user) {
      throw new ForbiddenException('Token is not valid!');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { confirmed: true },
    });

    this.deleteAuthFields(updatedUser);

    return updatedUser;
  }

  async login(response: Response, loginData: CreateLoginDto): Promise<User> {
    const { email, password } = loginData;

    const user: User = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ForbiddenException('Email not found!');
    }



    const validPassword: boolean = await verify(user.password, password);

    if (!validPassword) {
      throw new ForbiddenException('Password is not valid!');
    }

    const accessToken: string = await this.commonService.generateAccessToken(
      user.id,
      user.role,
    );

    const refreshToken: string = await this.commonService.generateRefreshToken(
      user.id,
      user.role,
    );

    await this.commonService.signCookies(response, accessToken, refreshToken);
    await this.commonService.updateRefreshToken(user.id, refreshToken);

    this.deleteAuthFields(user);

    response.json(user);

    return user;
  }

  async refreshToken(
    request: Request,
    response: Response,
    decodedUser: JwtPayload,
  ): Promise<void> {
    const refreshTokenCookie = request.cookies.refreshToken;

    const user: User = await this.prisma.user.findUnique({
      where: { id: decodedUser.id },
    });

    if (!user) {
      throw new ForbiddenException('Token is not valid!');
    }

    const validRefreshToken: boolean = await verify(
      user.refreshToken,
      refreshTokenCookie,
    );

    if (!validRefreshToken) {
      throw new ForbiddenException('Token is not valid!');
    }

    const accessToken: string = await this.commonService.generateAccessToken(
      user.id,
      user.role,
    );

    const refreshToken: string = await this.commonService.generateRefreshToken(
      user.id,
      user.role,
    );

    await this.commonService.signCookies(response, accessToken, refreshToken);
    await this.commonService.updateRefreshToken(user.id, refreshToken);

    response.send('Refresh token successfully!');
  }

  async logout(response: Response, decodedUser: JwtPayload): Promise<void> {
    const user: User = await this.prisma.user.findUnique({
      where: { id: decodedUser.id },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });

    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');

    response.send('Logout successfully!');
  }

  async forgotPassword(forgotPassword: ForgotPasswordDto): Promise<string> {
    const { email } = forgotPassword;

    const user: User = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ForbiddenException('Email is not valid!');
    }

    const accessToken: string = await this.commonService.generateAccessToken(
      user.id,
      user.role,
    );

    const subject: string = 'Reset your password';
    const link: string = `http://localhost:3000/auth/reset-password/${accessToken}`;

    await this.awsSesService.sendEmail(user.email, subject, link);

    return 'Check your email to reset your password';
  }

  async resetPassword(
    token: string,
    resetPasswordData: ResetPasswordDto,
  ): Promise<string> {
    const decodedUser: JwtPayload = this.jwt.decode(token) as JwtPayload;

    if (Date.now() >= decodedUser.exp * 1000) {
      throw new ForbiddenException('Token is expired!');
    }

    const user: User = await this.prisma.user.findUnique({
      where: {
        id: decodedUser.id,
      },
    });

    if (!user) {
      throw new ForbiddenException('Token is not valid');
    }

    const hashedPassword:string = await hash(resetPasswordData.password)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword},
    });

    return 'Reset password successfully!';
  }
}
