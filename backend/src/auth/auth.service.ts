import {
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Registers a new user in the system
  async register(dto: RegisterDto) {
    // 1. Verify if the email is already in use
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    // 2. Hash the user's password using bcrypt (with 10 rounds of salt)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Save the new user record in the database
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || 'USER',
      },
    });

    // 4. Generate Access and Refresh tokens
    const tokens = await this.signTokens(
      newUser.id,
      newUser.email,
      newUser.role,
    );

    // 5. Store the hashed refresh token in the database for future validation
    await this.updateRtHash(newUser.id, tokens.refresh_token);

    // 6. Return tokens and public user details
    return {
      tokens,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    };
  }

  // Authenticates a user based on email and password
  async login(dto: LoginDto) {
    // 1. Retrieve the user from the database
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ForbiddenException('Invalid email or password');
    }

    // 2. Compare the input password with the hashed password from database
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('Invalid email or password');
    }

    // 3. If correct, generate new tokens
    const tokens = await this.signTokens(user.id, user.email, user.role);

    // 4. Store the new hashed refresh token in the database
    await this.updateRtHash(user.id, tokens.refresh_token);

    // 5. Return tokens and public user details
    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // Logs out a user by nullifying their refresh token in the database
  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
    return true;
  }

  // Rotates access and refresh tokens using a valid refresh token
  async refreshTokens(userId: string, rt: string) {
    // 1. Retrieve user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // 2. If the user doesn't exist or is already logged out, throw Forbidden error
    if (!user || !user.hashedRt) {
      throw new ForbiddenException('Access Denied');
    }

    // 3. Verify if the incoming refresh token matches the database hash
    const rtMatches = await bcrypt.compare(rt, user.hashedRt);
    if (!rtMatches) {
      throw new ForbiddenException('Access Denied');
    }

    // 4. Generate a fresh set of access and refresh tokens
    const tokens = await this.signTokens(user.id, user.email, user.role);

    // 5. Update database with the new refresh token hash (token rotation security)
    await this.updateRtHash(user.id, tokens.refresh_token);

    // 6. Return tokens and public user details
    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // Helper: Generates access and refresh tokens as JWTs
  private async signTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [at, rt] = await Promise.all([
      // Access Token (short expiration)
      this.jwtService.signAsync(payload, {
        secret:
          process.env.JWT_ACCESS_SECRET || 'super-secret-access-key-12345!',
        expiresIn: '15m',
      }),
      // Refresh Token (long expiration)
      this.jwtService.signAsync(payload, {
        secret:
          process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-67890!',
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  // Helper: Hashes the refresh token and saves it in the User model
  private async updateRtHash(userId: string, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: hash },
    });
  }
}
