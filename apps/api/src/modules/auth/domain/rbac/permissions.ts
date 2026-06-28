/**
 * Permissões granulares do sistema. Formato: "recurso:ação".
 * Fonte: docs/02-backend/rbac-permissions.md.
 */
export const Permissions = {
  // Cobranças
  ChargesCreate: 'charges:create',
  ChargesRead: 'charges:read',
  ChargesUpdate: 'charges:update',
  ChargesDelete: 'charges:delete',
  // Pagamentos
  PaymentsRead: 'payments:read',
  PaymentsSimulate: 'payments:simulate',
  PaymentsApprove: 'payments:approve',
  PaymentsRefund: 'payments:refund',
  // Notas fiscais
  InvoicesIssue: 'invoices:issue',
  InvoicesRead: 'invoices:read',
  // Dashboard e timeline
  DashboardView: 'dashboard:view',
  TimelineView: 'timeline:view',
  // Clientes — operações administrativas (concedidas apenas ao admin via wildcard)
  CustomersCreate: 'customers:create',
  CustomersRead: 'customers:read',
  CustomersUpdate: 'customers:update',
  CustomersDelete: 'customers:delete',
  // Simulador — operações administrativas (concedidas apenas ao admin via wildcard)
  SimulatorRead: 'simulator:read',
  SimulatorManage: 'simulator:manage',
  // Notificações
  NotificationsRead: 'notifications:read',
  NotificationsUpdate: 'notifications:update',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

/** Wildcard que concede todas as permissões (utilizado pelo papel admin). */
export const ADMIN_WILDCARD = '*';
