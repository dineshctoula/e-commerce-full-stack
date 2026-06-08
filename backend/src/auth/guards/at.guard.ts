import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Access Token Guard (AtGuard).
 * Intercepts incoming requests and verifies JWT access tokens.
 * Registered globally, but skips validation for handlers or controllers marked with the `@Public()` decorator.
 */
@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the current request can proceed.
   *
   * @param context - NestJS ExecutionContext of the current request.
   * @returns True if route is public or token is successfully validated; false otherwise.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 1. Check if the metadata key 'isPublic' is set on the route handler or class
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. If @Public() decorator is present, skip token validation and return true
    if (isPublic) {
      return true;
    }

    // 3. Otherwise, perform standard Passport JWT validation
    return super.canActivate(context);
  }
}
