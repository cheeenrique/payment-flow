import { ADMIN_WILDCARD, Permissions } from './permissions';
import { Roles } from './roles';

/**
 * Mapa role → permissões concedidas.
 * O papel admin recebe o wildcard ('*'), que concede acesso irrestrito.
 */
const ROLE_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  [Roles.Viewer]: [
    Permissions.DashboardView,
    Permissions.ChargesRead,
    Permissions.PaymentsRead,
    Permissions.TimelineView,
    // Viewer pode consultar notificações
    Permissions.NotificationsRead,
  ],
  [Roles.Operator]: [
    Permissions.ChargesCreate,
    Permissions.PaymentsApprove,
    Permissions.InvoicesIssue,
    Permissions.TimelineView,
    // Operator lê e pode marcar notificações como lidas
    Permissions.NotificationsRead,
    Permissions.NotificationsUpdate,
  ],
  [Roles.Admin]: [ADMIN_WILDCARD],
};

/**
 * Resolve a lista de permissões efetivas a partir dos papéis do usuário.
 * Se algum papel for admin, retorna apenas o wildcard ('*').
 */
export function resolvePermissions(roles: string[]): string[] {
  const resolved = new Set<string>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) continue;
    for (const perm of perms) resolved.add(perm);
  }
  if (resolved.has(ADMIN_WILDCARD)) return [ADMIN_WILDCARD];
  return [...resolved];
}

/**
 * Verifica se as permissões concedidas satisfazem todas as exigidas.
 * O wildcard ('*') concede acesso irrestrito.
 */
export function hasAllPermissions(granted: string[], required: string[]): boolean {
  if (granted.includes(ADMIN_WILDCARD)) return true;
  return required.every((perm) => granted.includes(perm));
}
