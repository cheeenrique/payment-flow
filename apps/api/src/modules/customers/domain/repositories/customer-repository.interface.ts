import type { Customer } from '@/modules/customers/domain/entities/customer.entity';

/** Parâmetros de paginação para listagem de clientes */
export interface ListCustomersParams {
  page: number;
  limit: number;
}

/** Resultado paginado da listagem de clientes */
export interface ListCustomersResult {
  items: Customer[];
  total: number;
}

/**
 * Port do repositório de clientes (DIP).
 * Apenas a infraestrutura implementa esta interface;
 * o domínio nunca conhece MongoDB, Mongoose nem qualquer detalhe técnico.
 */
export interface ICustomerRepository {
  create(customer: Customer): Promise<void>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  update(customer: Customer): Promise<void>;
  list(params: ListCustomersParams): Promise<ListCustomersResult>;
}
