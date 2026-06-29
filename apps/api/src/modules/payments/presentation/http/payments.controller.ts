import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '@/modules/auth/presentation/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/auth/presentation/http/guards/permissions.guard';
import { RequirePermissions } from '@/modules/auth/presentation/http/decorators/require-permissions.decorator';
import { Permissions } from '@/modules/auth/domain/rbac/permissions';
import { CreatePaymentUseCase } from '@/modules/payments/application/use-cases/create-payment.use-case';
import { ProcessPaymentUseCase } from '@/modules/payments/application/use-cases/process-payment.use-case';
import { FindPaymentUseCase } from '@/modules/payments/application/use-cases/find-payment.use-case';
import { FindPaymentsByChargeUseCase } from '@/modules/payments/application/use-cases/find-payments-by-charge.use-case';
import { ListPaymentsUseCase } from '@/modules/payments/application/use-cases/list-payments.use-case';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

/**
 * Controller REST — command-side do módulo Payments.
 * Responsável apenas por parsear entrada, delegar ao use case e formatar saída.
 * Autenticação via JwtAuthGuard + autorização via PermissionsGuard.
 */
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(
    private readonly createPayment: CreatePaymentUseCase,
    private readonly processPayment: ProcessPaymentUseCase,
    private readonly findPayment: FindPaymentUseCase,
    private readonly findByCharge: FindPaymentsByChargeUseCase,
    private readonly listPayments: ListPaymentsUseCase,
  ) {}

  /**
   * POST /payments — Cria e processa um pagamento manualmente.
   * Suporta idempotência via header Idempotency-Key.
   */
  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permissions.PaymentsApprove)
  async handleCreate(
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const correlationId = randomUUID();

    const result = await this.createPayment.execute({
      chargeId: dto.chargeId,
      customerId: dto.customerId,
      amount: dto.amount,
      method: dto.method,
      idempotencyKey: idempotencyKey,
      correlationId,
    });

    // Não reprocessar pagamentos já existentes (idempotência)
    if (!result.deduplicated) {
      await this.processPayment.execute(result.paymentId, correlationId);
    }

    return { paymentId: result.paymentId, status: result.status, deduplicated: result.deduplicated };
  }

  /** GET /payments — Lista todos os pagamentos, paginados por mais recentes */
  @Get('payments')
  @RequirePermissions(Permissions.PaymentsRead)
  async handleList(@Query() query: PaginationQueryDto) {
    return this.listPayments.execute({ page: query.page, limit: query.limit });
  }

  /** GET /payments/:id — Consulta um pagamento pelo ID */
  @Get('payments/:id')
  @RequirePermissions(Permissions.PaymentsRead)
  async handleFindOne(@Param('id') id: string) {
    return this.findPayment.execute(id);
  }

  /** GET /charges/:chargeId/payments — Lista pagamentos de uma cobrança, paginados */
  @Get('charges/:chargeId/payments')
  @RequirePermissions(Permissions.PaymentsRead)
  async handleFindByCharge(
    @Param('chargeId') chargeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.findByCharge.execute({ chargeId, page: query.page, limit: query.limit });
  }
}
