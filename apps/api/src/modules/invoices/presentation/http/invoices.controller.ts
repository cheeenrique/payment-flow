import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '@/modules/auth/presentation/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/auth/presentation/http/guards/permissions.guard';
import { RequirePermissions } from '@/modules/auth/presentation/http/decorators/require-permissions.decorator';
import { Permissions } from '@/modules/auth/domain/rbac/permissions';
import { CurrentUser } from '@/modules/auth/presentation/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/modules/auth/presentation/http/strategies/jwt.strategy';
import { CreateInvoiceUseCase } from '@/modules/invoices/application/use-cases/create-invoice.use-case';
import { FindInvoiceUseCase } from '@/modules/invoices/application/use-cases/find-invoice.use-case';
import { FindInvoiceByPaymentUseCase } from '@/modules/invoices/application/use-cases/find-invoice-by-payment.use-case';
import { RequestInvoiceDto } from './dtos/request-invoice.dto';

/**
 * Controller REST do módulo invoices.
 * Endpoints de comando: POST /invoices/request (invoices:issue)
 * Endpoints de leitura: GET /invoices/:id, GET /payments/:id/invoice (invoices:read)
 * Autenticação (JwtAuthGuard) + autorização (PermissionsGuard).
 */
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(
    private readonly createInvoice: CreateInvoiceUseCase,
    private readonly findInvoice: FindInvoiceUseCase,
    private readonly findInvoiceByPayment: FindInvoiceByPaymentUseCase,
  ) {}

  /**
   * Solicita emissão manual de nota fiscal.
   * Útil quando o evento payment.approved não foi recebido ou a invoice falhou.
   */
  @Post('invoices/request')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permissions.InvoicesIssue)
  handleRequest(
    @Body() dto: RequestInvoiceDto,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    return this.createInvoice.execute({
      paymentId: dto.paymentId,
      chargeId: dto.chargeId,
      customerId: dto.customerId,
      amount: dto.amount,
      correlationId: randomUUID(),
    });
  }

  /** Consulta uma nota fiscal pelo seu ID */
  @Get('invoices/:id')
  @RequirePermissions(Permissions.InvoicesRead)
  handleFindById(@Param('id') id: string) {
    return this.findInvoice.execute(id);
  }

  /** Consulta a nota fiscal vinculada a um pagamento */
  @Get('payments/:id/invoice')
  @RequirePermissions(Permissions.InvoicesRead)
  handleFindByPayment(@Param('id') paymentId: string) {
    return this.findInvoiceByPayment.execute(paymentId);
  }
}
