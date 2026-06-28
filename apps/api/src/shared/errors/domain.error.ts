/**
 * Base class for all domain and application errors.
 *
 * - code: machine-readable identifier (e.g. 'NOT_FOUND', 'CHARGE_EXPIRED')
 * - statusCode: HTTP status to return at the presentation boundary
 * - cause: original error for stack chaining
 * - context: arbitrary key-value pairs for observability
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public override readonly cause?: unknown,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
