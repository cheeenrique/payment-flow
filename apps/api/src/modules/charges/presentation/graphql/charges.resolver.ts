import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';
import { GetChargeUseCase } from '@/modules/charges/application/use-cases/get-charge.use-case';
import { ListChargesUseCase } from '@/modules/charges/application/use-cases/list-charges.use-case';
import { buildPaginationMeta } from '@/shared/pagination/pagination-meta.helper';
import { ChargeType, ChargesPageType } from './charge.type';

/**
 * Resolver GraphQL code-first do módulo charges (lado de leitura — CQRS pragmático).
 * Expõe queries de consulta; mutações ocorrem via REST.
 */
@Resolver(() => ChargeType)
@UseGuards(GqlAuthGuard)
export class ChargesResolver {
  constructor(
    private readonly getChargeUseCase: GetChargeUseCase,
    private readonly listChargesUseCase: ListChargesUseCase,
  ) {}

  /** Lista paginada de cobranças com filtros opcionais de status e customerId */
  @Query(() => ChargesPageType, { name: 'charges' })
  async listCharges(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @Args('status', { nullable: true }) status?: string,
    @Args('customerId', { nullable: true }) customerId?: string,
  ): Promise<ChargesPageType> {
    const result = await this.listChargesUseCase.execute({
      page,
      limit,
      status,
      customerId,
    });
    const { hasNext, hasPrev } = buildPaginationMeta(result);
    return {
      items: result.items as ChargeType[],
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext,
      hasPrev,
    };
  }

  /** Retorna uma cobrança específica pelo ID */
  @Query(() => ChargeType, { name: 'charge' })
  getCharge(@Args('id') id: string) {
    return this.getChargeUseCase.execute(id);
  }
}
