import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs';

export interface SsePayload {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Shared SSE hub. Domain modules inject this service and call emit()
 * to push real-time events to all connected frontend clients.
 *
 * The Subject is intentionally never completed so the stream stays live
 * for the entire application lifetime.
 */
@Injectable()
export class SseService {
  private readonly events$ = new Subject<SsePayload>();

  emit(payload: SsePayload): void {
    this.events$.next(payload);
  }

  stream(): Observable<MessageEvent> {
    return this.events$.asObservable().pipe(
      map(
        // NÃO define MessageEvent.type: mantém o evento "default" para que o
        // EventSource.onmessage do frontend dispare. O envelope vai em `data`
        // como { type, payload }, alinhado com o dispatcher do frontend e as docs.
        (event): MessageEvent => ({
          data: { type: event.type, payload: event.data },
        }),
      ),
    );
  }
}
