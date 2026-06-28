import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from '@/shared/errors/domain.error';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  code: string;
  timestamp: string;
  path: string;
}

interface ErrorInfo {
  statusCode: number;
  message: string;
  code: string;
}

const HTTP_STATUS_LABELS: Readonly<Record<number, string>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

function statusLabel(statusCode: number): string {
  return HTTP_STATUS_LABELS[statusCode] ?? 'Error';
}

function extractHttpExceptionMessage(res: string | object): string {
  if (typeof res === 'string') return res;

  const obj = res as Record<string, unknown>;
  const raw = obj['message'];

  if (Array.isArray(raw)) return raw.join('; ');
  return typeof raw === 'string' ? raw : 'Unexpected error';
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const info = this.resolveErrorInfo(exception);

    this.logger.error(
      `[${info.code}] ${info.message} — ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const body: ErrorBody = {
      statusCode: info.statusCode,
      error: statusLabel(info.statusCode),
      message: info.message,
      code: info.code,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(info.statusCode).json(body);
  }

  private resolveErrorInfo(exception: unknown): ErrorInfo {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.statusCode,
        message: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: extractHttpExceptionMessage(exception.getResponse()),
        code: 'HTTP_EXCEPTION',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
  }
}
