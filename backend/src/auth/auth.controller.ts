import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GetCurrentUser } from './decorators/get-current-user.decorator';
import { GetCurrentUserId } from './decorators/get-current-user-id.decorator';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RtGuard } from './guards/rt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  // @Public() decorator bypasses the global access token guard.
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    // By using { passthrough: true }, NestJS allows us to return values normally
    // while also letting us access the raw Express Response to set cookies.
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    // Write access and refresh tokens directly to HTTP-only cookies
    this.setCookies(res, result.tokens);
    return { user: result.user };
  }

  // POST /auth/login
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setCookies(res, result.tokens);
    return { user: result.user };
  }

  // POST /auth/logout
  // Since AtGuard is global, this route is protected by default.
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    // Extract user ID from JWT payload attached by Passport
    @GetCurrentUserId() userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    // Clear cookies from the client browser
    this.clearCookies(res);
    return { success: true };
  }

  // POST /auth/refresh
  // We bypass AtGuard using @Public() and instead apply RtGuard to validate the refresh token.
  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(userId, refreshToken);
    // Rotate and set new access/refresh token cookies
    this.setCookies(res, result.tokens);
    return { user: result.user };
  }

  // GET /auth/me
  // Fetches current user profile from the database based on JWT token
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@GetCurrentUser() user: any) {
    const dbUser = await this.authService['prisma'].user.findUnique({
      where: { id: user.sub },
    });
    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }
    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      },
    };
  }

  // Helper method: writes JWT access and refresh tokens to HttpOnly, SameSite cookies.
  private setCookies(
    res: Response,
    tokens: { access_token: string; refresh_token: string },
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Access Token Cookie (15-minute expiration)
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true, // Prevents client-side scripts from reading the cookie (protects from XSS)
      secure: isProduction, // Transmitted only over HTTPS in production
      sameSite: 'lax', // Protects from CSRF attacks
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    // Refresh Token Cookie (7-day expiration)
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true, // Prevents client-side scripts from reading the cookie
      secure: isProduction, // Transmitted only over HTTPS in production
      sameSite: 'lax', // Protects from CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }

  // Helper method: clears access and refresh token cookies from browser
  private clearCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
