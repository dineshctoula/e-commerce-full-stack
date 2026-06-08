import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

/**
 * Passport Strategy for verifying Access Tokens (AT).
 * Extracts the JWT access token from cookies or the Authorization header as a Bearer Token.
 * Attaches the verified user payload to the request object.
 */
@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Attempt to extract access token from cookies first (XSS-protected flow)
        (req: Request) => {
          return req?.cookies?.['access_token'] || null;
        },
        // Fallback to Bearer token in headers
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey:
        process.env.JWT_ACCESS_SECRET || 'super-secret-access-key-12345!',
    });
  }

  /**
   * Validates the decoded JWT payload.
   *
   * @param payload - Decoded JWT payload containing sub, email, and role.
   * @returns The payload to be attached to req.user.
   */
  validate(payload: JwtPayload) {
    return payload;
  }
}
