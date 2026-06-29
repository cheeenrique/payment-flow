import { ListPaymentsUseCase } from './list-payments.use-case';
import { Payment } from '@/modules/payments/domain/entities/payment.entity';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';

function makeRepo(items: Payment[] = [], total = 0): jest.Mocked<IPaymentRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findByChargeId: jest.fn(),
    findByIdempotencyKey: jest.fn(),
    findActiveByChargeId: jest.fn(),
    countByStatus: jest.fn(),
    findMany: jest.fn().mockResolvedValue({ items, total }),
  };
}

function makePayment(): Payment {
  return Payment.create({
    chargeId: 'charge-uuid',
    customerId: 'customer-uuid',
    amount: 5000,
    method: 'pix',
  });
}

describe('ListPaymentsUseCase', () => {
  it('retorna PaginatedResult com items e total do repositório', async () => {
    const p1 = makePayment();
    const p2 = makePayment();
    const repo = makeRepo([p1, p2], 2);
    const useCase = new ListPaymentsUseCase(repo);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toEqual([p1, p2]);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('passa page e limit corretos para findMany', async () => {
    const repo = makeRepo([], 0);
    const useCase = new ListPaymentsUseCase(repo);

    await useCase.execute({ page: 3, limit: 10 });

    expect(repo.findMany).toHaveBeenCalledWith(3, 10);
  });

  it('retorna lista vazia quando não há pagamentos', async () => {
    const repo = makeRepo([], 0);
    const useCase = new ListPaymentsUseCase(repo);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('preserva page e limit no resultado para cálculo de meta pelo interceptor', async () => {
    const repo = makeRepo([], 100);
    const useCase = new ListPaymentsUseCase(repo);

    const result = await useCase.execute({ page: 2, limit: 5 });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
  });
});
