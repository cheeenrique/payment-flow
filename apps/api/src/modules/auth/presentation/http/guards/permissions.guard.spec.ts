import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '@/modules/auth/presentation/http/decorators/require-permissions.decorator';
import { ForbiddenError } from '@/shared/errors/forbidden.error';
import { UnauthorizedError } from '@/shared/errors/unauthorized.error';
import { ADMIN_WILDCARD } from '@/modules/auth/domain/rbac/permissions';
import type { AuthenticatedUser } from '@/modules/auth/presentation/http/strategies/jwt.strategy';

/** Cria um ExecutionContext HTTP com o usuário informado na request */
function criarContexto(user: AuthenticatedUser | undefined, handler: object = {}, klass: object = {}): ExecutionContext {
  return {
    getHandler: jest.fn().mockReturnValue(handler),
    getClass: jest.fn().mockReturnValue(klass),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
    getType: jest.fn().mockReturnValue('http'),
  } as unknown as ExecutionContext;
}

/** Cria um Reflector mockado que retorna as permissões indicadas */
function criarReflector(permissions: string[] | undefined): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(permissions),
  } as unknown as Reflector;
}

describe('PermissionsGuard', () => {
  describe('rota sem metadados de permissão', () => {
    it('retorna true (rota pública — sem restrição de autorização)', () => {
      const reflector = criarReflector(undefined);
      const guard = new PermissionsGuard(reflector);
      const ctx = criarContexto({ userId: 'u1', email: 'x@x.com', roles: [], permissions: [] });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('retorna true para array de permissões vazio nos metadados', () => {
      const reflector = criarReflector([]);
      const guard = new PermissionsGuard(reflector);
      const ctx = criarContexto({ userId: 'u1', email: 'x@x.com', roles: [], permissions: [] });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('rota com permissões exigidas — sem usuário', () => {
    it('lança UnauthorizedError quando request.user é undefined', () => {
      const reflector = criarReflector(['charges:read']);
      const guard = new PermissionsGuard(reflector);
      const ctx = criarContexto(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedError);
    });

    it('erro de não-autenticação usa statusCode 401', () => {
      const reflector = criarReflector(['charges:read']);
      const guard = new PermissionsGuard(reflector);
      const ctx = criarContexto(undefined);

      try {
        guard.canActivate(ctx);
        fail('deveria ter lançado UnauthorizedError');
      } catch (err) {
        expect((err as UnauthorizedError).statusCode).toBe(401);
      }
    });
  });

  describe('rota com permissões exigidas — usuário sem permissão suficiente', () => {
    it('lança ForbiddenError quando o usuário não possui a permissão exigida', () => {
      const reflector = criarReflector(['charges:create']);
      const guard = new PermissionsGuard(reflector);
      // viewer não tem charges:create
      const user: AuthenticatedUser = { userId: 'u1', email: 'x@x.com', roles: ['viewer'], permissions: ['charges:read'] };
      const ctx = criarContexto(user);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenError);
    });

    it('ForbiddenError usa statusCode 403', () => {
      const reflector = criarReflector(['charges:create']);
      const guard = new PermissionsGuard(reflector);
      const user: AuthenticatedUser = { userId: 'u1', email: 'x@x.com', roles: ['viewer'], permissions: ['charges:read'] };
      const ctx = criarContexto(user);

      try {
        guard.canActivate(ctx);
        fail('deveria ter lançado ForbiddenError');
      } catch (err) {
        expect((err as ForbiddenError).statusCode).toBe(403);
      }
    });

    it('ForbiddenError inclui as permissões exigidas no context', () => {
      const required = ['charges:create', 'payments:approve'];
      const reflector = criarReflector(required);
      const guard = new PermissionsGuard(reflector);
      const user: AuthenticatedUser = { userId: 'u1', email: 'x@x.com', roles: ['viewer'], permissions: [] };
      const ctx = criarContexto(user);

      try {
        guard.canActivate(ctx);
        fail('deveria ter lançado ForbiddenError');
      } catch (err) {
        expect((err as ForbiddenError).context).toEqual({ required });
      }
    });
  });

  describe('rota com permissões exigidas — usuário com wildcard (admin)', () => {
    it('retorna true quando o usuário possui wildcard (*)', () => {
      const reflector = criarReflector(['customers:delete', 'simulator:manage']);
      const guard = new PermissionsGuard(reflector);
      const user: AuthenticatedUser = { userId: 'admin', email: 'admin@x.com', roles: ['admin'], permissions: [ADMIN_WILDCARD] };
      const ctx = criarContexto(user);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('rota com permissões exigidas — usuário com permissão correta', () => {
    it('retorna true quando o usuário possui exatamente a permissão exigida', () => {
      const reflector = criarReflector(['charges:read']);
      const guard = new PermissionsGuard(reflector);
      const user: AuthenticatedUser = { userId: 'u2', email: 'op@x.com', roles: ['viewer'], permissions: ['charges:read', 'payments:read'] };
      const ctx = criarContexto(user);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('retorna true quando o usuário possui todas as permissões exigidas', () => {
      const reflector = criarReflector(['charges:read', 'payments:read']);
      const guard = new PermissionsGuard(reflector);
      const user: AuthenticatedUser = { userId: 'u2', email: 'op@x.com', roles: ['viewer'], permissions: ['charges:read', 'payments:read'] };
      const ctx = criarContexto(user);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('reflector recebe as chaves corretas', () => {
    it('consulta o reflector com PERMISSIONS_KEY e os dois níveis (handler e class)', () => {
      const handler = {};
      const klass = {};
      const reflector = criarReflector(undefined);
      const guard = new PermissionsGuard(reflector);
      const ctx = criarContexto({ userId: 'u1', email: 'x@x.com', roles: [], permissions: [] }, handler, klass);

      guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PERMISSIONS_KEY, [handler, klass]);
    });
  });
});
