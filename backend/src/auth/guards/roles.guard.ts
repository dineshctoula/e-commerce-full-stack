import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role-Based Access Control Guard (RolesGuard).
 * Restricts access to routes based on user authorization roles (e.g. USER, ADMIN).
 * Checks the roles metadata attached to handler methods/controllers via the `@Roles()` decorator.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Evaluates if the requesting user possesses the roles required to access the handler.
   *
   * @param context - NestJS ExecutionContext of the current request.
   * @returns True if the user's role matches the required roles; false otherwise.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified for the route, let it pass by default
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Check if the user's role is included in the allowed roles list
    return requiredRoles.includes(user.role);
  }
}
