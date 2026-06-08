import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Refresh Token Guard (RtGuard).
 * Restricts access to handlers (typically token refresh endpoints) to requests containing a valid Refresh Token (RT).
 */
@Injectable()
export class RtGuard extends AuthGuard('jwt-refreshtoken') {}
