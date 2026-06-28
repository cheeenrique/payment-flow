/** Papéis (roles) suportados pelo sistema de RBAC. */
export const Roles = {
  Viewer: 'viewer',
  Operator: 'operator',
  Admin: 'admin',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

/** Papel padrão atribuído a um usuário recém-registrado. */
export const DEFAULT_ROLE: Role = Roles.Viewer;
