import { Controller, Sse } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';

/**
 * Exposes the SSE stream at GET /events/stream.
 * Clients connect via EventSource and receive real-time domain events.
 */
@Controller()
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('events/stream')
  stream(): Observable<MessageEvent> {
    return this.sseService.stream();
  }
}
