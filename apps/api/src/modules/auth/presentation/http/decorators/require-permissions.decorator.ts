import { SetMetadata } from '@nestjs/common';

/** Chave de metadata onde ficam as permissões exigidas por uma rota/handler. */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Declara as permissões necessárias para acessar uma rota/handler.
 * Deve ser combinado com JwtAuthGuard (autenticação) + PermissionsGuard
 * (autorização). Exemplo: @RequirePermissions('charges:create').
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
