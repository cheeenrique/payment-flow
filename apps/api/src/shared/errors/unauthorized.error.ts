import { DomainError } from './domain.error';

export class UnauthorizedError extends DomainError {
  constructor(
    message: string,
    cause?: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, 'UNAUTHORIZED', 401, cause, context);
  }
}
