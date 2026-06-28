import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';
import { GetDashboardSummaryUseCase } from '@/modules/dashboard/application/use-cases/get-dashboard-summary.use-case';
import type { DashboardSummaryData } from '@/modules/dashboard/application/use-cases/get-dashboard-summary.use-case';
import {
  ChargesSummaryType,
  DashboardSummaryType,
  InvoicesSummaryType,
  PaymentsSummaryType,
} from './types/dashboard-summary.type';

/**
 * Resolver GraphQL code-first do módulo dashboard.
 * Expõe a query `dashboard` que retorna contagens agregadas por status
 * de charges, payments e invoices — leitura pura (CQRS read side).
 */
@Resolver(() => DashboardSummaryType)
@UseGuards(GqlAuthGuard)
export class DashboardResolver {
  constructor(private readonly getDashboardSummary: GetDashboardSummaryUseCase) {}

  /** Retorna o resumo agregado do dashboard com contagens por status e taxa de aprovação */
  @Query(() => DashboardSummaryType, { name: 'dashboard' })
  async dashboard(): Promise<DashboardSummaryType> {
    const data = await this.getDashboardSummary.execute();
    return this.toType(data);
  }

  /** Mapeia o read model do caso de uso para o tipo GraphQL de apresentação */
  private toType(data: DashboardSummaryData): DashboardSummaryType {
    const charges = Object.assign(new ChargesSummaryType(), data.charges);
    const payments = Object.assign(new PaymentsSummaryType(), data.payments);
    const invoices = Object.assign(new InvoicesSummaryType(), data.invoices);

    const summary = new DashboardSummaryType();
    summary.charges = charges;
    summary.payments = payments;
    summary.invoices = invoices;
    summary.approvalRate = data.approvalRate;
    return summary;
  }
}
