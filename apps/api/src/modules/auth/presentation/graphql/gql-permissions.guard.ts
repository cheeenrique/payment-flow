import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { PermissionsGuard } from '@/modules/auth/presentation/http/guards/permissions.guard';
import type { AuthenticatedUser } from '@/modules/auth/presentation/http/strategies/jwt.strategy';

/**
 * Versão do PermissionsGuard para resolvers GraphQL.
 * Reaproveita toda a lógica de validação (DRY) e apenas adapta a extração
 * da request, que no GraphQL fica disponível via GqlExecutionContext.
 */
@Injectable()
export class GqlPermissionsGuard extends PermissionsGuard {
  protected override getUser(context: ExecutionContext): AuthenticatedUser | undefined {
    const gqlCtx = GqlExecutionContext.create(context);
    const request = gqlCtx.getContext<{ req: Request }>().req;
    return request.user as AuthenticatedUser | undefined;
  }
}
