import { randomUUID } from 'node:crypto';
import { ConflictError } from '@/shared/errors/conflict.error';

/** Métodos de pagamento suportados pelo sistema */
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';

/** Ciclo de vida de um pagamento */
export type PaymentStatus = 'pending' | 'processing' | 'approved' | 'failed' | 'expired';

export interface PaymentProps {
  id: string;
  chargeId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey?: string;
  providerResponse?: Record<string, unknown>;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Dados necessários para criação de um novo pagamento */
export interface CreatePaymentProps {
  chargeId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  idempotencyKey?: string;
}

/**
 * Entidade de domínio Payment.
 * Imutável: cada transição de estado retorna uma nova instância.
 * Cada método de transição possui guarda de estado que lança ConflictError
 * quando a transição seria inválida — errors as data.
 * Não depende de NestJS nem de Mongoose.
 */
export class Payment {
  readonly id: string;
  readonly chargeId: string;
  readonly customerId: string;
  readonly amount: number;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly idempotencyKey?: string;
  readonly providerResponse?: Record<string, unknown>;
  readonly failureReason?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PaymentProps) {
    this.id = props.id;
    this.chargeId = props.chargeId;
    this.customerId = props.customerId;
    this.amount = props.amount;
    this.method = props.method;
    this.status = props.status;
    this.idempotencyKey = props.idempotencyKey;
    this.providerResponse = props.providerResponse;
    this.failureReason = props.failureReason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Cria um novo pagamento no estado inicial "pending" */
  static create(props: CreatePaymentProps): Payment {
    const now = new Date();
    return new Payment({
      ...props,
      id: randomUUID(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Transição para "processing" — início do processamento.
   * Guarda: somente permitido a partir de "pending".
   */
  startProcessing(): Payment {
    if (this.status !== 'pending') {
      throw new ConflictError(
        `Transição inválida: pagamento em "${this.status}" não pode iniciar processamento`,
        undefined,
        { paymentId: this.id, currentStatus: this.status },
      );
    }
    return new Payment({ ...this, status: 'processing', updatedAt: new Date() });
  }

  /**
   * Transição para "approved" — pagamento confirmado pelo PSP.
   * Guarda: somente permitido a partir de "processing".
   */
  approve(providerResponse?: Record<string, unknown>): Payment {
    if (this.status !== 'processing') {
      throw new ConflictError(
        `Transição inválida: pagamento em "${this.status}" não pode ser aprovado`,
        undefined,
        { paymentId: this.id, currentStatus: this.status },
      );
    }
    return new Payment({ ...this, status: 'approved', providerResponse, updatedAt: new Date() });
  }

  /**
   * Transição para "failed" — pagamento recusado pelo PSP.
   * Guarda: somente permitido a partir de "processing".
   */
  fail(failureReason: string, providerResponse?: Record<string, unknown>): Payment {
    if (this.status !== 'processing') {
      throw new ConflictError(
        `Transição inválida: pagamento em "${this.status}" não pode ser marcado como falho`,
        undefined,
        { paymentId: this.id, currentStatus: this.status },
      );
    }
    return new Payment({ ...this, status: 'failed', failureReason, providerResponse, updatedAt: new Date() });
  }

  /**
   * Transição para "expired" — prazo expirado sem pagamento.
   * Guarda: somente permitido a partir de "pending" ou "processing".
   */
  expire(): Payment {
    if (this.status !== 'pending' && this.status !== 'processing') {
      throw new ConflictError(
        `Transição inválida: pagamento em "${this.status}" não pode expirar`,
        undefined,
        { paymentId: this.id, currentStatus: this.status },
      );
    }
    return new Payment({
      ...this,
      status: 'expired',
      failureReason: 'Prazo de pagamento expirado',
      updatedAt: new Date(),
    });
  }

  /** Verifica se o pagamento está em estado terminal (não pode ser reprocessado) */
  isTerminal(): boolean {
    return this.status === 'approved' || this.status === 'failed' || this.status === 'expired';
  }
}
