import { randomUUID } from 'node:crypto';

/** Status possíveis do cliente no sistema */
export type CustomerStatus = 'active' | 'inactive';

export interface CustomerProps {
  id: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidade raiz do domínio de clientes.
 * Imutável: transições de estado retornam novas instâncias.
 * Não importa NestJS, Mongoose nem qualquer framework externo.
 */
export class Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly document: string;
  readonly phone?: string;
  readonly status: CustomerStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: CustomerProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.document = props.document;
    this.phone = props.phone;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Cria um novo cliente com status 'active' e timestamps gerados */
  static create(
    props: Omit<CustomerProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Customer {
    const now = new Date();
    return new Customer({
      ...props,
      id: randomUUID(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Retorna nova instância com campos atualizados e updatedAt renovado */
  withUpdate(
    props: Partial<Pick<CustomerProps, 'name' | 'document' | 'phone'>>,
  ): Customer {
    return new Customer({ ...this, ...props, updatedAt: new Date() });
  }

  /** Retorna nova instância com status 'inactive' */
  deactivate(): Customer {
    return new Customer({ ...this, status: 'inactive', updatedAt: new Date() });
  }

  isActive(): boolean {
    return this.status === 'active';
  }
}
