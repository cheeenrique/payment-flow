import { ListCustomersUseCase } from './list-customers.use-case';
import type { ICustomerRepository } from '@/modules/customers/domain/repositories/customer-repository.interface';
import { Customer } from '@/modules/customers/domain/entities/customer.entity';

function criarCliente(suffix: string): Customer {
  return Customer.create({
    name: `Cliente ${suffix}`,
    email: `cliente${suffix}@example.com`,
    document: `000.000.000-${suffix}`,
  });
}

function criarRepo(items: Customer[], total: number): jest.Mocked<ICustomerRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    list: jest.fn().mockResolvedValue({ items, total }),
  };
}

describe('ListCustomersUseCase', () => {
  describe('listagem com resultados', () => {
    it('retorna PaginatedResult com items mapeados para CustomerOutput', async () => {
      const clientes = [criarCliente('01'), criarCliente('02')];
      const repo = criarRepo(clientes, 2);
      const useCase = new ListCustomersUseCase(repo);

      const result = await useCase.execute({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Cliente 01');
      expect(result.items[1].name).toBe('Cliente 02');
    });

    it('preserva total, page e limit no resultado', async () => {
      const repo = criarRepo([criarCliente('01')], 50);
      const useCase = new ListCustomersUseCase(repo);

      const result = await useCase.execute({ page: 3, limit: 15 });

      expect(result.total).toBe(50);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(15);
    });

    it('inclui todos os campos esperados no CustomerOutput', async () => {
      const cliente = criarCliente('99');
      const repo = criarRepo([cliente], 1);
      const useCase = new ListCustomersUseCase(repo);

      const result = await useCase.execute({ page: 1, limit: 10 });
      const item = result.items[0];

      expect(item.id).toBe(cliente.id);
      expect(item.name).toBe(cliente.name);
      expect(item.email).toBe(cliente.email);
      expect(item.document).toBe(cliente.document);
      expect(item.status).toBe('active');
      expect(item.createdAt).toBeInstanceOf(Date);
      expect(item.updatedAt).toBeInstanceOf(Date);
    });

    it('repassa page e limit corretos para o repositório', async () => {
      const repo = criarRepo([], 0);
      const useCase = new ListCustomersUseCase(repo);

      await useCase.execute({ page: 2, limit: 25 });

      expect(repo.list).toHaveBeenCalledWith({ page: 2, limit: 25 });
    });
  });

  describe('listagem vazia', () => {
    it('retorna items=[] e total=0 quando repositório está vazio', async () => {
      const repo = criarRepo([], 0);
      const useCase = new ListCustomersUseCase(repo);

      const result = await useCase.execute({ page: 1, limit: 10 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
