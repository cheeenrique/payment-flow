import { DomainError } from './domain.error';

export class ConflictError extends DomainError {
  constructor(
    message: string,
    cause?: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, 'CONFLICT', 409, cause, context);
  }
}
