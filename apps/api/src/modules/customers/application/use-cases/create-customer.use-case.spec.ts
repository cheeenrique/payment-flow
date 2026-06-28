import { CreateCustomerUseCase, CreateCustomerInput } from './create-customer.use-case';
import { ConflictError } from '@/shared/errors/conflict.error';
import type { ICustomerRepository } from '@/modules/customers/domain/repositories/customer-repository.interface';
import type { EventBusService } from '@/infra/messaging/event-bus.service';
import type { SseService } from '@/infra/sse/sse.service';

function makeMocks(emailAlreadyExists = false) {
  const customerRepo: jest.Mocked<ICustomerRepository> = {
    create: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(emailAlreadyExists ? { id: 'existing' } : null),
    update: jest.fn().mockResolvedValue(undefined),
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  };

  const eventBus = {
    publish: jest.fn(),
    republish: jest.fn(),
  } as unknown as jest.Mocked<EventBusService>;

  const sseService = {
    emit: jest.fn(),
    stream: jest.fn(),
  } as unknown as jest.Mocked<SseService>;

  return { customerRepo, eventBus, sseService };
}

const validInput: CreateCustomerInput = {
  name: 'Ana Lima',
  email: 'ana@example.com',
  document: '987.654.321-00',
  phone: '11944445555',
};

describe('CreateCustomerUseCase', () => {
  describe('criação bem-sucedida', () => {
    it('retorna os dados do cliente criado', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      const output = await useCase.execute(validInput);

      expect(output.id).toBeTruthy();
      expect(output.name).toBe(validInput.name);
      expect(output.email).toBe('ana@example.com');
      expect(output.document).toBe(validInput.document);
      expect(output.phone).toBe(validInput.phone);
      expect(output.status).toBe('active');
    });

    it('normaliza email para lowercase e trim antes de salvar', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      await useCase.execute({ ...validInput, email: '  ANA@EXAMPLE.COM  ' });

      expect(customerRepo.findByEmail).toHaveBeenCalledWith('ana@example.com');
      expect(customerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ana@example.com' }),
      );
    });

    it('persiste o cliente no repositório uma única vez', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      await useCase.execute(validInput);

      expect(customerRepo.create).toHaveBeenCalledTimes(1);
    });

    it('publica evento customer.created.v1 no eventBus', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      await useCase.execute(validInput);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'customer.created.v1' }),
      );
    });

    it('emite evento customer.created via SSE', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      await useCase.execute(validInput);

      expect(sseService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'customer.created' }),
      );
    });

    it('retorna createdAt e updatedAt como Date', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      const output = await useCase.execute(validInput);

      expect(output.createdAt).toBeInstanceOf(Date);
      expect(output.updatedAt).toBeInstanceOf(Date);
    });

    it('funciona sem phone (campo opcional)', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      const output = await useCase.execute({ name: 'Sem Fone', email: 'semfone@x.com', document: '000' });

      expect(output.phone).toBeUndefined();
    });
  });

  describe('email duplicado', () => {
    it('lança ConflictError quando o email já está cadastrado', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks(true);
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      await expect(useCase.execute(validInput)).rejects.toThrow(ConflictError);
    });

    it('não persiste nem emite eventos quando email está duplicado', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks(true);
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      await expect(useCase.execute(validInput)).rejects.toThrow(ConflictError);

      expect(customerRepo.create).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(sseService.emit).not.toHaveBeenCalled();
    });

    it('ConflictError usa código CONFLICT e statusCode 409', async () => {
      const { customerRepo, eventBus, sseService } = makeMocks(true);
      const useCase = new CreateCustomerUseCase(customerRepo, eventBus, sseService);

      const err = await useCase.execute(validInput).catch((e) => e);

      expect(err.code).toBe('CONFLICT');
      expect(err.statusCode).toBe(409);
    });
  });
});
