import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthenticatedUser } from '@/modules/auth/presentation/http/strategies/jwt.strategy';

/**
 * Extrai o usuário autenticado do contexto GraphQL.
 *
 * Análogo ao @CurrentUser do contexto HTTP, mas para resolvers.
 * Requer que o GqlAuthGuard tenha rodado antes (preenche req.user).
 *
 * Decorator compartilhado por todos os módulos — evita duplicação.
 */
export const GqlCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    return gqlCtx.getContext<{ req: { user: AuthenticatedUser } }>().req.user;
  },
);
