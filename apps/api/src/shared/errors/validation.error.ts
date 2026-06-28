import { DomainError } from './domain.error';

export class ValidationError extends DomainError {
  constructor(
    message: string,
    cause?: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, 'VALIDATION_ERROR', 422, cause, context);
  }
}
