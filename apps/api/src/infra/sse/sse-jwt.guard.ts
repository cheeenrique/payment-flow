import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors/unauthorized.error';
import type { JwtPayload } from '@/modules/auth/domain/ports/token-service.interface';
import type { AuthenticatedUser } from '@/modules/auth/presentation/http/strategies/jwt.strategy';

/**
 * Guard de autenticação do stream SSE.
 *
 * O EventSource do browser não envia headers customizados, então o JWT chega
 * pela query string (?token=JWT). Reutiliza o JwtService já configurado com
 * JWT_SECRET (mesma verificação do access token) e popula request.user no
 * mesmo formato do JwtStrategy, para o handler usar se precisar.
 *
 * Token ausente ou inválido → UnauthorizedError (401).
 */
@Injectable()
export class SseJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    const payload = this.verifyToken(token);
    request.user = this.toAuthenticatedUser(payload);
    return true;
  }

  /** Extrai o token do query param `token`. */
  private extractToken(request: Request): string {
    const token = request.query?.token;
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedError('Token ausente no stream SSE');
    }
    return token;
  }

  /** Verifica o JWT com o segredo já configurado no JwtModule (JWT_SECRET). */
  private verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (cause) {
      throw new UnauthorizedError(
        'Token inválido ou expirado no stream SSE',
        cause,
      );
    }
  }

  /** Converte o payload do JWT no usuário autenticado anexado à request. */
  private toAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  }
}
