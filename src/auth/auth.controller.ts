import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Post, Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { AuthService } from './auth.service';
import { Role, User } from '@prisma/client';
import { CreateSignupDto } from './dto/create-signup-dto';
import { Response, Request } from 'express';
import { CreateProductKeyDto } from './dto/create-product-key-dto';
import { CreateLoginDto } from './dto/create-login-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserDecorator } from './decorator/user.decorator';
import { JwtPayload } from '@app/common';
import { RtGuard } from './guard/rt.guard';
import { Roles } from './decorator/roles.decorator';
import { RoleGuard } from './guard/role.guard';
import { AtGuard } from './guard/at.guard';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { GoogleGuard } from './guard/google.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Roles(Role.ADMIN)
  @UseGuards(RoleGuard)
  @Post('product-key')
  async generateProductKey(
    @Body() productKeyData: CreateProductKeyDto,
  ): Promise<string> {
    return this.authService.generateProductKey(productKeyData);
  }

  @Post('signup/:role')
  @UseInterceptors(FileInterceptor('file'))
  async signup(
    @Res() response: Response,
    @Param('role', new ParseEnumPipe(Role)) role: Role,
    @Body() signupData: CreateSignupDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    return this.authService.signup(response, role, signupData, file);
  }

  @UseGuards(AtGuard)
  @Post('resend-confirmation')
  async resendConfirmation(@Req() request: Request): Promise<string> {
    return this.authService.resendConfirmation(request);
  }

  @Post('confirm/:token')
  @UseGuards(AtGuard)
  async confirmEmail(@Param('token') token: string): Promise<User> {
    return this.authService.confirmEmail(token);
  }

  @Post('login')
  async login(
    @Res() response: Response,
    @Body() loginData: CreateLoginDto,
  ): Promise<User> {
    return this.authService.login(response, loginData);
  }

  @Get('login/google')
  @UseGuards(GoogleGuard)
  async googleLogin(): Promise<string> {
    return 'Google authentication';
  }

  @Get('google/redirect')
  @UseGuards(GoogleGuard)
  async handleRedirect(): Promise<string> {
    return 'Login with google successfully!';
  }

  @Get('refresh-token')
  @UseGuards(RtGuard)
  async refreshToken(
    @Req() request: Request,
    @Res() response: Response,
    @UserDecorator() user: JwtPayload,
  ): Promise<void> {
    return this.authService.refreshToken(request, response, user);
  }

  @Delete('logout')
  @UseGuards(AtGuard)
  async logout(
    @Res() response: Response,
    @UserDecorator() decodedUser: JwtPayload,
  ): Promise<void> {
    return this.authService.logout(response, decodedUser);
  }

  @Post('forgot-password')
  @UseGuards(AtGuard)
  async forgotPassword(
    @Body() forgotPassword: ForgotPasswordDto,
  ): Promise<string> {
    return this.authService.forgotPassword(forgotPassword);
  }

  @Put('reset-password/:token')
  @UseGuards(AtGuard)
  async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordData: ResetPasswordDto,
  ): Promise<string> {
    return this.authService.resetPassword(token, resetPasswordData);
  }
}
