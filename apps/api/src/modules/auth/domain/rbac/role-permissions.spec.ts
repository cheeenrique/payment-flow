import { resolvePermissions, hasAllPermissions } from './role-permissions';
import { Roles } from './roles';
import { Permissions, ADMIN_WILDCARD } from './permissions';

describe('resolvePermissions', () => {
  it('retorna as permissões corretas para o papel viewer', () => {
    const permissions = resolvePermissions([Roles.Viewer]);

    expect(permissions).toContain(Permissions.DashboardView);
    expect(permissions).toContain(Permissions.ChargesRead);
    expect(permissions).toContain(Permissions.PaymentsRead);
    expect(permissions).toContain(Permissions.TimelineView);
    expect(permissions).toContain(Permissions.NotificationsRead);
    expect(permissions).not.toContain(ADMIN_WILDCARD);
  });

  it('retorna as permissões corretas para o papel operator', () => {
    const permissions = resolvePermissions([Roles.Operator]);

    expect(permissions).toContain(Permissions.ChargesCreate);
    expect(permissions).toContain(Permissions.PaymentsApprove);
    expect(permissions).toContain(Permissions.InvoicesIssue);
    expect(permissions).not.toContain(ADMIN_WILDCARD);
  });

  it('retorna apenas o wildcard para o papel admin', () => {
    const permissions = resolvePermissions([Roles.Admin]);

    expect(permissions).toEqual([ADMIN_WILDCARD]);
    expect(permissions).toHaveLength(1);
  });

  it('retorna apenas wildcard mesmo combinando admin com outros papéis', () => {
    const permissions = resolvePermissions([Roles.Viewer, Roles.Admin]);

    expect(permissions).toEqual([ADMIN_WILDCARD]);
  });

  it('combina permissões de viewer e operator sem duplicatas', () => {
    const permissions = resolvePermissions([Roles.Viewer, Roles.Operator]);

    // Permissão compartilhada entre viewer e operator deve aparecer uma vez
    expect(permissions.filter((p) => p === Permissions.NotificationsRead)).toHaveLength(1);
    expect(permissions).toContain(Permissions.DashboardView);
    expect(permissions).toContain(Permissions.ChargesCreate);
  });

  it('retorna lista vazia para papel desconhecido', () => {
    const permissions = resolvePermissions(['papel_inexistente']);

    expect(permissions).toEqual([]);
  });

  it('retorna lista vazia para array de papéis vazio', () => {
    const permissions = resolvePermissions([]);

    expect(permissions).toEqual([]);
  });
});

describe('hasAllPermissions', () => {
  it('wildcard concede acesso a qualquer permissão exigida', () => {
    const granted = [ADMIN_WILDCARD];
    const required = [Permissions.ChargesCreate, Permissions.CustomersDelete, 'qualquer:coisa'];

    expect(hasAllPermissions(granted, required)).toBe(true);
  });

  it('wildcard concede acesso mesmo para lista vazia de exigências', () => {
    expect(hasAllPermissions([ADMIN_WILDCARD], [])).toBe(true);
  });

  it('viewer com permissão presente retorna true', () => {
    const granted = resolvePermissions([Roles.Viewer]);

    expect(hasAllPermissions(granted, [Permissions.ChargesRead])).toBe(true);
  });

  it('viewer sem permissão específica retorna false', () => {
    const granted = resolvePermissions([Roles.Viewer]);

    // viewer não tem charges:create
    expect(hasAllPermissions(granted, [Permissions.ChargesCreate])).toBe(false);
  });

  it('retorna true quando todas as permissões exigidas estão concedidas', () => {
    const granted = [Permissions.ChargesRead, Permissions.PaymentsRead];

    expect(hasAllPermissions(granted, [Permissions.ChargesRead, Permissions.PaymentsRead])).toBe(true);
  });

  it('retorna false quando ao menos uma permissão exigida está ausente', () => {
    const granted = [Permissions.ChargesRead];

    expect(hasAllPermissions(granted, [Permissions.ChargesRead, Permissions.PaymentsRead])).toBe(false);
  });

  it('retorna true para lista vazia de permissões exigidas (sem restrição)', () => {
    expect(hasAllPermissions([], [])).toBe(true);
  });

  it('retorna false para permissões concedidas vazias com exigências', () => {
    expect(hasAllPermissions([], [Permissions.ChargesRead])).toBe(false);
  });
});
