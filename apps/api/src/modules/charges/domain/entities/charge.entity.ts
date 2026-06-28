import { randomUUID } from 'node:crypto';
import { ConflictError } from '@/shared/errors/conflict.error';

/** Estados possíveis do ciclo de vida de uma cobrança */
export enum ChargeStatus {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

/** Conjunto de estados terminais — não permitem mais transições */
const TERMINAL_STATUSES = new Set<ChargeStatus>([
  ChargeStatus.PAID,
  ChargeStatus.CANCELED,
  ChargeStatus.EXPIRED,
  ChargeStatus.FAILED,
]);

/** Métodos de pagamento suportados */
export enum PaymentMethod {
  PIX = 'pix',
  BOLETO = 'boleto',
  CREDIT_CARD = 'credit_card',
}

export interface ChargeProps {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  description?: string;
  status: ChargeStatus;
  paymentLinkToken: string;
  paymentMethod: PaymentMethod | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidade principal do módulo charges.
 * Encapsula o ciclo de vida de uma cobrança e suas invariantes de negócio.
 * Cada método de transição possui guarda de estado que lança ConflictError
 * quando a transição seria inválida — errors as data, sem exceções genéricas.
 * Não depende de NestJS nem de Mongoose.
 */
export class Charge {
  readonly id: string;
  readonly customerId: string;
  readonly amount: number;
  readonly currency: string;
  readonly description?: string;
  readonly status: ChargeStatus;
  readonly paymentLinkToken: string;
  readonly paymentMethod: PaymentMethod | null;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ChargeProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.description = props.description;
    this.status = props.status;
    this.paymentLinkToken = props.paymentLinkToken;
    this.paymentMethod = props.paymentMethod;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Cria uma nova cobrança com status inicial "pending" e token de link gerado automaticamente */
  static create(
    props: Omit<ChargeProps, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'paymentLinkToken' | 'paymentMethod'> & {
      paymentMethod?: PaymentMethod | null;
    },
  ): Charge {
    const now = new Date();
    return new Charge({
      ...props,
      id: randomUUID(),
      paymentLinkToken: randomUUID().replace(/-/g, ''),
      status: ChargeStatus.PENDING,
      paymentMethod: props.paymentMethod ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Verifica se a cobrança está em um estado terminal (sem novas transições) */
  isTerminal(): boolean {
    return TERMINAL_STATUSES.has(this.status);
  }

  /** Verifica se a cobrança pode ser cancelada conforme o status atual */
  canBeCanceled(): boolean {
    return (
      this.status === ChargeStatus.PENDING ||
      this.status === ChargeStatus.AWAITING_PAYMENT
    );
  }

  /** Verifica se a cobrança pode ser expirada conforme o status atual */
  canExpire(): boolean {
    return (
      this.status === ChargeStatus.PENDING ||
      this.status === ChargeStatus.AWAITING_PAYMENT
    );
  }

  /** Retorna nova instância com status "canceled" e updatedAt atualizado */
  cancel(): Charge {
    return new Charge({
      ...this.snapshot(),
      status: ChargeStatus.CANCELED,
      updatedAt: new Date(),
    });
  }

  /**
   * Retorna nova instância com status "expired" e updatedAt atualizado.
   * Usado pelo ExpireChargeUseCase que valida canExpire() antes de chamar.
   */
  expire(): Charge {
    return new Charge({
      ...this.snapshot(),
      status: ChargeStatus.EXPIRED,
      updatedAt: new Date(),
    });
  }

  /**
   * Transição para "paid" — pagamento confirmado via veredito do PSP.
   * Guarda: lança ConflictError se a cobrança já está em estado terminal.
   * Idempotente: o consumer verifica o status antes de chamar este método.
   */
  markAsPaid(): Charge {
    if (this.isTerminal()) {
      throw new ConflictError(
        `Transição inválida: cobrança em "${this.status}" não pode ser marcada como paga`,
        undefined,
        { chargeId: this.id, currentStatus: this.status },
      );
    }
    return new Charge({
      ...this.snapshot(),
      status: ChargeStatus.PAID,
      updatedAt: new Date(),
    });
  }

  /**
   * Transição para "failed" — pagamento recusado pelo PSP.
   * Guarda: lança ConflictError se a cobrança já está em estado terminal.
   */
  markAsFailed(): Charge {
    if (this.isTerminal()) {
      throw new ConflictError(
        `Transição inválida: cobrança em "${this.status}" não pode ser marcada como falha`,
        undefined,
        { chargeId: this.id, currentStatus: this.status },
      );
    }
    return new Charge({
      ...this.snapshot(),
      status: ChargeStatus.FAILED,
      updatedAt: new Date(),
    });
  }

  /**
   * Transição para "expired" via veredito de pagamento (boleto sem compensação).
   * Guarda: lança ConflictError se a cobrança já está em estado terminal.
   * Difere de expire() apenas pela presença da guarda — consumer usa este método.
   */
  markAsExpired(): Charge {
    if (this.isTerminal()) {
      throw new ConflictError(
        `Transição inválida: cobrança em "${this.status}" não pode ser expirada via pagamento`,
        undefined,
        { chargeId: this.id, currentStatus: this.status },
      );
    }
    return new Charge({
      ...this.snapshot(),
      status: ChargeStatus.EXPIRED,
      updatedAt: new Date(),
    });
  }

  /**
   * Seleciona o método de pagamento e solicita o pagamento, transitando para "awaiting_payment".
   * Guarda 1: lança ConflictError se a cobrança está em estado terminal.
   * Guarda 2: lança ConflictError se o método de pagamento já foi definido.
   * Imutável: retorna nova instância sem mutar a atual.
   */
  selectMethodAndRequestPayment(method: PaymentMethod): Charge {
    if (this.isTerminal()) {
      throw new ConflictError(
        `Transição inválida: cobrança em "${this.status}" não pode ter método de pagamento selecionado`,
        undefined,
        { chargeId: this.id, currentStatus: this.status },
      );
    }
    if (this.paymentMethod !== null) {
      throw new ConflictError(
        `Transição inválida: cobrança já possui método de pagamento definido como "${this.paymentMethod}"`,
        undefined,
        { chargeId: this.id, currentStatus: this.status },
      );
    }
    return new Charge({
      ...this.snapshot(),
      paymentMethod: method,
      status: ChargeStatus.AWAITING_PAYMENT,
      updatedAt: new Date(),
    });
  }

  /** Cópia imutável das props atuais para compor transições de estado */
  private snapshot(): ChargeProps {
    return {
      id: this.id,
      customerId: this.customerId,
      amount: this.amount,
      currency: this.currency,
      description: this.description,
      status: this.status,
      paymentLinkToken: this.paymentLinkToken,
      paymentMethod: this.paymentMethod,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
