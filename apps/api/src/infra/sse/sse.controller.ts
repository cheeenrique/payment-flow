import { Controller, Sse, UseGuards } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';
import { SseJwtGuard } from './sse-jwt.guard';

/**
 * Expõe o stream SSE em GET /events/stream.
 * Clientes conectam via EventSource e recebem eventos de domínio em tempo real.
 *
 * Conexão protegida por JWT: o token chega pela query string (?token=JWT),
 * pois o EventSource do browser não envia headers customizados.
 */
@Controller()
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @UseGuards(SseJwtGuard)
  @Sse('events/stream')
  stream(): Observable<MessageEvent> {
    return this.sseService.stream();
  }
}
