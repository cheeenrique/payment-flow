import { Module } from '@nestjs/common';
import { ChargesModule } from '@/modules/charges/charges.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { InvoicesModule } from '@/modules/invoices/invoices.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import { DashboardResolver } from './presentation/graphql/dashboard.resolver';

/**
 * Módulo de dashboard — leitura agregada (CQRS read side).
 *
 * Importa ChargesModule, PaymentsModule e InvoicesModule para reusar seus
 * repositórios exportados via token DI. Nenhum schema Mongoose é duplicado:
 * a infraestrutura de banco é gerenciada pelos módulos de origem.
 *
 * GraphQL:
 *   query dashboard — retorna DashboardSummary com contagens por status
 *                     e taxa de aprovação de pagamentos.
 */
@Module({
  imports: [
    // Provê CHARGE_REPOSITORY exportado para o caso de uso de dashboard
    ChargesModule,
    // Provê PAYMENT_REPOSITORY exportado para o caso de uso de dashboard
    PaymentsModule,
    // Provê INVOICE_REPOSITORY exportado para o caso de uso de dashboard
    InvoicesModule,
    // Provê JwtAuthGuard, JwtStrategy e PassportModule para o GqlAuthGuard
    AuthModule,
  ],
  providers: [
    GetDashboardSummaryUseCase,
    DashboardResolver,
  ],
})
export class DashboardModule {}
