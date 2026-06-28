import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';

/** Chave interna do decorator @Sse do NestJS */
const SSE_METADATA_KEY = '__sse__';

/** Cria um CallHandler que emite o valor fornecido */
function criarCallHandler(value: unknown) {
  return { handle: jest.fn().mockReturnValue(of(value)) };
}

/** Cria um ExecutionContext HTTP genérico */
function criarContextoHttp(handler: object = {}): ExecutionContext {
  return {
    getType: jest.fn().mockReturnValue('http'),
    getHandler: jest.fn().mockReturnValue(handler),
  } as unknown as ExecutionContext;
}

/** Cria um ExecutionContext GraphQL */
function criarContextoGql(): ExecutionContext {
  return {
    getType: jest.fn().mockReturnValue('graphql'),
    getHandler: jest.fn().mockReturnValue({}),
  } as unknown as ExecutionContext;
}

describe('TransformInterceptor', () => {
  let reflector: jest.Mocked<Reflector>;
  let interceptor: TransformInterceptor;

  beforeEach(() => {
    reflector = {
      get: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;
    interceptor = new TransformInterceptor(reflector);
  });

  describe('envelope padrão HTTP', () => {
    it('envelopa resposta simples em { data, meta: { timestamp } }', async () => {
      const ctx = criarContextoHttp();
      const handler = criarCallHandler({ id: 'abc', name: 'Teste' });

      const result = await lastValueFrom(interceptor.intercept(ctx, handler));

      expect(result).toEqual(
        expect.objectContaining({
          data: { id: 'abc', name: 'Teste' },
          meta: expect.objectContaining({ timestamp: expect.any(String) }),
        }),
      );
    });

    it('meta.timestamp é uma string ISO 8601 válida', async () => {
      const ctx = criarContextoHttp();
      const handler = criarCallHandler('qualquer valor');

      const result = await lastValueFrom(interceptor.intercept(ctx, handler)) as Record<string, unknown>;
      const meta = result['meta'] as Record<string, unknown>;

      expect(() => new Date(meta['timestamp'] as string)).not.toThrow();
      expect(isNaN(new Date(meta['timestamp'] as string).getTime())).toBe(false);
    });

    it('não adiciona meta.pagination para resposta não paginada', async () => {
      const ctx = criarContextoHttp();
      const handler = criarCallHandler({ status: 'ok' });

      const result = await lastValueFrom(interceptor.intercept(ctx, handler)) as Record<string, unknown>;
      const meta = result['meta'] as Record<string, unknown>;

      expect(meta['pagination']).toBeUndefined();
    });
  });

  describe('PaginatedResult', () => {
    it('extrai items em data e calcula meta.pagination para PaginatedResult', async () => {
      const paginado: PaginatedResult<string> = { items: ['a', 'b'], total: 20, page: 1, limit: 10 };
      const ctx = criarContextoHttp();
      const handler = criarCallHandler(paginado);

      const result = await lastValueFrom(interceptor.intercept(ctx, handler)) as Record<string, unknown>;
      const meta = result['meta'] as Record<string, unknown>;
      const pagination = meta['pagination'] as Record<string, unknown>;

      expect(result['data']).toEqual(['a', 'b']);
      expect(pagination['total']).toBe(20);
      expect(pagination['page']).toBe(1);
      expect(pagination['limit']).toBe(10);
      expect(pagination['hasNext']).toBe(true);
      expect(pagination['hasPrev']).toBe(false);
    });

    it('calcula hasPrev=true quando page > 1', async () => {
      const paginado: PaginatedResult<number> = { items: [1], total: 30, page: 3, limit: 10 };
      const ctx = criarContextoHttp();
      const handler = criarCallHandler(paginado);

      const result = await lastValueFrom(interceptor.intercept(ctx, handler)) as Record<string, unknown>;
      const pagination = (result['meta'] as Record<string, unknown>)['pagination'] as Record<string, unknown>;

      expect(pagination['hasPrev']).toBe(true);
    });
  });

  describe('contexto GraphQL — sem envelope', () => {
    it('passa o valor sem modificação no contexto graphql', async () => {
      const ctx = criarContextoGql();
      const payload = { data: { user: { id: '1' } } };
      const handler = criarCallHandler(payload);

      const result = await lastValueFrom(interceptor.intercept(ctx, handler));

      expect(result).toBe(payload);
    });
  });

  describe('contexto SSE — sem envelope', () => {
    it('passa o valor sem modificação quando handler é marcado como SSE', async () => {
      const handler = {};
      const ctx = criarContextoHttp(handler);
      // Simula o reflector retornando true para SSE_METADATA_KEY
      reflector.get.mockImplementation((key) => key === SSE_METADATA_KEY);
      const callHandler = criarCallHandler('sse-event');

      const result = await lastValueFrom(interceptor.intercept(ctx, callHandler));

      expect(result).toBe('sse-event');
    });
  });

  describe('resposta undefined/null — sem envelope', () => {
    it('retorna undefined sem envelope para handlers void', async () => {
      const ctx = criarContextoHttp();
      const handler = criarCallHandler(undefined);

      const result = await lastValueFrom(interceptor.intercept(ctx, handler));

      expect(result).toBeUndefined();
    });

    it('retorna null sem envelope para resposta null', async () => {
      const ctx = criarContextoHttp();
      const handler = criarCallHandler(null);

      const result = await lastValueFrom(interceptor.intercept(ctx, handler));

      expect(result).toBeNull();
    });
  });
});
