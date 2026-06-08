import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Passport Strategy for verifying Refresh Tokens (RT).
 * Extracts the JWT refresh token from cookies or the Authorization header.
 * Passes the raw request to the validation callback to deconstruct and return the refresh token.
 */
@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refreshtoken') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Attempt to extract refresh token from cookies first
        (req: Request) => {
          return req?.cookies?.['refresh_token'] || null;
        },
        // Fallback to Bearer token in headers
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey:
        process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-67890!',
      passReqToCallback: true, // Allows us to access the request object in validate() callback
    });
  }

  /**
   * Validates the refresh token payload and extracts the raw token from headers/cookies.
   *
   * @param req - Raw Express Request object.
   * @param payload - Decoded JWT payload.
   * @returns Combined user credentials and raw refreshToken string.
   */
  validate(req: Request, payload: any) {
    let refreshToken = req?.cookies?.['refresh_token'];
    if (!refreshToken) {
      const authHeader = req.get('authorization');
      if (authHeader) {
        refreshToken = authHeader.replace('Bearer ', '').trim();
      }
    }
    return {
      ...payload,
      refreshToken,
    };
  }
}
