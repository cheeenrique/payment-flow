import { randomUUID } from 'node:crypto';

/** Possíveis estados de uma nota fiscal no ciclo de emissão */
export type InvoiceStatus = 'requested' | 'processing' | 'issued' | 'failed';

export interface InvoiceProps {
  id: string;
  paymentId: string;
  chargeId: string;
  customerId: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: Date | null;
  externalReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidade Invoice — representa a nota fiscal gerada após um pagamento aprovado.
 * Imutável: cada transição de estado retorna uma nova instância sem mutar a original.
 */
export class Invoice {
  readonly id: string;
  readonly paymentId: string;
  readonly chargeId: string;
  readonly customerId: string;
  readonly amount: number;
  readonly status: InvoiceStatus;
  readonly issuedAt: Date | null;
  readonly externalReference: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: InvoiceProps) {
    this.id = props.id;
    this.paymentId = props.paymentId;
    this.chargeId = props.chargeId;
    this.customerId = props.customerId;
    this.amount = props.amount;
    this.status = props.status;
    this.issuedAt = props.issuedAt;
    this.externalReference = props.externalReference;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Cria uma nova invoice no estado inicial (requested) */
  static create(
    props: Pick<InvoiceProps, 'paymentId' | 'chargeId' | 'customerId' | 'amount'>,
  ): Invoice {
    const now = new Date();
    return new Invoice({
      ...props,
      id: randomUUID(),
      status: 'requested',
      issuedAt: null,
      externalReference: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Transição: requested → processing */
  markProcessing(): Invoice {
    return new Invoice({ ...this.toProps(), status: 'processing', updatedAt: new Date() });
  }

  /** Transição: processing → issued */
  markIssued(externalReference: string): Invoice {
    const now = new Date();
    return new Invoice({
      ...this.toProps(),
      status: 'issued',
      issuedAt: now,
      externalReference,
      updatedAt: now,
    });
  }

  /** Transição: processing → failed */
  markFailed(): Invoice {
    return new Invoice({ ...this.toProps(), status: 'failed', updatedAt: new Date() });
  }

  /**
   * Reinicia a invoice para o estado inicial.
   * Permitido apenas quando o status é 'failed' (reprocessamento via simulator).
   */
  resetToRequested(): Invoice {
    return new Invoice({
      ...this.toProps(),
      status: 'requested',
      issuedAt: null,
      externalReference: null,
      updatedAt: new Date(),
    });
  }

  /** Verifica se a nota fiscal já foi emitida (estado terminal de sucesso) */
  isIssued(): boolean {
    return this.status === 'issued';
  }

  /** Verifica se a emissão está em andamento (aguardando processamento) */
  isInProgress(): boolean {
    return this.status === 'requested' || this.status === 'processing';
  }

  private toProps(): InvoiceProps {
    return {
      id: this.id,
      paymentId: this.paymentId,
      chargeId: this.chargeId,
      customerId: this.customerId,
      amount: this.amount,
      status: this.status,
      issuedAt: this.issuedAt,
      externalReference: this.externalReference,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
