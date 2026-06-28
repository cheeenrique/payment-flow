import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { GqlContextType } from '@nestjs/graphql';
import { map, Observable } from 'rxjs';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';
import {
  buildPaginationMeta,
  type PaginationMeta,
} from '@/shared/pagination/pagination-meta.helper';

/** Chave de metadata interna do decorator @Sse do NestJS (stable desde v10) */
const SSE_METADATA_KEY = '__sse__';

/** Envelope padrão de sucesso para respostas REST */
interface SuccessEnvelope<T> {
  data: T;
  meta: {
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

/**
 * Interceptor global que envelopa todas as respostas REST de sucesso no formato:
 *   { data: T | T[], meta: { timestamp, pagination? } }
 *
 * Contextos ignorados (sem envelope):
 *   - GraphQL: possui envelope nativo do protocolo
 *   - SSE (Server-Sent Events): stream contínuo, não deve ser encapsulado
 *   - Handlers void/undefined (ex: 204 No Content)
 *
 * Quando o use case retorna um PaginatedResult<T>, o interceptor extrai
 * items em data e calcula meta.pagination com hasNext/hasPrev derivados.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    // Pula GraphQL — possui envelope nativo do protocolo
    if (context.getType<GqlContextType>() === 'graphql') {
      return next.handle();
    }

    // Pula SSE — handlers @Sse retornam Observable<MessageEvent> em stream contínuo
    const isSse = this.reflector.get<boolean>(SSE_METADATA_KEY, context.getHandler());
    if (isSse) return next.handle();

    return next.handle().pipe(map((value) => this.buildEnvelope(value)));
  }

  private buildEnvelope(value: unknown): unknown {
    // Handlers void/undefined (ex: 204 No Content) — não envelopa
    if (value === undefined || value === null) return value;

    const timestamp = new Date().toISOString();

    if (this.isPaginatedResult(value)) {
      return {
        data: value.items,
        meta: { timestamp, pagination: buildPaginationMeta(value) },
      } satisfies SuccessEnvelope<unknown[]>;
    }

    return { data: value, meta: { timestamp } } satisfies SuccessEnvelope<unknown>;
  }

  /** Type guard: verifica se o valor é um PaginatedResult<T> */
  private isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'items' in value &&
      'total' in value &&
      'page' in value &&
      'limit' in value
    );
  }
}
