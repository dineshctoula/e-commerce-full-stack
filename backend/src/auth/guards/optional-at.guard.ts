import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// OptionalAtGuard allows route handlers to optionally receive user context
// without forcing a 401 Unauthorized status if no access token is present.
@Injectable()
export class OptionalAtGuard extends AuthGuard('jwt') {
  // Override handleRequest so that it does not throw an exception on token validation failures.
  handleRequest(err: any, user: any, info: any) {
    // Return the user if authenticated, otherwise return null
    return user || null;
  }
}
