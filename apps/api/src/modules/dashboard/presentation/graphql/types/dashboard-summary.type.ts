import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/** Contagens de cobranças por status — sub-tipo do DashboardSummary */
@ObjectType('ChargesSummary')
export class ChargesSummaryType {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  pending!: number;

  /** Cobranças aguardando pagamento (status awaiting_payment) */
  @Field(() => Int)
  awaitingPayment!: number;

  @Field(() => Int)
  paid!: number;

  @Field(() => Int)
  canceled!: number;

  @Field(() => Int)
  expired!: number;

  @Field(() => Int)
  failed!: number;
}

/** Contagens de pagamentos por status — sub-tipo do DashboardSummary */
@ObjectType('PaymentsSummary')
export class PaymentsSummaryType {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  pending!: number;

  @Field(() => Int)
  processing!: number;

  @Field(() => Int)
  approved!: number;

  @Field(() => Int)
  failed!: number;

  @Field(() => Int)
  expired!: number;
}

/** Contagens de notas fiscais por status — sub-tipo do DashboardSummary */
@ObjectType('InvoicesSummary')
export class InvoicesSummaryType {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  requested!: number;

  @Field(() => Int)
  processing!: number;

  @Field(() => Int)
  issued!: number;

  @Field(() => Int)
  failed!: number;
}

/** Resumo agregado do dashboard — retornado pela query `dashboard` */
@ObjectType('DashboardSummary')
export class DashboardSummaryType {
  @Field(() => ChargesSummaryType)
  charges!: ChargesSummaryType;

  @Field(() => PaymentsSummaryType)
  payments!: PaymentsSummaryType;

  @Field(() => InvoicesSummaryType)
  invoices!: InvoicesSummaryType;

  /**
   * Taxa de aprovação de pagamentos em percentual (0–100).
   * Calculado como: approved / (approved + failed + expired) × 100.
   * Retorna 0 quando não há pagamentos finalizados.
   */
  @Field(() => Float)
  approvalRate!: number;
}
