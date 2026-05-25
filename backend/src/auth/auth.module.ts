import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AtStrategy } from './strategies/at.strategy';
import { RtStrategy } from './strategies/rt.strategy';

// This module bundles everything related to Authentication.
// It integrates Passport (for token validation) and JwtModule (for token signing).
@Module({
  imports: [
    // Passport module helps us define and use login strategies (like JWT validation)
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JwtModule is registered empty because we configure signing dynamically in the service
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AtStrategy, // Access Token Strategy
    RtStrategy, // Refresh Token Strategy
  ],
  exports: [AuthService], // Export AuthService if other modules need to check authentication status
})
export class AuthModule {}
