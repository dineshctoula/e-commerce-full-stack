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
import { OptionalAtGuard } from './guards/optional-at.guard';

/**
 * Controller responsible for user authentication and session management.
 * Exposes endpoints for user registration, login, logout, token rotation, and retrieving current session profile.
 * Implements HTTP-only cookie-based JWT authentication for enhanced XSS/CSRF security.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user account in the system and signs them in.
   * Sets HTTP-only cookies containing the access and refresh tokens.
   *
   * @param dto - RegisterDto containing email, password, and optionally name and role.
   * @param res - Express Response object utilized to write HTTP-only cookies.
   * @returns An object containing public details of the newly created user.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setCookies(res, result.tokens);
    return { user: result.user };
  }

  /**
   * Authenticates user credentials and signs them in.
   * Sets HTTP-only cookies containing the access and refresh tokens.
   *
   * @param dto - LoginDto containing email and password.
   * @param res - Express Response object utilized to write HTTP-only cookies.
   * @returns An object containing public details of the authenticated user.
   */
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

  /**
   * Logs out the user by clearing local authentication cookies and removing the refresh token hash from the database.
   *
   * @param userId - ID of the currently authenticated user extracted from the request token.
   * @param res - Express Response object utilized to clear cookies.
   * @returns An object indicating the success status of the logout operation.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetCurrentUserId() userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    this.clearCookies(res);
    return { success: true };
  }

  /**
   * Rotates JWT access and refresh tokens when the access token expires.
   * Validates the refresh token against the database hash and sets updated cookies.
   *
   * @param userId - ID of the user requesting token rotation.
   * @param refreshToken - The current refresh token sent by the client.
   * @param res - Express Response object utilized to set rotated cookies.
   * @returns An object containing public details of the user.
   */
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
    this.setCookies(res, result.tokens);
    return { user: result.user };
  }

  /**
   * Fetches the profile details of the currently authenticated user based on the active JWT session.
   * Uses OptionalAtGuard to avoid throwing exception for guests.
   *
   * @param user - Deconstructed payload of the verified access token.
   * @returns An object containing the user's public profile details, or null if unauthenticated.
   */
  @Public()
  @UseGuards(OptionalAtGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@GetCurrentUser() user: any) {
    if (!user || !user.sub) {
      return { user: null };
    }
    const dbUser = await this.authService['prisma'].user.findUnique({
      where: { id: user.sub },
    });
    if (!dbUser) {
      return { user: null };
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

  /**
   * Helper method that configures and writes JWT access and refresh tokens to secure cookies.
   * Enables HttpOnly, SameSite='lax', and Secure flags to mitigate XSS and CSRF.
   *
   * @param res - Express Response object.
   * @param tokens - Object containing the newly generated access and refresh tokens.
   */
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

  /**
   * Helper method that clears auth-related cookies from the client browser.
   *
   * @param res - Express Response object.
   */
  private clearCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
