import { DomainError } from './domain.error';

/**
 * Erro de autorização: o usuário está autenticado, porém não possui
 * as permissões necessárias para o recurso (HTTP 403).
 * Diferente de UnauthorizedError (401), que indica ausência de autenticação.
 */
export class ForbiddenError extends DomainError {
  constructor(
    message: string,
    cause?: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, 'FORBIDDEN', 403, cause, context);
  }
}
