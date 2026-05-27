import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// AtGuard (Access Token Guard) protects routes by validating the Access Token.
// It is registered globally in AppModule, but will allow access if the route is decorated with @Public().
@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

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
