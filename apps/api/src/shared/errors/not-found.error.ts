import { DomainError } from './domain.error';

export class NotFoundError extends DomainError {
  constructor(
    message: string,
    cause?: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, 'NOT_FOUND', 404, cause, context);
  }
}
