import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refreshtoken') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.['refresh_token'] || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-67890!',
      passReqToCallback: true,
    });
  }

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
