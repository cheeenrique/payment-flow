import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { JwtAuthGuard } from '@/modules/auth/presentation/http/guards/jwt-auth.guard';

/**
 * Guard JWT adaptado para o contexto GraphQL.
 *
 * O AuthGuard padrão do Passport extrai a request do contexto HTTP.
 * Resolvers GraphQL expõem a request via GqlExecutionContext, então
 * sobrescrevemos getRequest para a estratégia Passport funcionar em queries.
 *
 * Guard compartilhado por todos os módulos — evita duplicação.
 */
@Injectable()
export class GqlAuthGuard extends JwtAuthGuard {
  override getRequest(context: ExecutionContext): Request {
    const gqlCtx = GqlExecutionContext.create(context);
    return gqlCtx.getContext<{ req: Request }>().req;
  }
}
