import { FindCustomerUseCase } from './find-customer.use-case';
import { NotFoundError } from '@/shared/errors/not-found.error';
import type { ICustomerRepository } from '@/modules/customers/domain/repositories/customer-repository.interface';
import { Customer } from '@/modules/customers/domain/entities/customer.entity';

function makeRepo(cliente: Customer | null): jest.Mocked<ICustomerRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(cliente),
    findByEmail: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
    list: jest.fn(),
  };
}

const fakeCustomer = Customer.create({
  name: 'Pedro Alves',
  email: 'pedro@example.com',
  document: '111.222.333-44',
  phone: '11977778888',
});

describe('FindCustomerUseCase', () => {
  describe('cliente encontrado', () => {
    it('retorna os dados do cliente quando id existe no repositório', async () => {
      const repo = makeRepo(fakeCustomer);
      const useCase = new FindCustomerUseCase(repo);

      const output = await useCase.execute(fakeCustomer.id);

      expect(output.id).toBe(fakeCustomer.id);
      expect(output.name).toBe(fakeCustomer.name);
      expect(output.email).toBe(fakeCustomer.email);
      expect(output.document).toBe(fakeCustomer.document);
      expect(output.phone).toBe(fakeCustomer.phone);
      expect(output.status).toBe('active');
    });

    it('retorna createdAt e updatedAt como Date', async () => {
      const repo = makeRepo(fakeCustomer);
      const useCase = new FindCustomerUseCase(repo);

      const output = await useCase.execute(fakeCustomer.id);

      expect(output.createdAt).toBeInstanceOf(Date);
      expect(output.updatedAt).toBeInstanceOf(Date);
    });

    it('consulta o repositório com o id fornecido', async () => {
      const repo = makeRepo(fakeCustomer);
      const useCase = new FindCustomerUseCase(repo);

      await useCase.execute('id-qualquer');

      expect(repo.findById).toHaveBeenCalledWith('id-qualquer');
    });
  });

  describe('cliente não encontrado', () => {
    it('lança NotFoundError quando id não existe', async () => {
      const repo = makeRepo(null);
      const useCase = new FindCustomerUseCase(repo);

      await expect(useCase.execute('id-inexistente')).rejects.toThrow(NotFoundError);
    });

    it('NotFoundError usa código NOT_FOUND e statusCode 404', async () => {
      const repo = makeRepo(null);
      const useCase = new FindCustomerUseCase(repo);

      const err = await useCase.execute('id-inexistente').catch((e) => e);

      expect(err.code).toBe('NOT_FOUND');
      expect(err.statusCode).toBe(404);
    });

    it('NotFoundError inclui o id consultado no context', async () => {
      const repo = makeRepo(null);
      const useCase = new FindCustomerUseCase(repo);

      const err = await useCase.execute('meu-id').catch((e) => e);

      expect(err.context).toEqual(expect.objectContaining({ id: 'meu-id' }));
    });
  });
});
