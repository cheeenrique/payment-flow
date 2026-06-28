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
        (payload): MessageEvent => ({
          data: { type: payload.type, data: payload.data },
          type: payload.type,
        }),
      ),
    );
  }
}
