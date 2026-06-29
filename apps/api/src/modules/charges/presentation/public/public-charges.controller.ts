import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { GetChargeByTokenUseCase } from '@/modules/charges/application/use-cases/get-charge-by-token.use-case';
import { ConfirmPaymentLinkUseCase } from '@/modules/charges/application/use-cases/confirm-payment-link.use-case';
import { ConfirmPaymentDto } from './dtos/confirm-payment.dto';

/**
 * Controller público do checkout — sem autenticação.
 * Expõe a vista pública de uma cobrança e recebe a confirmação do método de pagamento.
 */
@Controller('pay')
export class PublicChargesController {
  constructor(
    private readonly getChargeByTokenUseCase: GetChargeByTokenUseCase,
    private readonly confirmPaymentLinkUseCase: ConfirmPaymentLinkUseCase,
  ) {}

  /** GET /pay/:token — retorna a vista pública da cobrança sem campos sensíveis */
  @Get(':token')
  handleGetByToken(@Param('token') token: string) {
    return this.getChargeByTokenUseCase.execute(token);
  }

  /** POST /pay/:token/confirm — confirma o método de pagamento e solicita o processamento */
  @Post(':token/confirm')
  @HttpCode(HttpStatus.OK)
  handleConfirm(@Param('token') token: string, @Body() dto: ConfirmPaymentDto) {
    return this.confirmPaymentLinkUseCase.execute({ token, method: dto.method });
  }
}
