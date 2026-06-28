import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors/unauthorized.error';
import { ForbiddenError } from '@/shared/errors/forbidden.error';
import { hasAllPermissions } from '@/modules/auth/domain/rbac/role-permissions';
import { PERMISSIONS_KEY } from '@/modules/auth/presentation/http/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '@/modules/auth/presentation/http/strategies/jwt.strategy';

/**
 * Guard de autorização baseado em permissões (RBAC).
 * Lê as permissões exigidas via metadata (@RequirePermissions) e valida
 * contra as permissões do usuário. Deve rodar APÓS o JwtAuthGuard, que
 * popula request.user. O wildcard '*' (admin) satisfaz qualquer exigência.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(protected readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sem metadata de permissão → autorização não exigida (autN já tratada).
    if (!required || required.length === 0) return true;

    const user = this.getUser(context);
    if (!user) {
      throw new UnauthorizedError('Usuário não autenticado');
    }

    if (hasAllPermissions(user.permissions ?? [], required)) {
      return true;
    }

    throw new ForbiddenError(
      'Permissões insuficientes para acessar este recurso',
      undefined,
      { required },
    );
  }

  /** Extrai o usuário autenticado do contexto HTTP. */
  protected getUser(context: ExecutionContext): AuthenticatedUser | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedUser | undefined;
  }
}
