/** Status possíveis de uma cobrança */
export type ChargeStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'canceled'

/** Representa uma cobrança no domínio de pagamentos */
export interface Charge {
  id: string
  status: ChargeStatus
  amount: number
  currency: string
  customerId: string
  createdAt: string
  updatedAt: string
}

/** Status possíveis de um pagamento */
export type PaymentStatus = 'processing' | 'approved' | 'failed'

/** Representa um pagamento associado a uma cobrança */
export interface Payment {
  id: string
  chargeId: string
  status: PaymentStatus
  amount: number
  currency: string
  method: string
  createdAt: string
  updatedAt: string
}

/** Status possíveis de uma fatura */
export type InvoiceStatus = 'requested' | 'processing' | 'issued' | 'failed'

/** Representa uma fatura gerada no fluxo de pagamento */
export interface Invoice {
  id: string
  paymentId: string
  chargeId?: string
  status: InvoiceStatus
  amount: number
  currency: string
  /** Referência externa da nota fiscal emitida (ex: número NF-e) */
  externalReference?: string
  /** Data de emissão — presente apenas quando status é 'issued' */
  issuedAt?: string
  createdAt: string
  updatedAt: string
}

/** Evento de domínio registrado na timeline — campos conforme contrato GraphQL */
export interface TimelineEvent {
  id: string
  eventType: string
  aggregateId: string
  aggregateType: string
  correlationId: string
  timestamp: string
}

/** Notificação destinada ao usuário */
export interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

/** DTO para criação de uma nova cobrança via POST /charges */
export interface CreateChargeDto {
  customerId: string
  amount: number
  paymentMethod: string
  description?: string
  expiresAt?: string
}
