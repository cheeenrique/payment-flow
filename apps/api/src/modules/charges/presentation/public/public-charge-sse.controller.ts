import { Controller, Req, Sse, UseGuards } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { SseService } from '@/infra/sse/sse.service';
import { LinkTokenGuard } from './link-token.guard';
import type { RequestWithChargeId } from './link-token.guard';

/**
 * SSE público do checkout — sem autenticação JWT.
 * O token do link de pagamento serve como credencial; o LinkTokenGuard valida
 * o token via repositório e resolve o chargeId antes de entrar no handler.
 *
 * O EventSource do browser conecta nesta rota e recebe apenas eventos da
 * cobrança correspondente ao token — sem vazar dados de outras cobranças.
 */
@Controller()
export class PublicChargeSseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * GET /pay/:token/stream
   * Retorna stream SSE filtrado pela cobrança do token.
   */
  @UseGuards(LinkTokenGuard)
  @Sse('pay/:token/stream')
  stream(@Req() req: RequestWithChargeId): Observable<MessageEvent> {
    return this.sseService.streamForCharge(req.chargeId);
  }
}
