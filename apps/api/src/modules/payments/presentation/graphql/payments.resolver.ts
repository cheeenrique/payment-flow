import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';
import { FindPaymentUseCase } from '@/modules/payments/application/use-cases/find-payment.use-case';
import { FindPaymentsByChargeUseCase } from '@/modules/payments/application/use-cases/find-payments-by-charge.use-case';
import { buildPaginationMeta } from '@/shared/pagination/pagination-meta.helper';
import { PaymentType, PaymentsPageType } from './types/payment.type';
import type { Payment } from '@/modules/payments/domain/entities/payment.entity';

/**
 * Resolver GraphQL code-first — query-side do módulo Payments.
 * Expõe consultas de leitura; mutações ocorrem via REST (command-side).
 */
@Resolver(() => PaymentType)
@UseGuards(GqlAuthGuard)
export class PaymentsResolver {
  constructor(
    private readonly findPayment: FindPaymentUseCase,
    private readonly findByCharge: FindPaymentsByChargeUseCase,
  ) {}

  /** Consulta um pagamento pelo ID */
  @Query(() => PaymentType, { name: 'payment', nullable: true })
  async queryPayment(@Args('id') id: string): Promise<PaymentType | null> {
    const payment = await this.findPayment.execute(id);
    return payment ? this.toType(payment) : null;
  }

  /** Lista paginada de pagamentos de uma cobrança */
  @Query(() => PaymentsPageType, { name: 'paymentsByCharge' })
  async queryPaymentsByCharge(
    @Args('chargeId') chargeId: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<PaymentsPageType> {
    const result = await this.findByCharge.execute({ chargeId, page, limit });
    const { hasNext, hasPrev } = buildPaginationMeta(result);
    return {
      items: result.items.map((p) => this.toType(p)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext,
      hasPrev,
    };
  }

  /** Mapeia entidade de domínio para tipo GraphQL */
  private toType(payment: Payment): PaymentType {
    const type = new PaymentType();
    type.id = payment.id;
    type.chargeId = payment.chargeId;
    type.customerId = payment.customerId;
    type.amount = payment.amount;
    type.method = payment.method;
    type.status = payment.status;
    type.failureReason = payment.failureReason;
    type.createdAt = payment.createdAt;
    type.updatedAt = payment.updatedAt;
    return type;
  }
}
