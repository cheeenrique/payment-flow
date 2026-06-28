import { SseService } from './sse.service';
import type { MessageEvent } from '@nestjs/common';

describe('SseService.streamForCharge', () => {
  it('emite somente o evento cujo chargeId bate com o informado', (done) => {
    const service = new SseService();
    const received: MessageEvent[] = [];

    const sub = service.streamForCharge('c1').subscribe({
      next: (event) => received.push(event),
    });

    service.emit({ type: 'charge.updated', data: { chargeId: 'outra-cobranca', status: 'paid' } });
    service.emit({ type: 'charge.paid', data: { chargeId: 'c1', status: 'paid' } });

    setImmediate(() => {
      expect(received).toHaveLength(1);
      expect(received[0].data).toEqual({
        type: 'charge.paid',
        payload: { chargeId: 'c1', status: 'paid' },
      });
      sub.unsubscribe();
      done();
    });
  });

  it('não emite nada quando nenhum evento pertence ao chargeId informado', (done) => {
    const service = new SseService();
    const received: MessageEvent[] = [];

    const sub = service.streamForCharge('c1').subscribe({
      next: (event) => received.push(event),
    });

    service.emit({ type: 'charge.updated', data: { chargeId: 'outra-cobranca', status: 'canceled' } });

    setImmediate(() => {
      expect(received).toHaveLength(0);
      sub.unsubscribe();
      done();
    });
  });
});
